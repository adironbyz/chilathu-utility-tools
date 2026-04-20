/**
 * POST /api/admin/login
 * Body: { password: string }
 *
 * Verify password vs env ADMIN_PASSWORD (constant-time compare).
 * Nếu khớp → set HttpOnly cookie session 24h.
 *
 * Env vars:
 *   - ADMIN_PASSWORD: mật khẩu admin
 *   - SESSION_SECRET: secret HMAC key (random ≥32 chars)
 */

import {
  constantTimeEqual,
  createSessionToken,
  buildSessionCookie,
} from '../../_lib/auth.js'

// Tránh brute-force: delay nhỏ ở mỗi request (50ms)
async function smallDelay() {
  await new Promise((r) => setTimeout(r, 50))
}

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
    return new Response(
      JSON.stringify({ error: 'Server chưa cấu hình ADMIN_PASSWORD/SESSION_SECRET' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }

  let body
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Body không phải JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  await smallDelay()

  const password = typeof body?.password === 'string' ? body.password : ''
  if (!constantTimeEqual(password, env.ADMIN_PASSWORD)) {
    return new Response(JSON.stringify({ error: 'Mật khẩu sai' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const token = await createSessionToken(env.SESSION_SECRET)

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': buildSessionCookie(token),
    },
  })
}
