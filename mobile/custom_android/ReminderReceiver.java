package com.ltmsav.app;

import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import org.json.*;
import java.util.TimeZone;

public class ReminderReceiver extends BroadcastReceiver {
    static final String PREFS="ltmsav_reminders", CHANNEL="monthly_reminders";
    static SharedPreferences prefs(Context c){return c.getSharedPreferences(PREFS,Context.MODE_PRIVATE);}
    static void channel(Context c){if(Build.VERSION.SDK_INT>=26)c.getSystemService(NotificationManager.class).createNotificationChannel(new NotificationChannel(CHANNEL,"LTMsav",NotificationManager.IMPORTANCE_DEFAULT));}
    static boolean allowed(Context c){
        if(Build.VERSION.SDK_INT>=33&&c.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)return false;
        NotificationManager n=c.getSystemService(NotificationManager.class);
        if(Build.VERSION.SDK_INT>=24&&!n.areNotificationsEnabled())return false;
        return Build.VERSION.SDK_INT<26||n.getNotificationChannel(CHANNEL)==null||n.getNotificationChannel(CHANNEL).getImportance()!=NotificationManager.IMPORTANCE_NONE;
    }
    static PendingIntent alarm(Context c,String id){
        Intent i=new Intent(c,ReminderReceiver.class).setAction("com.ltmsav.app.MONTHLY_REMINDER").setData(Uri.parse("ltmsav-reminder:"+Uri.encode(id))).putExtra("id",id);
        return PendingIntent.getBroadcast(c,0,i,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
    }
    static JSONArray rules(Context c){try{return new JSONObject(prefs(c).getString("config","{}")).optJSONArray("rules");}catch(Exception e){return null;}}
    static void cancel(Context c){
        JSONArray rules=rules(c);if(rules==null)return;
        AlarmManager a=c.getSystemService(AlarmManager.class);
        for(int i=0;i<rules.length();i++){JSONObject r=rules.optJSONObject(i);if(r!=null)a.cancel(alarm(c,r.optString("id")));}
    }
    static void reschedule(Context c){
        try {
            JSONObject config=new JSONObject(prefs(c).getString("config","{}"));
            if(!config.optBoolean("enabled")||!allowed(c))return;
            JSONArray rules=config.optJSONArray("rules");if(rules==null)return;
            for(int i=0;i<rules.length();i++)schedule(c,rules.getJSONObject(i));
        }catch(Exception ignored){}
    }
    static void schedule(Context c,JSONObject rule)throws JSONException {
        String id=rule.getString("id"),due=rule.getString("nextDueDate");int day=rule.getInt("dayOfMonth");
        long at=ReminderDates.next(due,day,prefs(c).getString("delivered:"+id,""),System.currentTimeMillis(),TimeZone.getDefault());
        c.getSystemService(AlarmManager.class).setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,at,alarm(c,id));
    }
    @Override public void onReceive(Context c,Intent intent){
        if(!"com.ltmsav.app.MONTHLY_REMINDER".equals(intent.getAction())){reschedule(c);return;}
        try {
            JSONObject config=new JSONObject(prefs(c).getString("config","{}"));
            if(!config.optBoolean("enabled")||!allowed(c))return;
            String id=intent.getStringExtra("id");JSONArray rules=config.optJSONArray("rules");if(rules==null||id==null)return;
            JSONObject found=null;for(int i=0;i<rules.length();i++)if(id.equals(rules.getJSONObject(i).optString("id")))found=rules.getJSONObject(i);
            if(found==null)return;
            java.text.SimpleDateFormat format=new java.text.SimpleDateFormat("yyyy-MM-dd",java.util.Locale.ROOT);
            if(found.getString("nextDueDate").compareTo(format.format(new java.util.Date()))>0){schedule(c,found);return;}
            String month=ReminderDates.month(System.currentTimeMillis(),TimeZone.getDefault());
            if(month.compareTo(prefs(c).getString("delivered:"+id,""))>0){
                channel(c);
                Intent open=new Intent(c,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP);
                PendingIntent tap=PendingIntent.getActivity(c,0,open,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
                Notification.Builder b=Build.VERSION.SDK_INT>=26?new Notification.Builder(c,CHANNEL):new Notification.Builder(c);
                b.setSmallIcon(android.R.drawable.ic_dialog_info).setContentTitle(config.optString("title","LTMsav"))
                 .setContentText(config.optString("body","Open LTMsav"))
                 .setContentIntent(tap).setAutoCancel(true).setVisibility(Notification.VISIBILITY_PRIVATE);
                c.getSystemService(NotificationManager.class).notify(id,1,b.build());
                prefs(c).edit().putString("delivered:"+id,month).apply();
            }
            schedule(c,found);
        }catch(Exception ignored){}
    }
}
