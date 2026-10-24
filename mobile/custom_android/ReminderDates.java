package com.ltmsav.app;

import java.util.Calendar;
import java.util.Locale;
import java.util.TimeZone;

/** Calendar-based monthly reminders; no 30-day millisecond arithmetic. */
public final class ReminderDates {
    public static String month(long time, TimeZone zone) {
        Calendar c=Calendar.getInstance(zone);c.setTimeInMillis(time);
        return String.format(Locale.ROOT,"%04d-%02d",c.get(Calendar.YEAR),c.get(Calendar.MONTH)+1);
    }
    public static long next(String due, int day, String deliveredMonth, long now, TimeZone zone) {
        int year=Integer.parseInt(due.substring(0,4)), m=Integer.parseInt(due.substring(5,7));
        Calendar c=Calendar.getInstance(zone);c.clear();c.set(year,m-1,1,9,0,0);
        if(!deliveredMonth.isEmpty() && deliveredMonth.compareTo(due.substring(0,7))>=0) {
            c.set(Integer.parseInt(deliveredMonth.substring(0,4)),Integer.parseInt(deliveredMonth.substring(5,7))-1,1,9,0,0);
            c.add(Calendar.MONTH,1);
        }
        c.set(Calendar.DAY_OF_MONTH,Math.min(day,c.getActualMaximum(Calendar.DAY_OF_MONTH)));
        // One catch-up reminder, never a burst of notifications for missed months.
        return Math.max(c.getTimeInMillis(),now+60000);
    }
}
