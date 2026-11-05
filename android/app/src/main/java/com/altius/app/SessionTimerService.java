package com.altius.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.content.res.Configuration;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.widget.RemoteViews;
import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;

public class SessionTimerService extends Service {
    static final String PREFS = "session_timer";
    static final String EXTRA_STARTED_AT = "startedAt";
    static final String EXTRA_ACCRUED = "accrued";
    static final String EXTRA_ELAPSED = "elapsed";
    static final String ACTION_START = "com.altius.app.session.START";
    static final String ACTION_PAUSE = "com.altius.app.session.PAUSE";
    static final String ACTION_RESUME = "com.altius.app.session.RESUME";
    static final String ACTION_RESET = "com.altius.app.session.RESET";
    private static final String CHANNEL_ID = "altius_session";
    private static final int NOTIFICATION_ID = 41;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private String phase = "idle";
    private long startedAt = 0;
    private long accrued = 0;
    private final Runnable tick = new Runnable() {
        @Override
        public void run() {
            if (!"running".equals(phase)) return;
            publish(false);
            handler.postDelayed(this, 1000);
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, getString(R.string.session_timer_channel), NotificationManager.IMPORTANCE_DEFAULT);
            channel.setShowBadge(false);
            channel.setSound(null, null);
            channel.enableVibration(false);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(channel);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent == null || intent.getAction() == null ? ACTION_START : intent.getAction();
        if (ACTION_RESET.equals(action)) {
            idle();
            promote();
            ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
            stopSelf();
            return START_NOT_STICKY;
        }
        if (ACTION_PAUSE.equals(action)) {
            if (!"running".equals(phase)) load();
            long frozen = "running".equals(phase) ? elapsedNow() : accrued;
            if (intent != null && intent.hasExtra(EXTRA_ELAPSED)) frozen = Math.max(frozen, intent.getLongExtra(EXTRA_ELAPSED, frozen));
            accrued = Math.max(0, frozen);
            startedAt = 0;
            phase = "paused";
            save();
        } else if (ACTION_RESUME.equals(action)) {
            load();
            if (!"paused".equals(phase) && !"running".equals(phase)) {
                idle();
                promote();
                ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
                stopSelf();
                return START_NOT_STICKY;
            }
            if (!"running".equals(phase)) {
                startedAt = System.currentTimeMillis();
                phase = "running";
                save();
            }
        } else if (intent != null && intent.hasExtra(EXTRA_STARTED_AT)) {
            startedAt = intent.getLongExtra(EXTRA_STARTED_AT, System.currentTimeMillis());
            accrued = Math.max(0, intent.getLongExtra(EXTRA_ACCRUED, 0));
            phase = "running";
            save();
        } else {
            load();
            if (!"running".equals(phase) && !"paused".equals(phase)) {
                idle();
                promote();
                ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
                stopSelf();
                return START_NOT_STICKY;
            }
        }
        promote();
        arm();
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacks(tick);
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    static void command(Context context, String action, long startedAt, long accrued, long elapsed) {
        Intent intent = new Intent(context, SessionTimerService.class);
        intent.setAction(action);
        intent.putExtra(EXTRA_STARTED_AT, startedAt);
        intent.putExtra(EXTRA_ACCRUED, accrued);
        intent.putExtra(EXTRA_ELAPSED, elapsed);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) context.startForegroundService(intent);
        else context.startService(intent);
    }

    private void idle() {
        handler.removeCallbacks(tick);
        phase = "idle";
        startedAt = 0;
        accrued = 0;
        getSharedPreferences(PREFS, MODE_PRIVATE).edit().putBoolean("known", true).putString("phase", "idle").putLong("startedAt", 0).putLong("accrued", 0).apply();
    }

    private void load() {
        SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        phase = prefs.getString("phase", "idle");
        startedAt = prefs.getLong("startedAt", 0);
        accrued = prefs.getLong("accrued", 0);
    }

    private void save() {
        getSharedPreferences(PREFS, MODE_PRIVATE).edit()
            .putBoolean("known", true)
            .putString("phase", phase)
            .putLong("startedAt", startedAt)
            .putLong("accrued", accrued)
            .apply();
    }

    private long elapsedNow() {
        if ("running".equals(phase) && startedAt > 0) return Math.max(0, accrued + (System.currentTimeMillis() - startedAt));
        return Math.max(0, accrued);
    }

    private void arm() {
        handler.removeCallbacks(tick);
        if ("running".equals(phase)) handler.postDelayed(tick, 1000);
    }

    private void promote() {
        Notification notification = build(elapsedNow());
        int type = Build.VERSION.SDK_INT >= 34 ? ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE : 0;
        ServiceCompat.startForeground(this, NOTIFICATION_ID, notification, type);
    }

    private void publish(boolean foreground) {
        Notification notification = build(elapsedNow());
        if (foreground) {
            promote();
            return;
        }
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) manager.notify(NOTIFICATION_ID, notification);
    }

    private Notification build(long elapsedMs) {
        boolean running = "running".equals(phase);
        boolean night = (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
        int ink = night ? 0xFFF4F4F5 : 0xFF18181B;
        int muted = night ? 0xFFA1A1AA : 0xFF71717A;
        String label = getString(running ? R.string.session_timer_running : R.string.session_timer_paused);
        String time = format(elapsedMs);
        RemoteViews views = new RemoteViews(getPackageName(), R.layout.notification_session);
        views.setTextViewText(R.id.session_label, label);
        views.setTextColor(R.id.session_label, muted);
        views.setTextViewText(R.id.session_elapsed, time);
        views.setTextColor(R.id.session_elapsed, ink);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_session_timer)
            .setColor(0xFF18181B)
            .setContentTitle(time)
            .setContentText(label)
            .setCustomContentView(views)
            .setCustomBigContentView(views)
            .setStyle(new NotificationCompat.DecoratedCustomViewStyle())
            .setContentIntent(openApp())
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setSilent(true)
            .setShowWhen(false)
            .setCategory(NotificationCompat.CATEGORY_STOPWATCH)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE);
        if (running) {
            builder.addAction(R.drawable.ic_session_pause, getString(R.string.session_timer_pause), serviceAction(ACTION_PAUSE));
        } else {
            builder.addAction(R.drawable.ic_session_play, getString(R.string.session_timer_resume), serviceAction(ACTION_RESUME));
        }
        builder.addAction(R.drawable.ic_session_reset, getString(R.string.session_timer_reset), serviceAction(ACTION_RESET));
        return builder.build();
    }

    private PendingIntent openApp() {
        Intent open = new Intent(this, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(this, 1, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private PendingIntent serviceAction(String action) {
        Intent intent = new Intent(this, SessionTimerService.class);
        intent.setAction(action);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) return PendingIntent.getForegroundService(this, action.hashCode(), intent, flags);
        return PendingIntent.getService(this, action.hashCode(), intent, flags);
    }

    static String format(long elapsedMs) {
        long total = Math.max(0, elapsedMs / 1000);
        long hours = total / 3600;
        long minutes = (total % 3600) / 60;
        long seconds = total % 60;
        if (hours > 0) return hours + ":" + pad(minutes) + ":" + pad(seconds);
        return pad(minutes) + ":" + pad(seconds);
    }

    private static String pad(long value) {
        return value < 10 ? "0" + value : Long.toString(value);
    }
}
