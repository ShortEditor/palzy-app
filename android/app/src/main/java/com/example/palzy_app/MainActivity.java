package com.example.palzy_app;

import android.os.Bundle;
import android.graphics.Color;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.graphics.Insets;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {
    private float topInset = 0, bottomInset = 0, keyboardInset = 0;
    private void applyInsets() {
        if (bridge == null) return;
        bridge.getWebView().evaluateJavascript("(() => {const s=document.documentElement.style;document.documentElement.classList.add('native-app');s.setProperty('--native-top','"+topInset+"px');s.setProperty('--native-bottom','"+bottomInset+"px');s.setProperty('--native-keyboard','"+keyboardInset+"px');})()", null);
    }
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
            bridge.addWebViewListener(new WebViewListener() {
                @Override public void onPageLoaded(WebView webView) { applyInsets(); }
            });
            ViewCompat.setOnApplyWindowInsetsListener(web, (view, insets) -> {
                Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
                Insets ime = insets.getInsets(WindowInsetsCompat.Type.ime());
                float density = getResources().getDisplayMetrics().density;
                topInset = bars.top / density;
                bottomInset = bars.bottom / density;
                keyboardInset = Math.max(0, ime.bottom - bars.bottom) / density;
                view.setPadding(bars.left, 0, bars.right, 0);
                applyInsets();
                return insets;
            });
            ViewCompat.requestApplyInsets(web);
            web.getSettings().setMediaPlaybackRequiresUserGesture(false);
            web.getSettings().setAllowFileAccess(false);
        }
    }
}
