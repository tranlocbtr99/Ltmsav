import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ltmsav-reminder-'));
try {
 const test=path.join(dir,'ReminderDatesTest.java');
 fs.writeFileSync(test,`import com.ltmsav.app.ReminderDates;import java.util.*;import java.text.*;
public class ReminderDatesTest {
 static final TimeZone Z=TimeZone.getTimeZone("Asia/Ho_Chi_Minh");
 static long time(String s)throws Exception {SimpleDateFormat f=new SimpleDateFormat("yyyy-MM-dd HH:mm");f.setTimeZone(Z);return f.parse(s).getTime();}
 static void check(String expected,long actual)throws Exception {if(time(expected)!=actual)throw new AssertionError(expected+" != "+new Date(actual));}
 public static void main(String[] args)throws Exception {
 check("2024-02-29 09:00",ReminderDates.next("2024-01-31",31,"2024-01",time("2024-02-01 08:00"),Z));
 check("2026-02-28 09:00",ReminderDates.next("2026-01-31",31,"2026-01",time("2026-02-01 08:00"),Z));
 check("2026-03-31 09:00",ReminderDates.next("2026-02-28",31,"2026-02",time("2026-03-01 08:00"),Z));
 check("2027-01-31 09:00",ReminderDates.next("2026-12-31",31,"2026-12",time("2027-01-01 08:00"),Z));
 long now=time("2026-10-24 10:00");if(ReminderDates.next("2020-01-31",31,"",now,Z)!=now+60000)throw new AssertionError("catchup");
 check("2026-11-30 09:00",ReminderDates.next("2020-01-31",31,"2026-10",now,Z));
 if(!"2027-01".equals(ReminderDates.month(time("2027-01-01 00:01"),Z)))throw new AssertionError("timezone");
 System.out.println("7 native calendar reminder assertions passed");
 }}
`);
 execFileSync('javac',['-d',dir,'mobile/custom_android/ReminderDates.java',test],{stdio:'inherit'});
 execFileSync('java',['-cp',dir,'ReminderDatesTest'],{stdio:'inherit'});
}finally{fs.rmSync(dir,{recursive:true,force:true});}
