package com.altius.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SessionTimerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
