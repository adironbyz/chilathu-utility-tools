/**
 * Affiliate brand registry + URL helpers.
 *
 * ─── Architecture ──────────────────────────────────────────────────────────
 * Config có 2 nguồn:
 *   1. DEFAULT_BRANDS / DEFAULT_TOOL_AFFILIATES — bundled với app (fallback)
 *   2. Remote KV qua /api/affiliates — fetch lúc App mount
 *
 * App.jsx gọi `loadAffiliateConfig()` trước khi render Routes. Nếu fetch OK
 * → override defaults. Nếu fail (network, KV chưa setup) → giữ defaults, app
 * vẫn chạy bình thường.
 *
 * Component dùng getter (`getBrand`, `getToolAffiliates`) — không import trực
 * tiếp BRANDS/TOOL_AFFILIATES nữa. Như vậy khi config load xong, getter trả
 * data mới.
 *
 * ─── Schema ────────────────────────────────────────────────────────────────
 * Brand: { slug, name, initial, color, tagline, metric, url, approved?,
 *          referralCode? }
 * ToolAffiliate: { featured: brandSlug, comparison: brandSlug[] }
 *
 * Quan trọng: chỉnh config qua /admin, không sửa file này (trừ default seed).
 */

// ─── Default config (bundled fallback) ──────────────────────────────────────
// Field reference:
//   - slug: dùng trong SubID
//   - name: hiển thị
//   - initial: fallback logo (colored square) — 1-2 chữ
//              Dùng khi logoSrc trống HOẶC ảnh load fail (onError).
//   - color: bg color cho initial square
//   - logoSrc: URL ảnh logo brand (optional). Nếu có → render <img>, fallback
//              sang initial+color nếu URL hỏng. Khuyến nghị PNG/SVG vuông,
//              background trong suốt, ≥80x80px.
//   - tagline: short benefit (brand-neutral)
//   - metric: benefit kèm số (ví dụ "Lãi suất 5.6%") — có thể override per-tool
//   - url: affiliate link (đã có UTM/sub sẽ được builder append thêm)
//   - approved: true khi URL thật từ Accesstrade; false/undefined = placeholder
//   - referralCode: nếu có = app-based campaign cần user nhập mã trong app
//                   → component hiện interstitial trước khi redirect

const DEFAULT_BRANDS = {
  // ─── Approved (URL thật, ship được) ─────────────────────────────────────
  // Brand duy nhất có URL affiliate thật. Các brand khác sẽ add qua /admin
  // khi Accesstrade duyệt campaign.
  vibmax: {
    slug: 'vibmax',
    name: 'VIB App Max',
    initial: 'M',
    color: '#FF6A00',
    logoSrc: 'https://logo.clearbit.com/vib.com.vn',
    tagline: 'Vay nhanh, thẻ tín dụng, trả góp trong 1 app',
    metric: 'Duyệt trong 5 phút · hạn mức tới 1 tỷ',
    referralCode: 'PAAT_2200776',
    approved: true,
    url: 'https://go.isclix.com/deep_link/v6/6961769419275243212/6873138885445764645?sub4=oneatweb&url_enc=aHR0cHM6Ly9tYXh2aWIuZ28ubGluay8%3D',
  },
}

// Mapping cho 8 tool live trên tienich.chilathu.com.
// Mỗi tool có:
//   - featured: brand cho single contextual CTA (1 brand)
//   - comparison: brand cho bảng so sánh (≥2 brand để render)
//
// Hiện chỉ vibmax approved → chỉ tool loan/credit có featured. Comparison
// rỗng khắp nơi (cần ≥2 approved mới render) — sẽ fill dần khi thêm brand.
const DEFAULT_TOOL_AFFILIATES = {
  // Tier S — finance intent mạnh
  'tinh-luong': {
    featured: '',
    comparison: [],
  },
  'tinh-lai-vay': {
    featured: 'vibmax',
    comparison: ['vibmax'],
  },
  'tra-gop': {
    featured: 'vibmax',
    comparison: ['vibmax'],
  },
  'lai-the-tin-dung': {
    featured: 'vibmax',
    comparison: ['vibmax'],
  },
  // Tier A — utility intent gián tiếp
  'tinh-tien-dien': {
    featured: '',
    comparison: [],
  },
  'tinh-tien-nuoc': {
    featured: '',
    comparison: [],
  },
  'chia-tien': {
    featured: '',
    comparison: [],
  },
  // Tier B — aspirational
  'chi-phi-du-lich': {
    featured: '',
    comparison: [],
  },
}

// ─── Module state — private, mutated bởi loader ─────────────────────────────
// Dùng object wrapper để getter luôn read latest. Component không cần subscribe
// vì App.jsx await load xong mới render Routes.

