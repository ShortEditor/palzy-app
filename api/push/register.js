import { hash, validateToken } from '../../server/push-core.js'
import { services, http, identify, limit, fail } from '../../server/push-server.js'
export default async function handler(req, res) {
  if (!http(req, res)) return
  try {
    const { auth, db } = services(), uid = await identify(req, auth)
    const { token, remove } = req.body || {}
    if (!validateToken(token) || (remove !== undefined && typeof remove !== 'boolean')) return res.status(400).json({ error: 'Invalid device token.' })
    await limit(db, uid, 'register', 20, 60000)
    const ref = db.collection('palzyPushDevices').doc(hash(token))
    await db.runTransaction(async tx => {
      const snap = await tx.get(ref)
      if (remove) { if (snap.data()?.uid === uid) tx.delete(ref); return }
      tx.set(ref, { uid, token, platform: 'android', updatedAt: Date.now() })
    })
    res.status(200).json({ registered: !remove })
  } catch (err) { fail(res, err) }
}
