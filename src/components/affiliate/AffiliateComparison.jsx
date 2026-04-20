/**
 * AffiliateComparison — bảng so sánh 3–5 brand.
 *
 * Theo plan: "Comparison table convert tốt nhất cho finance. User thích so sánh
 * hơn là bị pitch." Mỗi row = 1 affiliate link, SubID khác nhau → biết row nào
 * earn tiền.
 *
 * Props:
 *   brands      — array brand objects (hydrated từ getToolAffiliates)
 *   tool        — tool slug
 *   title       — header bảng. Optional, default "So sánh nhanh"
 *   metricKey   — tên field hiển thị làm "metric" cho mỗi brand.
 *                 Default 'metric' (dùng field sẵn có). Tool có thể override bằng
 *                 'customMetrics' prop để bơm số động (vd lãi suất theo mức vay của user).
 *   customMetrics — object { [brandSlug]: 'custom metric string' } — override mặc định
 *   placement   — default 'comparison'
 *   variant     — default 'v1'
 *   ctaLabel    — text button mỗi row. Default "Xem"
 */

import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { buildAffiliateUrl } from '../../data/affiliates.js'
import { trackAffiliateClick } from '../../lib/affiliateTracking.js'
import AffiliateReferralModal from './AffiliateReferralModal.jsx'

function BrandLogo({ brand }) {
  if (brand.logoSrc) {
    return (
      <div className="ta-logo">
        <img src={brand.logoSrc} alt={brand.name} />
      </div>
    )
  }
  return (
    <div className="ta-logo" style={{ background: brand.color }}>
      {brand.initial}
    </div>
  )
}

export default function AffiliateComparison({
  brands,
  tool,
  title = 'So sánh nhanh',
  metricKey = 'metric',
  customMetrics = {},
  placement = 'comparison',
  variant = 'v1',
  ctaLabel = 'Xem',
}) {
  // Chỉ 1 modal mở mỗi lúc — state giữ { brand, href } của row đang active.
  const [referralTarget, setReferralTarget] = useState(null)

  if (!brands || brands.length === 0) return null

  return (
    <>
      <div className="ta-comparison">
        <div className="ta-comparison-title">{title}</div>
        {brands.map((brand) => {
          const href = buildAffiliateUrl(brand.slug, tool, placement, variant)
          const metric = customMetrics[brand.slug] ?? brand[metricKey]

          const handleClick = (e) => {
            trackAffiliateClick({ tool, brand: brand.slug, placement, variant })
            if (brand.referralCode) {
              e.preventDefault()
              setReferralTarget({ brand, href })
            }
          }

          return (
            <a
              key={brand.slug}
              href={href}
              target="_blank"
              rel="noopener sponsored"
              className="ta-comparison-row"
              onClick={handleClick}
            >
              <BrandLogo brand={brand} />
              <div className="ta-comparison-body">
                <div className="ta-comparison-name">{brand.name}</div>
                {metric && <div className="ta-comparison-metric">{metric}</div>}
              </div>
              <span className="ta-comparison-cta">
                {ctaLabel}
                <HugeiconsIcon icon={ArrowRight01Icon} size={12} color="currentColor" strokeWidth={2.5} />
              </span>
            </a>
          )
        })}
      </div>

      {referralTarget && (
        <AffiliateReferralModal
          brand={referralTarget.brand}
          href={referralTarget.href}
          tool={tool}
          placement={placement}
          onClose={() => setReferralTarget(null)}
        />
      )}
    </>
  )
}
