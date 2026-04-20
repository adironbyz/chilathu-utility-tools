/**
 * AffiliateDisclosure — dòng text minh bạch về affiliate.
 *
 * Theo plan section 4.4: bắt buộc ở mỗi placement affiliate, không giấu.
 * Style nhỏ, italic, muted — không chiếm attention nhưng luôn thấy.
 */
export default function AffiliateDisclosure({ children }) {
  return (
    <p className="ta-disclosure">
      {children ||
        'Chúng tôi nhận hoa hồng khi bạn đăng ký qua link này. Không ảnh hưởng đến giá bạn trả.'}
    </p>
  )
}
