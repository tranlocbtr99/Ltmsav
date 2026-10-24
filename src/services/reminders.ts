import {Capacitor,registerPlugin} from '@capacitor/core';
import {RecurringTransaction} from '../types';
interface NativeReminders {
  enable():Promise<{granted:boolean}>;
  sync(options:{enabled:boolean;title:string;body:string;rules:{id:string;dayOfMonth:number;nextDueDate:string}[]}):Promise<void>;
}
const native=registerPlugin<NativeReminders>('NativeReminders');
let queue:Promise<void>=Promise.resolve();
export const reminderService={
  available:()=>Capacitor.getPlatform()==='android'&&Capacitor.isPluginAvailable('NativeReminders'),
  async enable(){if(!this.available())return false;return (await native.enable()).granted;},
  sync(rules:RecurringTransaction[],enabled:boolean,title:string,body:string){
    if(!this.available())return Promise.resolve();
    // Serialize native updates so an older async response cannot restore canceled alarms.
    const options={enabled,title,body,rules:rules.filter(r=>r.enabled).map(({id,dayOfMonth,nextDueDate})=>({id,dayOfMonth,nextDueDate}))};
    queue=queue.catch(()=>{}).then(()=>native.sync(options));return queue;
  }
};
