package com.example.palzy_app;

import android.os.Bundle;
import android.graphics.Color;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.graphics.Insets;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(Bundle state) {
        registerPlugin(PalzyAudioPlugin.class);
        super.onCreate(state);
        WebView.setWebContentsDebuggingEnabled(false);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(Color.rgb(13,13,20));
        getWindow().setNavigationBarColor(Color.rgb(13,13,20));
        if (bridge != null && bridge.getWebView() != null) {
            WebView web = bridge.getWebView();
            web.setBackgroundColor(Color.rgb(13,13,20));
            ViewCompat.setOnApplyWindowInsetsListener(web, (view, insets) -> {
                Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
                Insets ime = insets.getInsets(WindowInsetsCompat.Type.ime());
                view.setPadding(bars.left, bars.top, bars.right, Math.max(bars.bottom, ime.bottom));
                return insets;
            });
            web.getSettings().setMediaPlaybackRequiresUserGesture(false);
            web.getSettings().setAllowFileAccess(false);
        }
    }
}
