package com.example.palzy_app;

import android.content.Context;
import android.media.AudioManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "PalzyAudio")
public class PalzyAudioPlugin extends Plugin {
    @PluginMethod public void setSpeaker(PluginCall call) {
        AudioManager audio = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
        boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled", false));
        audio.setMode(AudioManager.MODE_IN_COMMUNICATION);
        audio.setSpeakerphoneOn(enabled);
        JSObject result = new JSObject();
        result.put("enabled", enabled);
        call.resolve(result);
    }
    @PluginMethod public void reset(PluginCall call) {
        AudioManager audio = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
        audio.setSpeakerphoneOn(false);
        audio.setMode(AudioManager.MODE_NORMAL);
        call.resolve();
    }
}
