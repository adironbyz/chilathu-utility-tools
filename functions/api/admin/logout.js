/**
 * POST /api/admin/logout
 * Clear session cookie. Không cần auth — idempotent.
 */

import { buildClearCookie } from '../../_lib/auth.js'

export async function onRequestPost() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': buildClearCookie(),
    },
  })
}
