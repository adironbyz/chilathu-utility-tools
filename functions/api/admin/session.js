/**
 * GET /api/admin/session
 * Check if caller has a valid session. Dùng cho admin UI biết có phải login lại
 * hay hiện editor luôn.
 *
 * Response:
 *   200 { authenticated: true, exp: <ms> }
 *   401 { authenticated: false }
 */

import { getSession } from '../../_lib/auth.js'

export async function onRequestGet({ request, env }) {
  if (!env.SESSION_SECRET) {
    return new Response(
      JSON.stringify({ authenticated: false, error: 'SESSION_SECRET chưa setup' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const session = await getSession(request, env.SESSION_SECRET)
  if (!session) {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(
    JSON.stringify({ authenticated: true, exp: session.exp }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}
