/**
 * Affiliate click tracking — single source for "what to do khi user click affiliate".
 *
 * Hiện tại: fire GA4 event `affiliate_clicked`. Khi Cloudflare Worker + Supabase
 * table `affiliate_clicks` ready, thêm fetch() POST vào /go/:brand ở đây.
 *
 * Dùng bằng cách:
 *   onClick={() => trackAffiliateClick({ tool, brand, placement, variant })}
 *
 * Component đã gọi sẵn trong AffiliateCTA + AffiliateComparison — tool page
 * thường không cần gọi trực tiếp.
 */

/**
 * Fire GA4 event + optional future DB log.
 *
 * @param {Object} opts
 * @param {string} opts.tool       — tool slug, vd 'tinh-luong'
 * @param {string} opts.brand      — brand slug, vd 'cake'
 * @param {string} opts.placement  — 'featured' | 'comparison' | 'sidebar' | 'footer'
 * @param {string} [opts.variant]  — A/B variant, default 'v1'
 */
export function trackAffiliateClick({ tool, brand, placement, variant = 'v1' }) {
  // GA4 event — chỉ fire nếu gtag đã load (tránh crash nếu GA4 chưa setup)
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'affiliate_clicked', {
      tool_name: tool,
      brand,
      placement,
      variant,
    })
  }

  // TODO: khi Cloudflare Worker `/go/:brand` live, thêm:
  // fetch('/api/affiliate-click', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ tool, brand, placement, variant }),
  //   keepalive: true, // request vẫn chạy sau khi page unload
  // }).catch(() => { /* silent — tracking fail không được block user */ })
}
