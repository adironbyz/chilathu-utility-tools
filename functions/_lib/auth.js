/**
 * Auth helpers — HMAC-signed session tokens.
 *
 * Token format: base64url(payload) + "." + hex(HMAC-SHA256(payload, secret))
 * payload = { iat: <ms>, exp: <ms> }
 *
 * Lưu ở HttpOnly cookie `admin_session`. Đọc bằng `getSession(req)`.
 * Pages Functions chạy edge — dùng Web Crypto API có sẵn, không cần deps.
 */

const COOKIE_NAME = 'admin_session'
const SESSION_TTL_MS = 24 * 60 * 60 * 1000 // 24h

// ─── Base helpers ───────────────────────────────────────────────────────────

function base64UrlEncode(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  return atob(b64.replace(/-/g, '+').replace(/_/g, '/') + pad)
}

function bytesToHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

async function hmacSha256(message, secret) {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return bytesToHex(new Uint8Array(sig))
}

/**
 * Constant-time string compare — tránh timing attack khi verify password.
 */
export function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

// ─── Token create / verify ──────────────────────────────────────────────────

export async function createSessionToken(secret) {
  const now = Date.now()
  const payload = JSON.stringify({ iat: now, exp: now + SESSION_TTL_MS })
  const payloadB64 = base64UrlEncode(payload)
  const sig = await hmacSha256(payloadB64, secret)
  return `${payloadB64}.${sig}`
}

export async function verifySessionToken(token, secret) {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 2) return null

  const [payloadB64, sig] = parts
  const expectedSig = await hmacSha256(payloadB64, secret)
  if (!constantTimeEqual(sig, expectedSig)) return null

  try {
    const payload = JSON.parse(base64UrlDecode(payloadB64))
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

// ─── Cookie helpers ─────────────────────────────────────────────────────────

export function parseCookie(header, name) {
  if (!header) return null
  const pairs = header.split(';')
  for (const p of pairs) {
    const [k, ...v] = p.trim().split('=')
    if (k === name) return v.join('=')
  }
  return null
}

export function buildSessionCookie(token, maxAgeMs = SESSION_TTL_MS) {
  const maxAge = Math.floor(maxAgeMs / 1000)
  return [
    `${COOKIE_NAME}=${token}`,
    `Path=/`,
    `HttpOnly`,
    `Secure`,
    `SameSite=Strict`,
    `Max-Age=${maxAge}`,
  ].join('; ')
}

export function buildClearCookie() {
  return [
    `${COOKIE_NAME}=`,
    `Path=/`,
    `HttpOnly`,
    `Secure`,
    `SameSite=Strict`,
    `Max-Age=0`,
  ].join('; ')
}

export { COOKIE_NAME }

/**
 * Check request có session cookie hợp lệ không. Trả payload hoặc null.
 */
export async function getSession(request, secret) {
  const token = parseCookie(request.headers.get('Cookie'), COOKIE_NAME)
  if (!token) return null
  return verifySessionToken(token, secret)
}
