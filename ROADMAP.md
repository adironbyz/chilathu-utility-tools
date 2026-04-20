# ChilàThu Tools — Roadmap
> Domain: `tienich.chilathu.com` · Tech: React + Vite · Deploy: Cloudflare Pages
> Cập nhật: 2026-04-19

---

## Stack & conventions

- React + Vite, react-router-dom v6, Cloudflare Pages
- Icons: `@hugeicons/react` + `@hugeicons/core-free-icons`
- CSS: `--m-*` tokens từ Notebook Design System (shared với bills-app)
- Mỗi tool = 1 route `/slug`, 1 folder `src/pages/ToolName/`, 1 spec trong `/<slug>/spec.md`

### Tool page structure (bắt buộc)
- **Header**: Logo (left) + `DashboardSquare01Icon` navigate('/') (right) — KHÔNG có tool name ở header
- **Body đầu tiên**: `<h1 className="ttd-page-title">` — tool name to, rõ, trong content
- **Affiliate block** (sau result card): `<AffiliateBlock tool="..." cta={...} />` —
  contextual CTA + comparison table + disclosure. Chỉ render sau khi user ra kết quả.
  Xem `src/components/affiliate/README.md`.
- **Footer**: 1 dòng text link "Theo dõi thu chi với Chilathu.com" + `LinkSquare01Icon` — KHÔNG đóng khung card

---

## Sprint 1 — Công cụ cơ bản

| Tool | Slug | Status | Ghi chú |
|------|------|--------|---------|
| Tính tiền điện EVN | `/tinh-tien-dien` | ✅ Live | Sinh hoạt + TOU (kinh doanh/sản xuất/hành chính). Nông nghiệp pending data. Bug bậc 1 (min:0→1) đã fix. |
| Tính lương NET/GROSS | `/tinh-luong` | ✅ Live | Gross → Net, BHXH & thuế TNCN lũy tiến |
| Tính lãi vay | `/tinh-lai-vay` | ✅ Live | 4 mode theo intent: Vay nhanh (lãi đơn, %/tháng) / Mua nhà (dư nợ giảm dần + lãi hỗn hợp cố định→thả nổi) / Mua xe / Vay tiêu dùng. Bảng lịch trả nợ, expand nếu >24 tháng. |
| Chia tiền nhóm | `/chia-tien` | ✅ Live | 2 mode: Chia đều (total ÷ N) / Theo món (thêm thành viên, ghi chi tiêu, ai trả, ai dùng → tính settlement tối giản). Copy kết quả as text. |

---

## Sprint 2 — Mở rộng

| Tool | Slug | Status | Ghi chú |
|------|------|--------|---------|
| Tính tiền nước | `/tinh-tien-nuoc` | ✅ Live | Bậc thang sinh hoạt, đủ 63 tỉnh thành |
| Tính trả góp | `/tra-gop` | ✅ Live | 3 mode: 0% không phí / 0% có phí chuyển đổi (hiện lãi suất thực tế) / Có lãi suất dư nợ giảm dần. Bảng lịch thanh toán. |
| Lãi thẻ tín dụng | `/lai-the-tin-dung` | ✅ Live | Dư nợ + lãi/tháng. 3 mode: không trả / tối thiểu 5% / tự nhập. Bảng tháng chi tiết. |
| Chi phí du lịch | `/chi-phi-du-lich` | ✅ Live | Thêm chi phí theo 7 hạng mục (vé, lưu trú, ăn, đi lại, vui chơi, mua sắm, khác). Đổi ngoại tệ (USD/THB/JPY/KRW/EUR/SGD) với tỷ giá tuỳ chỉnh. Tổng kết: per person + biểu đồ % theo category. Copy tổng kết. |

---

## Infrastructure

| Hạng mục | Status | Ghi chú |
|----------|--------|---------|
| Domain `tienich.chilathu.com` | ✅ Live | Cloudflare Pages |
| OG meta tags | ✅ Done | og:image.png trong `public/`, static cho tất cả routes |
| Home page `/` | ✅ Done | Grid 8 tools + bills-app flagship card (UTM) |
| Dynamic OG per tool | ⬜ Backlog | Cần Cloudflare Pages Functions — scope sau |
| Nông nghiệp pricing | ⬜ Pending | Chờ ảnh QĐ 1279 trang nông nghiệp |
| GA4 tracking | ✅ Live | Measurement ID `G-Z5P0XQWL0N` đã trong `index.html`. Event `affiliate_clicked` tự fire qua `trackAffiliateClick()` khi `AffiliateBlock` được plug vào. |

