import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { PROJECT, hash } from './push-core.js'
export function services() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!raw) throw Object.assign(new Error('Push server is not configured.'), { status: 503 })
  let config
  try { config = JSON.parse(raw) } catch { throw Object.assign(new Error('Push credential is not valid JSON.'), { status: 503 }) }
  if (config.project_id !== PROJECT || config.type !== 'service_account') throw Object.assign(new Error('Push server project mismatch.'), { status: 503 })
  if (!config.client_email || !config.private_key) throw Object.assign(new Error('Push credential lacks service-account fields.'), { status: 503 })
  let app
  try { app = getApps()[0] || initializeApp({ credential: cert(config), projectId: PROJECT }) } catch { throw Object.assign(new Error('Push credential key could not be initialized.'), { status: 503 }) }
  return { auth: getAuth(app), db: getFirestore(app), messaging: getMessaging(app) }
}
export function http(req, res) {
  const origin = req.headers.origin
  // Native shell or this isolated service only. CORS is not authentication.
  if (origin && origin !== 'https://localhost' && origin !== process.env.PUSH_SERVICE_ORIGIN) { res.status(403).json({ error: 'Origin not allowed' }); return false }
  if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin') }
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Cache-Control', 'no-store')
  if (req.method === 'OPTIONS') { res.status(204).end(); return false }
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST required' }); return false }
  if (Number(req.headers['content-length'] || 0) > 10000) { res.status(413).json({ error: 'Request too large' }); return false }
  return true
}
export async function identify(req, auth) {
  const match = /^Bearer ([A-Za-z0-9._-]+)$/.exec(req.headers.authorization || '')
  if (!match) throw Object.assign(new Error('Sign-in required.'), { status: 401 })
  try { const token = await auth.verifyIdToken(match[1], true); if (!token.uid) throw new Error(); return token.uid }
  catch { throw Object.assign(new Error('Invalid or expired sign-in.'), { status: 401 }) }
}
export async function limit(db, uid, bucket, max, windowMs) {
  const ref = db.collection('palzyPushLimits').doc(hash(`${bucket}:${uid}`))
  await db.runTransaction(async tx => {
    const snap = await tx.get(ref), d = snap.data() || {}, now = Date.now()
    const within = typeof d.start === 'number' && now - d.start < windowMs
    const count = within ? d.count || 0 : 0
    if (count >= max) throw Object.assign(new Error('Too many requests. Try later.'), { status: 429 })
    tx.set(ref, { start: within ? d.start : now, count: count + 1 })
  })
}
export function fail(res, err) { console.error('push-error', String(err?.name), String(err?.code), String(err?.message).replace(/-----BEGIN[\s\S]*/,'[redacted]').slice(0,180)); res.status(err.status || 500).json({ error: err.status ? err.message : 'Push request failed.' }) }
