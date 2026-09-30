# Push service deployment

Deploy api/push/ and server/ files with package.json type=module and firebase-admin dependency to a separate Vercel Hobby project. Never deploy service-account JSON as a file. Set FIREBASE_SERVICE_ACCOUNT_JSON only as a Vercel production Secret environment variable via secure entry. Native app public VITE_PUSH_API_ORIGIN points to service origin. CORS accepts https://localhost; ID tokens authenticate requests. Existing web app is not patched.

An example isolated deployment vercel.json:
```json
{"functions":{"api/push/*.js":{"maxDuration":30}}}
```
No scheduled polling or Cloud Functions required. Caller invokes endpoint once after storing offer. No endpoint automatically subscribes to Firestore writes. No client access rules added to private collections. Server roles/API availability must be verified with a valid credential and device registration before claiming notifications work.
