import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const read = path => fs.readFileSync(path,'utf8');
test('Existing Android registration matches app package and release certificate',()=>{
 const cap=JSON.parse(read('capacitor.config.json')), config=JSON.parse(read('android/app/google-services.json'));
 assert.equal(config.project_info.project_id,'social-media-d84ea');assert.equal(cap.appId,'com.example.palzy_app');
 const client=config.client.find(c=>c.client_info.android_client_info.package_name===cap.appId);assert.ok(client);
 assert.ok(client.oauth_client.some(c=>c.client_type===1&&c.android_info.certificate_hash==='d7b1a17552b8a39d9415c58e73045a6e9deb25f2'));
});
test('Native Google token feeds shared Firebase JS auth',()=>{const s=read('src/contexts/AuthContext.jsx');assert.match(s,/FirebaseAuthentication.signInWithGoogle/);assert.match(s,/signInWithCredential\(auth, credential\)/);assert.match(s,/signInWithPopup\(auth, googleProvider\)/);});
test('Same database module and collections are retained',()=>{assert.match(read('src/firebase/config.js'),/getFirestore\(app\)/);assert.match(read('src/firebase/calls.js'),/doc\(db, 'likes'/);});
test('Android microphone permission, native audio and cleartext restrictions',()=>{const m=read('android/app/src/main/AndroidManifest.xml');assert.match(m,/android.permission.RECORD_AUDIO/);assert.match(m,/android:usesCleartextTraffic="false"/);assert.match(read('src/contexts/CallContext.jsx'),/PalzyAudio.setSpeaker/);});
test('Native build disables PWA registration and native installation prompt',()=>{assert.match(read('vite.config.js'),/PALZY_NATIVE/);assert.match(read('src/components/InstallBanner.jsx'),/if \(isNative\) return/);});
test('Android image export uses honest chooser fallback',()=>{assert.match(read('src/utils/shareUtils.js'),/Save or share image/);assert.match(read('src/components/PostCard.jsx'),/Android save\/share chooser/);});