---

## Affiliate monetization

> Plan gốc: `tools-chilathu-affiliate-plan.md` (2026-04). Lý do build: đang chạy ads kéo traffic → cần monetize.

### Components — shared (✅ Live)
- `src/data/affiliates.js` — brand registry (10 brand Tier 1+2) + tool→brand mapping + SubID/URL helpers
- `src/lib/affiliateTracking.js` — GA4 `affiliate_clicked` event; stub sẵn cho DB log khi Worker ready
- `src/components/affiliate/` — `AffiliateBlock` (wrapper) + `AffiliateCTA` + `AffiliateComparison` + `AffiliateDisclosure`
- Style prefix `.ta-*`, 100% `--m-*` tokens

### Tool integration status

8 tool đều live. Mapping sẵn trong `src/data/affiliates.js`.

| Tool | Tier | Mapping (featured + comparison) | Plugged in? |
|------|------|---------|-------------|
| `/tinh-luong` | S | Cake + TNEX/Timo/Finhay/Tikop | ⬜ TODO |
| `/tinh-lai-vay` | S | FE Credit + Home Credit/Cake/TPBank | ⬜ TODO |
| `/tra-gop` | S | Home Credit + FE Credit/TPBank | ⬜ TODO |
| `/lai-the-tin-dung` | S | TPBank + Shinhan/Cake | ⬜ TODO |
| `/tinh-tien-dien` | A | Cake + TNEX/Timo (bill payment angle) | ⬜ TODO |
| `/tinh-tien-nuoc` | A | TNEX + Cake/Timo | ⬜ TODO |
| `/chia-tien` | A | TNEX + Timo/Cake (free-transfer angle) | ⬜ TODO |
| `/chi-phi-du-lich` | B | TPBank + Shinhan/Cake (FX / cashback) | ⬜ TODO |

### Infrastructure — affiliate

| Hạng mục | Status | Ghi chú |
|----------|--------|---------|
| Accesstrade publisher apply | ⬜ TODO | Apply với domain root `chilathu.com` |
| Tier 1 campaigns | ⬜ TODO | Cake, TNEX, Timo, Finhay, Tikop, Infina |
| Tier 2 campaigns | ⬜ TODO | TPBank, Shinhan, FE Credit, Home Credit — apply sau 2-4 tuần có traffic proof |
| Redirect layer `/go/:brand` | ⬜ TODO | Cloudflare Worker + Supabase `affiliate_clicks` table — swap URL builder khi ready |
| Admin tool (link management) | ⬜ Backlog | Build ở tháng 2+ khi scale theo plan section 7 |

---

## Dropped — không làm nữa

Ba tool khỏi Sprint 3 cũ đã drop (2026-04-19). Folder rỗng ở root cần xoá khi dọn repo.

- `tiet-kiem` — Tiết kiệm bao lâu mua được X? (overlap với app.chilathu.com goal feature)
- `mua-duoc-khong` — Mua được không? (intent nhẹ, không pay-off)
- `quy-khan-cap` — Quỹ khẩn cấp cần bao nhiêu? (content, không tính toán)

---

## Files quan trọng

```
utility-tools/
├── src/
│   ├── App.jsx              ← routes (8 tools)
│   ├── pages/               ← Home + 8 tool pages, tất cả ✅ Live
│   │   ├── Home/
│   │   ├── TinhTienDien/
│   │   ├── TinhTienNuoc/
│   │   ├── TinhLuong/
│   │   ├── LaiTheTinDung/
│   │   ├── TinhLaiVay/
│   │   ├── TraGop/
│   │   ├── ChiaTien/
│   │   └── DuLich/
│   ├── data/
│   │   ├── electricityRates.js  ← bảng giá EVN QĐ 1279
│   │   ├── salaryRates.js       ← BHXH + thuế TNCN lũy tiến
│   │   ├── waterRates.js        ← bậc thang nước 63 tỉnh
│   │   └── affiliates.js        ← brand registry + tool mapping + URL/SubID helpers
│   ├── lib/
│   │   └── affiliateTracking.js ← GA4 event + DB log stub
│   └── components/
│       ├── Logo.jsx
│       ├── SEO.jsx
│       ├── ToolMenu.jsx
│       └── affiliate/           ← AffiliateBlock / CTA / Comparison / Disclosure + README
├── public/
│   └── og-image.png         ← OG thumbnail (1200×630)
├── index.html               ← OG meta tags
└── ROADMAP.md               ← file này
```
