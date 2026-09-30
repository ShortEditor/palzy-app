import { PushNotifications } from '@capacitor/push-notifications'
import { Capacitor } from '@capacitor/core'
import { auth } from './firebase/config'
const endpoint = import.meta.env.VITE_PUSH_API_ORIGIN || ''
let activeUser = null, token = null, handles = [], starting = null
export const nativePush = Capacitor.isNativePlatform()
export async function pushRequest(path, body, user = activeUser) {
  if (!endpoint || !user) throw new Error('Call notifications are not configured yet.')
  const idToken = await user.getIdToken()
  const response = await fetch(`${endpoint}/api/push/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` }, body: JSON.stringify(body), signal: AbortSignal.timeout(12000) })
  if (!response.ok) throw new Error('Call notification request failed. Your live call can still work.')
  return response.json()
}
export async function stopPush() {
  const oldUser = activeUser, oldToken = token
  activeUser = null; token = null
  await Promise.all(handles.map(h => h.remove())); handles = []
  if (oldUser && oldToken && endpoint) await pushRequest('register', { token: oldToken, remove: true }, oldUser).catch(() => {})
  if (nativePush) await PushNotifications.unregister().catch(() => {})
}
export async function startPush(user, requestPermission = false) {
  if (!nativePush || !endpoint) return { state: 'not-configured' }
  if (starting) return starting
  starting = (async () => {
    if (activeUser?.uid !== user.uid) await stopPush()
    activeUser = user
    let permission = await PushNotifications.checkPermissions()
    if (permission.receive === 'prompt' && requestPermission) permission = await PushNotifications.requestPermissions()
    if (permission.receive !== 'granted') return { state: permission.receive }
    await PushNotifications.createChannel({ id: 'palzy_calls', name: 'Incoming calls', description: 'Palzy call alerts. Tap to open and answer.', importance: 5, sound: 'default', vibration: true, visibility: 0 })
    if (!handles.length) {
      handles.push(await PushNotifications.addListener('registration', async result => {
        token = result.value
        try { await pushRequest('register', { token }); window.dispatchEvent(new CustomEvent('palzy-push-status', { detail: 'ready' })) }
        catch { window.dispatchEvent(new CustomEvent('palzy-push-status', { detail: 'registration-failed' })) }
      }))
      handles.push(await PushNotifications.addListener('registrationError', () => window.dispatchEvent(new CustomEvent('palzy-push-status', { detail: 'registration-failed' }))))
      handles.push(await PushNotifications.addListener('pushNotificationActionPerformed', event => {
        if (auth.currentUser && event.notification.data?.kind === 'call') {
          history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate'))
          // Firestore listener validates current recipient/status; never auto-accept a call from push.
        }
      }))
    }
    await PushNotifications.register()
    return { state: 'registering' }
  })().finally(() => { starting = null })
  return starting
}
export async function notifyCall(callId) {
  if (!nativePush || !endpoint || !auth.currentUser) return false
  try { await pushRequest('call', { callId }, auth.currentUser); return true }
  catch { return false }
}
