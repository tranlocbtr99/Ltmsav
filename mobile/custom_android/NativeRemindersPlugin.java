package com.ltmsav.app;

import android.Manifest;
import android.os.Build;
import com.getcapacitor.*;
import com.getcapacitor.annotation.*;
import org.json.*;

@CapacitorPlugin(name="NativeReminders",permissions={@Permission(alias="notifications",strings={Manifest.permission.POST_NOTIFICATIONS})})
public class NativeRemindersPlugin extends Plugin {
    @PluginMethod public void enable(PluginCall call){
        ReminderReceiver.channel(getContext());
        if(Build.VERSION.SDK_INT>=33 && getPermissionState("notifications")!=PermissionState.GRANTED)requestPermissionForAlias("notifications",call,"permissionResult");
        else permissionResult(call);
    }
    @PermissionCallback private void permissionResult(PluginCall call){
        JSObject result=new JSObject();result.put("granted",ReminderReceiver.allowed(getContext()));call.resolve(result);
    }
    @PluginMethod public void sync(PluginCall call){
        try {
            JSONArray input=call.getArray("rules",new JSArray()), checked=new JSONArray();
            for(int i=0;i<input.length();i++){
                JSONObject r=input.getJSONObject(i);String id=r.getString("id"),date=r.getString("nextDueDate");int day=r.getInt("dayOfMonth");
                if(id.isEmpty()||id.length()>200||day<1||day>31||!date.matches("\\d{4}-(0[1-9]|1[0-2])-([0-2][0-9]|3[01])"))throw new JSONException("Invalid rule");
                checked.put(new JSONObject().put("id",id).put("dayOfMonth",day).put("nextDueDate",date));
            }
            JSONObject config=new JSONObject().put("enabled",call.getBoolean("enabled",false)).put("rules",checked)
                .put("title",call.getString("title","LTMsav")).put("body",call.getString("body","Open LTMsav"));
            ReminderReceiver.cancel(getContext());
            if(!ReminderReceiver.prefs(getContext()).edit().putString("config",config.toString()).commit())throw new Exception("Cannot save reminders");
            if(config.optBoolean("enabled")&&ReminderReceiver.allowed(getContext())){
                for(int i=0;i<checked.length();i++)ReminderReceiver.schedule(getContext(),checked.getJSONObject(i));
            }
            call.resolve();
        }catch(Exception error){call.reject("Cannot synchronize reminders",error);}
    }
}
