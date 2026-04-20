# Affiliate components

Bộ component shared cho affiliate placement trên `tienich.chilathu.com`.
Thiết kế theo `tools-chilathu-affiliate-plan.md` — Rog upload tháng 4/2026.

## Kiến trúc

```
data/affiliates.js          ← brand registry + tool mapping + URL/SubID helpers
lib/affiliateTracking.js    ← GA4 event + chỗ cắm DB log tương lai
components/affiliate/
  ├── Affiliate.css         ← style chung (--m-* tokens, prefix .ta-*)
  ├── AffiliateDisclosure   ← dòng disclosure nhỏ (bắt buộc ở mỗi placement)
  ├── AffiliateCTA          ← single contextual CTA (dùng số từ result)
  ├── AffiliateComparison   ← bảng so sánh 3–5 brand
  ├── AffiliateBlock        ← wrapper gộp cả 3, "drop in" nhanh
  └── index.js              ← barrel export
```

## Cách dùng — quick start (khuyến nghị)

Trong tool page, sau khi có `result`:

```jsx
import { AffiliateBlock } from '../../components/affiliate'
import '../../components/affiliate/Affiliate.css'
import { formatVND } from '../../data/salaryRates.js'

// ... trong JSX, sau Result card:
{result && (
  <AffiliateBlock
    tool="tinh-luong"
    cta={{
      benefit: 'Giữ lương sinh lãi thay vì nằm không trong tài khoản',
      contextLine: `Gửi ${formatVND(result.net)} tại`,
    }}
    customMetrics={{
      cake: `Sinh ~${formatVND(Math.round(result.net * 0.056))}/năm với lãi 5.6%`,
    }}
  />
)}
```

Nếu `tool` chưa có mapping trong `TOOL_AFFILIATES` → component tự return `null`.

## Cách dùng — manual composition

Khi cần custom placement (vd: CTA sau result, comparison ở sidebar riêng):

```jsx
import {
  AffiliateDisclosure,
  AffiliateCTA,
  AffiliateComparison,
} from '../../components/affiliate'
import { getBrand, getToolAffiliates } from '../../data/affiliates'

const { featured, comparison } = getToolAffiliates('tinh-luong') || {}

// ... JSX:
<section className="ta-section">
  <div className="ta-section-label">Gợi ý cho bạn</div>
  <AffiliateDisclosure />
  <AffiliateCTA
    brand={featured}
    tool="tinh-luong"
    benefit="..."
    contextLine="..."
  />
</section>

// ở chỗ khác, sau content giáo dục:
<AffiliateComparison
  brands={comparison}
  tool="tinh-luong"
  title="So sánh ngân hàng số"
/>
```

## Nguyên tắc copy

Theo plan section 5:

- **Nói lợi ích, không nói action**
  - Sai: "Đăng ký ngay" / "Mở tài khoản"
  - Đúng: "Tiết kiệm 2tr/năm phí thẻ" / "Giữ lương sinh lãi 5.6%/năm"
- **Dùng số từ result** — câu sub phải chứa số user vừa tính. Tăng relevance.
- **Không pitch trước khi user ra kết quả.** `AffiliateBlock` chỉ render sau `result`.

## Tracking & SubID

Mỗi click tự động:

1. Fire GA4 event `affiliate_clicked` với `{ tool_name, brand, placement, variant }`
2. Build URL có UTM + SubID theo convention: `{tool}_{placement}_{brand}_{variant}`

SubID ví dụ: `tinh-luong_featured_cake_v1`, `tinh-lai-vay_comparison_fecredit_v1`.

Filter theo SubID trong Accesstrade dashboard để biết chính xác tool + vị trí nào
đẻ ra tiền.

## Thêm brand mới

1. Apply campaign trên Accesstrade, chờ được duyệt
2. Mở `src/data/affiliates.js`
3. Thêm entry vào `BRANDS` (slug, name, initial, color, tagline, metric, url)
4. Thêm slug đó vào mapping `TOOL_AFFILIATES[tool].comparison` (hoặc set làm `featured`)
5. Deploy. Không cần sửa component.

## Khi /go/:brand redirect layer live

Theo plan section 4.1, tương lai sẽ có Cloudflare Worker redirect layer.
Khi đó:

1. Sửa `buildAffiliateUrl()` trong `data/affiliates.js` — trả về
   `/go/${brandSlug}?from=${tool}&pos=${placement}&v=${variant}` thay vì URL trực tiếp
2. Bật fetch POST trong `lib/affiliateTracking.js` (đã có stub sẵn)
3. Component không cần sửa

## A/B test variant

Đổi prop `variant` trong component hoặc `TOOL_AFFILIATES[tool]` mapping.
SubID tự update → GA4 + Accesstrade report phân biệt được.

```jsx
<AffiliateCTA brand={...} tool="tinh-luong" variant="v2" benefit="..." />
```

## Design tokens đã dùng

Tất cả style trong `Affiliate.css` chỉ dùng `--m-*` tokens (Notebook Design System).
Không hard-code hex. Xem `src/index.css` cho danh sách token.