let _brands = { ...DEFAULT_BRANDS }
let _toolAffiliates = { ...DEFAULT_TOOL_AFFILIATES }
let _loaded = false

/**
 * Fetch remote config từ /api/affiliates và override defaults.
 *
 * Idempotent — gọi nhiều lần OK, chỉ fetch 1 lần. Throw silently — caller
 * chỉ cần await, không cần try/catch (defaults vẫn dùng được).
 */
export async function loadAffiliateConfig() {
  if (_loaded) return
  _loaded = true

  try {
    const res = await fetch('/api/affiliates', { cache: 'no-store' })
    if (!res.ok) return

    const data = await res.json()
    if (data?.brands && typeof data.brands === 'object') {
      _brands = data.brands
    }
    if (data?.toolAffiliates && typeof data.toolAffiliates === 'object') {
      _toolAffiliates = data.toolAffiliates
    }
  } catch (err) {
    // Network/parse fail → giữ defaults. Không log noisy ở prod.
    if (import.meta.env.DEV) console.warn('[affiliates] load failed:', err)
  }
}

/**
 * Lấy snapshot của config hiện tại — dùng cho /admin editor.
 * Trả deep-clone để caller mutate thoải mái không ảnh hưởng module state.
 */
export function getAffiliateConfigSnapshot() {
  return {
    brands: JSON.parse(JSON.stringify(_brands)),
    toolAffiliates: JSON.parse(JSON.stringify(_toolAffiliates)),
  }
}

/**
 * Get default config — dùng khi admin muốn reset hoặc seed lần đầu.
 */
export function getDefaultAffiliateConfig() {
  return {
    brands: JSON.parse(JSON.stringify(DEFAULT_BRANDS)),
    toolAffiliates: JSON.parse(JSON.stringify(DEFAULT_TOOL_AFFILIATES)),
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Build SubID theo convention: {tool}_{placement}_{brand}_{variant}
 * VD: tinh-lai-vay_featured_vibmax_v1
 */
export function buildSubId(tool, placement, brandSlug, variant = 'v1') {
  return `${tool}_${placement}_${brandSlug}_${variant}`
}

/**
 * Build affiliate URL có gắn SubID (+ UTM optional).
 *
 * Accesstrade convention: sub1-sub5 cho publisher tracking per-click.
 *   - sub1 = SubID Chilathu (per tool/placement) — mình append
 *   - sub4 = tag do Accesstrade auto-set (vd `oneatweb`) — giữ nguyên
 *
 * UTM params có thể không pass qua Accesstrade redirect nhưng vẫn set cho
 * non-Accesstrade URL (brand placeholder hiện đang link thẳng về homepage).
 */
export function buildAffiliateUrl(brandSlug, tool, placement, variant = 'v1') {
  const brand = _brands[brandSlug]
  if (!brand) {
    if (import.meta.env.DEV) console.warn(`[affiliate] Unknown brand: ${brandSlug}`)
    return '#'
  }

  let url
  try {
    url = new URL(brand.url)
  } catch {
    if (import.meta.env.DEV) console.warn(`[affiliate] Invalid URL for ${brandSlug}: ${brand.url}`)
    return '#'
  }

  const subId = buildSubId(tool, placement, brandSlug, variant)
  url.searchParams.set('sub1', subId)
  url.searchParams.set('utm_source', 'chilathu')
  url.searchParams.set('utm_medium', 'tool')
  url.searchParams.set('utm_campaign', tool)
  url.searchParams.set('utm_content', placement)

  return url.toString()
}

/**
 * Get brand config. Trả null nếu brand không tồn tại.
 */
export function getBrand(slug) {
  return _brands[slug] || null
}

/**
 * Get affiliate config cho 1 tool — bao gồm brand object (đã hydrate) cho
 * featured + comparison.
 *
 * Filter rule: chỉ trả brand có `approved: true` (URL thật, track được).
 *   - Featured: null nếu brand chưa approved → AffiliateBlock không render CTA.
 *   - Comparison: chỉ giữ approved brand. Nếu < 2 brand → trả [] để không show
 *     bảng "so sánh" 1 dòng (vô nghĩa).
 *
 * → Khi thêm brand mới, chỉ cần set `approved: true` qua /admin → auto show.
 */
export function getToolAffiliates(toolSlug) {
  const config = _toolAffiliates[toolSlug]
  if (!config) return null

  const featuredBrand = getBrand(config.featured)
  const approvedFeatured = featuredBrand?.approved ? featuredBrand : null

  const approvedComparison = (config.comparison || [])
    .map(getBrand)
    .filter((b) => b && b.approved)

  // Bảng so sánh cần ít nhất 2 brand — dưới ngưỡng thì ẩn hoàn toàn.
  const comparison = approvedComparison.length >= 2 ? approvedComparison : []

  return {
    featured: approvedFeatured,
    comparison,
  }
}
