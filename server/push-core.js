import { createHash } from 'node:crypto'
export const PROJECT = 'social-media-d84ea'
export const hash = value => createHash('sha256').update(value).digest('hex')
export function validateCall(call, callerUid, now = Date.now()) {
  if (!call || call.isCall !== true || call.callerId !== callerUid) return false
  if (typeof call.calleeId !== 'string' || !call.calleeId || call.calleeId === callerUid) return false
  return call.status === 'ringing' && typeof call.createdAt === 'number' && now - call.createdAt >= 0 && now - call.createdAt <= 45000 && !!call.offer?.sdp
}
export function validateToken(token) { return typeof token === 'string' && token.length >= 30 && token.length <= 4096 && /^[A-Za-z0-9_:\-]+$/.test(token) }
export function makeMessage(tokens, callId, callerName) {
  return { tokens, notification: { title: 'Incoming Palzy call', body: `${String(callerName || 'A Palzy user').slice(0,60)} is calling. Tap to open Palzy.` }, data: { kind: 'call', callId }, android: { priority: 'high', ttl: 45000, collapseKey: `call_${hash(callId).slice(0,20)}`, notification: { channelId: 'palzy_calls', sound: 'default', tag: `call_${hash(callId).slice(0,20)}`, visibility: 'private' } } }
}
