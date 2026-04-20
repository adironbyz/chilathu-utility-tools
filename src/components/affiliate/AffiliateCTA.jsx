/**
 * AffiliateCTA — single contextual CTA sau khi user ra kết quả.
 *
 * Nguyên tắc copy (theo plan section 5):
 *   - Nói lợi ích, không nói action
 *   - Dùng số từ result của user vào `contextLine` để tăng relevance
 *
 * Props:
 *   brand       — brand object từ BRANDS[slug]
 *   tool        — tool slug, dùng cho SubID & tracking
 *   benefit     — headline (ngắn, là "giải pháp" dạng lợi ích). Required.
 *   contextLine — câu sub dùng số từ result của user. Optional nhưng nên có.
 *   placement   — default 'featured'. Giữ riêng nếu muốn track vị trí khác.
 *   variant     — default 'v1'. Đổi khi A/B test copy mới.
 *
 * Example:
 *   <AffiliateCTA
 *     brand={getBrand('cake')}
 *     tool="tinh-luong"
 *     benefit="Giữ lương Net tăng 5.6%/năm thay vì nằm không"
 *     contextLine={`Với lương thực nhận ${formatVND(net)}, gửi tiết kiệm Cake sinh ~${formatVND(net*0.056)}/năm.`}
 *   />
 */

import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { buildAffiliateUrl } from '../../data/affiliates.js'
import { trackAffiliateClick } from '../../lib/affiliateTracking.js'
import AffiliateReferralModal from './AffiliateReferralModal.jsx'
import BrandLogo from './BrandLogo.jsx'

export default function AffiliateCTA({
  brand,
  tool,
  benefit,
  contextLine,
  placement = 'featured',
  variant = 'v1',
}) {
  const [showReferral, setShowReferral] = useState(false)

  if (!brand) return null

  const href = buildAffiliateUrl(brand.slug, tool, placement, variant)

  const handleClick = (e) => {
    trackAffiliateClick({ tool, brand: brand.slug, placement, variant })

    // Brand cần user nhập mã trong app → hiển thị interstitial thay vì redirect.
    // Middle-click / ctrl-click vẫn hoạt động như <a> bình thường (không có e.button = 0)
    // nhưng user sẽ mất interstitial — trade-off chấp nhận được cho rare case.
    if (brand.referralCode) {
      e.preventDefault()
      setShowReferral(true)
    }
  }

  return (
    <>
      <a
        href={href}
        target="_blank"
        rel="noopener sponsored"
        className="ta-cta"
        onClick={handleClick}
      >
        <BrandLogo brand={brand} />
        <div className="ta-cta-body">
          <div className="ta-cta-benefit">{benefit}</div>
          <div className="ta-cta-sub">
            {contextLine}
            {contextLine && ' '}
            <span className="ta-cta-partner">{brand.name}</span>
          </div>
        </div>
        <span className="ta-cta-arrow" aria-hidden="true">
          <HugeiconsIcon icon={ArrowRight01Icon} size={20} color="currentColor" strokeWidth={2} />
        </span>
      </a>

      {showReferral && (
        <AffiliateReferralModal
          brand={brand}
          href={href}
          tool={tool}
          placement={placement}
          onClose={() => setShowReferral(false)}
        />
      )}
    </>
  )
}
