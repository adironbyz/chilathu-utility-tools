/**
 * BrandLogo — hiển thị ảnh logo brand, fallback sang initial+color square nếu:
 *   (a) logoSrc trống/undefined
 *   (b) ảnh load fail (404, CORS, network) → onError trigger
 *
 * Dùng trong AffiliateCTA và AffiliateComparison.
 */

import { useState } from 'react'

export default function BrandLogo({ brand, className = 'ta-logo' }) {
  // Nếu ảnh đã fail 1 lần, không retry — show fallback luôn.
  const [failed, setFailed] = useState(false)

  const hasValidSrc =
    typeof brand.logoSrc === 'string' && brand.logoSrc.length > 0 && !failed

  if (hasValidSrc) {
    return (
      <div className={className}>
        <img
          src={brand.logoSrc}
          alt={brand.name}
          onError={() => setFailed(true)}
          loading="lazy"
          decoding="async"
        />
      </div>
    )
  }

  return (
    <div className={className} style={{ background: brand.color }}>
      {brand.initial}
    </div>
  )
}
