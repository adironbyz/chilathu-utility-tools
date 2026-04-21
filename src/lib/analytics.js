/**
 * analytics.js — central tracker cho tienich.chilathu.com
 *
 * Destinations:
 *   GA4   — property chilathu-tools (G-5BMHEBYFVQ), gắn qua gtag ở index.html
 *   Meta  — Rognarak Pixel (479018931033974), gắn qua fbq ở index.html
 *
 * Event taxonomy (GA4 names / Pixel names song song):
 *   tool_card_click       — user bấm card trên homepage  (diagnostic)
 *   app_crosslink_click   — user bấm link sang app.chilathu.com  (KEY event)
 *   tool_calculate_done   — user ra kết quả trong 1 tool  (KEY event + Meta conversion)
 *   affiliate_clicked     — user bấm CTA affiliate  (KEY event — ở affiliateTracking.js)
 *
 * Dùng:
 *   import { trackToolCardClick, trackAppCrosslink } from '@/lib/analytics'
 *   onClick={() => trackToolCardClick('tinh-luong', { section: 'finance', isPopular: true })}
 *
 * An toàn nếu gtag / fbq chưa load (adblocker / SSR / test env): silent no-op.
 */

function gtagSafe(...args) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args)
  }
}

function fbqSafe(...args) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq(...args)
  }
}

/**
 * Low-level wrapper — gọi trực tiếp khi event không có helper riêng.
 */
export function trackEvent(name, params = {}) {
  gtagSafe('event', name, params)
}

/**
 * User click 1 tool card trên homepage.
 *
 * @param {string} toolSlug     — VD 'tinh-luong'
 * @param {Object} [opts]
 * @param {string} [opts.section]    — 'finance' | 'bills' | 'travel'
 * @param {boolean} [opts.isPopular] — có badge "Phổ biến"
 * @param {boolean} [opts.isNew]     — có badge "Mới"
 */
export function trackToolCardClick(toolSlug, opts = {}) {
  trackEvent('tool_card_click', {
    tool_slug: toolSlug,
    section: opts.section || 'unknown',
    is_popular: opts.isPopular ? 1 : 0,
    is_new: opts.isNew ? 1 : 0,
  })
}

/**
 * User click link về app.chilathu.com (từ home hoặc từ tool footer).
 * Dùng `transport_type: 'beacon'` để fire OK cả khi same-tab navigate.
 *
 * @param {string} source       — 'home' | tool slug ('tinh-luong', ...)
 * @param {Object} [opts]
 * @param {string} [opts.campaign]  — UTM campaign value, VD 'tln_footer'
 */
export function trackAppCrosslink(source, opts = {}) {
  trackEvent('app_crosslink_click', {
    source,
    campaign: opts.campaign || '',
    transport_type: 'beacon',
  })
}

/**
 * User hoàn thành 1 phép tính — fire 1 lần khi result xuất hiện.
 * Bắn song song GA4 + Meta Pixel để Meta ads có thể optimize theo conversion này.
 *
 * @param {string} toolSlug
 */
export function trackToolCalculateDone(toolSlug) {
  // GA4
  trackEvent('tool_calculate_done', {
    tool_slug: toolSlug,
  })
  // Meta Pixel — custom event, dùng làm Custom Conversion trong Ads Manager
  fbqSafe('trackCustom', 'ToolCalculateDone', {
    tool_slug: toolSlug,
  })
}

/**
 * User mở 1 tool page — dùng cho Meta Pixel `ViewContent` (standard event).
 * Giúp Meta build retargeting audience "ai đã xem tool X mà chưa tính toán".
 * Không bắn về GA4 vì GA4 đã tự log page_view.
 *
 * @param {string} toolSlug
 */
export function trackToolView(toolSlug) {
  fbqSafe('track', 'ViewContent', {
    content_name: toolSlug,
    content_category: 'tool',
  })
}
