import { useEffect, useState } from 'react'
import { nativePush, startPush } from '../push'
import { useAuth } from '../contexts/AuthContext'
export default function PushSettings() {
  const { currentUser } = useAuth(), [state, setState] = useState('off')
  useEffect(() => { const update = e => setState(e.detail); window.addEventListener('palzy-push-status', update); return () => window.removeEventListener('palzy-push-status', update) }, [])
  if (!nativePush) return null
  const descriptions = { ready: 'Call alerts enabled on this device. Delivery depends on Android notification settings and network.', registering: 'Registering this device...', denied: 'Notifications denied. Enable them in Android app settings.', 'not-configured': 'Call alerts are prepared but the sending service is not configured yet.', 'registration-failed': 'Could not register call alerts. Try again with an internet connection.' }
  return <section className="clay-card" style={{ margin: 16, padding: 16 }}><strong>Android call notifications</strong><p style={{ fontSize: 13, margin: '8px 0' }}>{descriptions[state] || 'Enable incoming-call alerts when Palzy is in the background. Tap an alert to open the app and answer. This is not background calling.'}</p><button className="btn btn-sm" disabled={state === 'registering'} onClick={async () => { try { const result = await startPush(currentUser, true); setState(result.state) } catch { setState('registration-failed') } }}>Enable call notifications</button></section>
}
