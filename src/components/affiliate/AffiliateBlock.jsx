/**
 * AffiliateBlock — convenience wrapper cho tool page.
 *
 * Gộp: section label + disclosure + contextual CTA (optional) + comparison table
 * (optional). Dùng khi tool muốn "drop in nhanh" thay vì lắp ghép từng piece.
 *
 * Fail-safe: nếu tool không có mapping trong TOOL_AFFILIATES → return null,
 * không render gì. Tool page không cần check gì thêm.
 *
 * Props:
 *   tool        — tool slug (required). VD 'tinh-luong'
 *   cta         — { benefit, contextLine } — bật single contextual CTA
 *   showComparison — boolean, default true. Bật bảng so sánh 3–5 brand
 *   comparisonTitle — override title bảng. Default "So sánh nhanh các lựa chọn"
 *   customMetrics — override metric theo số động của user.
 *                   VD: { cake: 'Lãi ' + formatVND(net*0.056) + '/năm' }
 *   sectionLabel — override label phía trên. Default "Gợi ý cho bạn"
 *
 * Example — tool Tính lương:
 *   <AffiliateBlock
 *     tool="tinh-luong"
 *     cta={{
 *       benefit: 'Giữ lương sinh lãi thay vì nằm không',
 *       contextLine: `Gửi ${formatVND(result.net)} tại`,
 *     }}
 *     customMetrics={{
 *       cake: `Sinh ~${formatVND(result.net * 0.056)}/năm`,
 *     }}
 *   />
 */

import { getToolAffiliates } from '../../data/affiliates.js'
import AffiliateDisclosure from './AffiliateDisclosure.jsx'
import AffiliateCTA from './AffiliateCTA.jsx'
import AffiliateComparison from './AffiliateComparison.jsx'

export default function AffiliateBlock({
  tool,
  cta = null,
  showComparison = true,
  comparisonTitle,
  customMetrics = {},
  sectionLabel = 'Gợi ý cho bạn',
}) {
  const config = getToolAffiliates(tool)
  if (!config) return null

  const hasCTA = !!cta && !!config.featured

  // Filter featured brand out of comparison list — tránh lặp:
  // featured đã được show to ở trên rồi, bảng "các bên khác" phải là
  // các bên khác thật. Dù admin có set trùng thì UI vẫn dedupe.
  const comparisonBrands = hasCTA
    ? config.comparison.filter((slug) => slug !== config.featured)
    : config.comparison

  const hasComparison = showComparison && comparisonBrands.length > 0

  if (!hasCTA && !hasComparison) return null

  return (
    <section className="ta-section" aria-label="Gợi ý sản phẩm tài chính">
      <div className="ta-section-label">{sectionLabel}</div>
      <AffiliateDisclosure />

      {hasCTA && (
        <AffiliateCTA
          brand={config.featured}
          tool={tool}
          benefit={cta.benefit}
          contextLine={cta.contextLine}
        />
      )}

      {hasComparison && (
        <AffiliateComparison
          brands={comparisonBrands}
          tool={tool}
          title={comparisonTitle}
          customMetrics={customMetrics}
        />
      )}
    </section>
  )
}
