/**
 * AffiliateReferralModal — interstitial cho brand có `referralCode`.
 *
 * Lý do tồn tại: một số campaign (vd VIB App Max) attribution không dựa vào
 * cookie web mà dựa vào việc user tự gõ "mã giới thiệu" trong app khi đăng ký.
 * Nếu user quên → mình không được ghi nhận commission dù user đến từ link mình.
 *
 * Flow:
 *   User click CTA → preventDefault → modal mở
 *   → user thấy mã to, bấm "Chép" (1-tap copy)
 *   → bấm "Tải app & đăng ký" → tab mới mở link Accesstrade
 *   → app Max mở trong App Store / Google Play
 *   → user paste mã đã chép vào ô "Mã giới thiệu"
 *
 * Tracking:
 *   - `affiliate_clicked` đã fire ở parent (CTA/Comparison) trước khi mở modal
 *   - `referral_code_copied` fire khi user bấm Chép
 *
 * Props:
 *   brand     — brand object, phải có .referralCode
 *   href      — affiliate URL cuối đã có SubID (từ buildAffiliateUrl)
 *   tool      — để tracking event copy
 *   placement — default 'featured'
 *   onClose   — fn đóng modal
 */

import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Copy01Icon, Cancel01Icon } from '@hugeicons/core-free-icons'
import { trackAffiliateClick } from '../../lib/affiliateTracking.js'

export default function AffiliateReferralModal({
  brand,
  href,
  tool,
  placement = 'featured',
  onClose,
}) {
  const [copied, setCopied] = useState(false)

  // ESC để đóng — quen thuộc cho user desktop. Mobile tap backdrop.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    // Lock scroll trên body để modal focus hoàn toàn
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  if (!brand?.referralCode) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(brand.referralCode)
      setCopied(true)
      trackAffiliateClick({
        tool,
        brand: brand.slug,
        placement: `${placement}_copycode`,
        variant: 'v1',
      })
      setTimeout(() => setCopied(false), 2200)
    } catch (err) {
      // Fallback cho browser cấm clipboard (iOS Safari < 13.4)
      // Select text + prompt user tự copy
      const el = document.getElementById('ta-referral-code-text')
      if (el) {
        const range = document.createRange()
        range.selectNodeContents(el)
        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(range)
      }
      console.warn('[affiliate] clipboard write failed, user must copy manually', err)
    }
  }

  const handleProceed = () => {
    // Mở tab mới và đóng modal. Không navigate same-tab vì user đang ở giữa
    // tool result và có thể muốn quay lại.
    window.open(href, '_blank', 'noopener,noreferrer')
    onClose()
  }

  return (
    <div
      className="ta-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ta-referral-title"
    >
      <div className="ta-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="ta-modal-close"
          onClick={onClose}
          aria-label="Đóng"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={18} color="currentColor" strokeWidth={2} />
        </button>

        <div className="ta-modal-brand">
          <div className="ta-logo" style={{ background: brand.color }}>
            {brand.initial}
          </div>
          <div className="ta-modal-name">{brand.name}</div>
        </div>

        <h3 id="ta-referral-title" className="ta-modal-title">
          Đừng quên nhập mã giới thiệu trong app
        </h3>

        <p className="ta-modal-desc">
          Khi đăng ký trong app {brand.name}, paste mã này vào ô "Mã giới thiệu"
          để được ghi nhận ưu đãi duyệt nhanh.
        </p>

        <div className="ta-modal-code-wrap">
          <div id="ta-referral-code-text" className="ta-modal-code">
            {brand.referralCode}
          </div>
          <button
            type="button"
            className={`ta-modal-copy${copied ? ' is-copied' : ''}`}
            onClick={handleCopy}
          >
            <HugeiconsIcon icon={Copy01Icon} size={14} color="currentColor" strokeWidth={2} />
            {copied ? 'Đã chép ✓' : 'Chép mã'}
          </button>
        </div>

        <button
          type="button"
          className="ta-modal-proceed"
          onClick={handleProceed}
        >
          Tải app & đăng ký
        </button>

        <div className="ta-modal-hint">
          Không nhập mã = không nhận được ưu đãi duyệt nhanh.
        </div>
      </div>
    </div>
  )
}
