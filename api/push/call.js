import { hash, validateCall, makeMessage } from '../../server/push-core.js'
import { services, http, identify, limit, fail } from '../../server/push-server.js'
export default async function handler(req, res) {
  if (!http(req, res)) return
  try {
    const { auth, db, messaging } = services(), uid = await identify(req, auth)
    const { callId } = req.body || {}
    if (typeof callId !== 'string' || callId.length > 240 || !/^[A-Za-z0-9_-]+$/.test(callId)) return res.status(400).json({ error: 'Invalid call.' })
    const snap = await db.collection('likes').doc(`call_${callId}`).get(), call = snap.data()
    if (!validateCall(call, uid)) return res.status(403).json({ error: 'Call is not eligible for a notification.' })
    const [caller, callee] = await Promise.all([db.collection('users').doc(uid).get(), db.collection('users').doc(call.calleeId).get()])
    if (!caller.exists || !callee.exists || caller.data().banned === true || callee.data().banned === true) return res.status(403).json({ error: 'Call not allowed.' })
    await limit(db, uid, 'calls', 5, 60000)
    await limit(db, `${uid}:${call.calleeId}`, 'pair', 2, 60000)
    // Stored calls are client writable. Only bind fresh calls to their deterministic caller-prefixed ID.
    if (!callId.startsWith(`${uid}_${call.calleeId}_`)) return res.status(403).json({ error: 'Invalid call identity.' })
    const receipt = db.collection('palzyPushReceipts').doc(hash(callId))
    try { await receipt.create({ uid, calleeId: call.calleeId, createdAt: Date.now(), status: 'claimed' }) }
    catch (err) { if (err.code === 6) return res.status(200).json({ duplicate: true }); throw err }
    const devices = await db.collection('palzyPushDevices').where('uid', '==', call.calleeId).limit(10).get()
    const current = devices.docs.filter(d => Date.now() - d.data().updatedAt < 90 * 86400000)
    if (!current.length) { await receipt.update({ status: 'no-devices' }); return res.status(200).json({ sent: 0 }) }
    // Revalidate immediately before send in case the caller already ended it.
    if (!validateCall((await snap.ref.get()).data(), uid)) { await receipt.update({ status: 'expired' }); return res.status(200).json({ sent: 0 }) }
    const result = await messaging.sendEachForMulticast(makeMessage(current.map(d => d.data().token), callId, caller.data().name))
    await Promise.all(result.responses.map((r, i) => !r.success && ['messaging/registration-token-not-registered','messaging/invalid-registration-token'].includes(r.error?.code) ? current[i].ref.delete() : Promise.resolve()))
    await receipt.update({ status: 'sent', success: result.successCount, failures: result.failureCount })
    res.status(200).json({ sent: result.successCount })
  } catch (err) { fail(res, err) }
}
