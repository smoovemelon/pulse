package com.altius.app;

import android.Manifest;
import android.content.SharedPreferences;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "SessionTimer",
    permissions = { @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "notifications") }
)
public class SessionTimerPlugin extends Plugin {
    @PluginMethod
    public void start(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33 && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "startAfterPermission");
            return;
        }
        launch(SessionTimerService.ACTION_START, call);
    }

    @PermissionCallback
    private void startAfterPermission(PluginCall call) {
        launch(SessionTimerService.ACTION_START, call);
    }

    @PluginMethod
    public void pause(PluginCall call) {
        launch(SessionTimerService.ACTION_PAUSE, call);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        launch(SessionTimerService.ACTION_RESET, call);
    }

    @PluginMethod
    public void state(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(SessionTimerService.PREFS, android.content.Context.MODE_PRIVATE);
        JSObject result = new JSObject();
        result.put("known", prefs.getBoolean("known", false));
        result.put("phase", prefs.getString("phase", "idle"));
        result.put("startedAt", prefs.getLong("startedAt", 0));
        result.put("accrued", prefs.getLong("accrued", 0));
        call.resolve(result);
    }

    private void launch(String action, PluginCall call) {
        try {
            SessionTimerService.command(
                getContext(),
                action,
                number(call, "startedAt", 0),
                number(call, "accrued", 0),
                number(call, "elapsed", 0)
            );
            call.resolve();
        } catch (Exception error) {
            call.reject(error.getMessage() == null ? "Could not update the timer" : error.getMessage());
        }
    }

    private static long number(PluginCall call, String name, long fallback) {
        Object value = call.getData().opt(name);
        if (value instanceof Number) return ((Number) value).longValue();
        return fallback;
    }
}
