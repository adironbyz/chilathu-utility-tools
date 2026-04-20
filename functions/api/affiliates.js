/**
 * GET  /api/affiliates → public endpoint, trả config từ KV.
 *                         Fallback empty nếu KV chưa có entry → frontend dùng
 *                         bundled defaults.
 *
 * POST /api/affiliates → protected, ghi config vào KV.
 *                         Yêu cầu session cookie hợp lệ (login trước).
 *
 * KV binding: `AFFILIATES_KV` (tạo ở Cloudflare dashboard).
 * Env vars: `SESSION_SECRET` (cho HMAC verify cookie).
 */

import { getSession } from '../_lib/auth.js'

const KV_KEY = 'config'

// Cache tại edge 60s — giảm KV read. Admin save xong cần chờ tối đa 60s mới
// thấy ở client, nhưng KV write instant ở edge gần nhất → ok.
const EDGE_CACHE_SECONDS = 60

// ─── CORS / shared headers ──────────────────────────────────────────────────
const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': `public, max-age=${EDGE_CACHE_SECONDS}`,
}

// ─── Validation ─────────────────────────────────────────────────────────────
// Schema siêu đơn giản: config = { brands: {...}, toolAffiliates: {...} }
// Không validate sâu field-level — admin UI đã bound input.

function validateConfig(data) {
  if (!data || typeof data !== 'object') return 'Config phải là object'
  if (!data.brands || typeof data.brands !== 'object') return 'Thiếu brands'
  if (!data.toolAffiliates || typeof data.toolAffiliates !== 'object') {
    return 'Thiếu toolAffiliates'
  }
  for (const [slug, brand] of Object.entries(data.brands)) {
    if (!brand || typeof brand !== 'object') return `Brand ${slug} không hợp lệ`
    if (typeof brand.slug !== 'string' || brand.slug !== slug) {
      return `Brand ${slug}: slug phải khớp key`
    }
    if (typeof brand.name !== 'string') return `Brand ${slug}: thiếu name`
    if (typeof brand.url !== 'string') return `Brand ${slug}: thiếu url`
    // logoSrc là optional — nếu có thì phải là string http(s) URL.
    if (brand.logoSrc !== undefined && brand.logoSrc !== '' && brand.logoSrc !== null) {
      if (typeof brand.logoSrc !== 'string' || !/^https?:\/\//.test(brand.logoSrc)) {
        return `Brand ${slug}: logoSrc phải là URL http(s)`
      }
    }
  }
  for (const [tool, mapping] of Object.entries(data.toolAffiliates)) {
    if (!mapping || typeof mapping !== 'object') return `Tool ${tool} không hợp lệ`
    if (typeof mapping.featured !== 'string') return `Tool ${tool}: thiếu featured`
    if (!Array.isArray(mapping.comparison)) return `Tool ${tool}: comparison phải là array`
  }
  return null
}

// ─── Handlers ───────────────────────────────────────────────────────────────

export async function onRequestGet({ env }) {
  const kv = env.AFFILIATES_KV
  if (!kv) {
    return new Response(
      JSON.stringify({ error: 'KV binding AFFILIATES_KV chưa setup' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const raw = await kv.get(KV_KEY)
  if (!raw) {
    // KV chưa có entry — trả empty, frontend fallback sang defaults.
    return new Response(JSON.stringify({ brands: null, toolAffiliates: null }), {
      status: 200,
      headers: JSON_HEADERS,
    })
  }

  // raw đã là JSON string → pass-through
  return new Response(raw, { status: 200, headers: JSON_HEADERS })
}

export async function onRequestPost({ request, env }) {
  if (!env.AFFILIATES_KV) {
    return new Response(JSON.stringify({ error: 'KV binding chưa setup' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (!env.SESSION_SECRET) {
    return new Response(JSON.stringify({ error: 'SESSION_SECRET chưa setup' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Verify session
  const session = await getSession(request, env.SESSION_SECRET)
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Parse + validate body
  let body
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Body không phải JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const err = validateConfig(body)
  if (err) {
    return new Response(JSON.stringify({ error: err }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Ghi vào KV. Không set TTL — config tồn tại forever cho đến khi admin update.
  await env.AFFILIATES_KV.put(KV_KEY, JSON.stringify(body))

  return new Response(
    JSON.stringify({ ok: true, savedAt: new Date().toISOString() }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}
