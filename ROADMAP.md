# ChilàThu Tools — Roadmap
> Domain: `tienich.chilathu.com` · Tech: React + Vite · Deploy: Cloudflare Pages
> Cập nhật: 2026-04-20

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
| Tính lãi vay | `/tinh-lai-vay` | ✅ Live | 4 mode theo intent: Vay nhanh (lãi đơn, %/tháng) / Mua nhà (dư nợ giảm dần + lãi hỗn hợp cố định→thả nổi) / Mua xe / Vay tiêu dùng. Bảng lịch trả nợ, expand nếu >24 tháng. Fix 2026-04-20: bảng hiển thị full number thay vì rounding (4.166.667đ thay vì 4.2tr). |
| Chia tiền nhóm | `/chia-tien` | ✅ Live | 2 mode: Chia đều (total ÷ N) / Theo món (thêm thành viên, ghi chi tiêu, ai trả, ai dùng → tính settlement tối giản). Copy kết quả as text. |

---

## Sprint 2 — Mở rộng

| Tool | Slug | Status | Ghi chú |
|------|------|--------|---------|
| Tính tiền nước | `/tinh-tien-nuoc` | ✅ Live | Bậc thang sinh hoạt, đủ 63 tỉnh thành |
| Tính trả góp | `/tra-gop` | ✅ Live | 3 mode: 0% không phí / 0% có phí chuyển đổi (hiện lãi suất thực tế) / Có lãi suất dư nợ giảm dần. Bảng lịch thanh toán. Fix 2026-04-20: full number display. |
| Lãi thẻ tín dụng | `/lai-the-tin-dung` | ✅ Live | Dư nợ + lãi/tháng. 3 mode: không trả / tối thiểu 5% / tự nhập. Bảng tháng chi tiết. Fix 2026-04-20: full number display. |
| Chi phí du lịch | `/chi-phi-du-lich` | ✅ Live | Thêm chi phí theo 7 hạng mục (vé, lưu trú, ăn, đi lại, vui chơi, mua sắm, khác). Đổi ngoại tệ (USD/THB/JPY/KRW/EUR/SGD) với tỷ giá tuỳ chỉnh. Tổng kết: per person + biểu đồ % theo category. Copy tổng kết. Fix 2026-04-20: full number display. |

---

## Infrastructure

| Hạng mục | Status | Ghi chú |
|----------|--------|---------|
| Domain `tienich.chilathu.com` | ✅ Live | Cloudflare Pages |
| OG meta tags | ✅ Done | og:image.png trong `public/`, static cho tất cả routes |
| Home page `/` | ✅ Done | Grid 8 tools + bills-app flagship card (UTM) |
| Dynamic OG per tool | ⬜ Backlog | Cần Cloudflare Pages Functions — scope sau |
| Nông nghiệp pricing | ⬜ Pending | Chờ ảnh QĐ 1279 trang nông nghiệp |
| GA4 tracking | ✅ Live | Measurement ID `G-5BMHEBYFVQ` (property `chilathu-tools` — tách khỏi app.chilathu.com). Events: `affiliate_clicked` (via `trackAffiliateClick`), `tool_card_click` (home), `app_crosslink_click` (home + tool footers). Helper ở `src/lib/analytics.js`. |

---

## Affiliate monetization

> Plan gốc: `tools-chilathu-affiliate-plan.md` (2026-04). Lý do build: đang chạy ads kéo traffic → cần monetize.

### Components — shared (✅ Live)
- `src/data/affiliates.js` — brand registry + tool→brand mapping + SubID/URL helpers.
  **Defaults chỉ ship vibmax** (brand duy nhất approved). Các brand khác add runtime qua `/admin`.
- `src/lib/affiliateTracking.js` — GA4 `affiliate_clicked` event; stub sẵn cho DB log khi Worker ready
- `src/components/affiliate/` — `AffiliateBlock` (wrapper) + `AffiliateCTA` + `AffiliateComparison` + `AffiliateReferralModal` (interstitial cho app-based campaign cần mã) + `AffiliateDisclosure` + `BrandLogo` (shared, với `<img>` fallback → initial+color nếu ảnh fail)
- Style prefix `.ta-*`, 100% `--m-*` tokens

### Admin infrastructure (✅ Live)
- `/admin` page — login + Editor UI. Quản lý brands + tool mappings mà không cần redeploy.
- Cloudflare Pages Functions:
  - `POST /api/admin/login` · `POST /api/admin/logout` · `GET /api/admin/session` — HMAC-SHA256 session cookie, HttpOnly/Secure/SameSite=Strict
  - `GET /api/affiliates` · `POST /api/affiliates` — KV-backed config với validator
- KV binding `AFFILIATES_KV` + env `ADMIN_PASSWORD` · `SESSION_SECRET` (xem `ADMIN-SETUP.md`)
- App preload: `loadAffiliateConfig()` race với 1.5s timeout trong `App.jsx` — fail-safe về defaults nếu network chậm
- In-app tutorial drawer (nút "Hướng dẫn" ở header) — 2 workflow: Thêm brand mới · Đổi featured/comparison + field reference
- Brand schema: slug, name, initial, color, **logoSrc** (optional PNG/SVG URL; fallback initial+color nếu fail), tagline, metric, url, approved, referralCode

### Tool integration status

> Brand mapping chi tiết per tool: `AFFILIATE-PER-TOOL-MAP.md`

| Tool | Tier | Featured (default) | Plugged in? | Next brand cần apply |
|------|------|---------|-------------|----------------------|
| `/tinh-lai-vay` | S | vibmax | ✅ Done | TPBank, Shinhan, FE, Tima |
| `/tra-gop` | S | vibmax | ✅ Done | VPBank CC, SPayLater, Home Credit |
| `/lai-the-tin-dung` | S | vibmax | ✅ Done | TPBank Evo (balance transfer), MoMo Vay |
| `/tinh-luong` | S | cake | ✅ Done | Cake (featured) + TNEX / Timo / Finhay / Tikop. contextLine: "Gửi {net} tại". customMetrics: lãi ~5,6%/năm. |
| `/chi-phi-du-lich` | S | — | ⬜ TODO | **Booking / Agoda / Klook / Traveloka** + Wise + Bảo Minh |
| `/chia-tien` | A | — | ⬜ TODO | **MoMo / ZaloPay** + Cake |
| `/tinh-tien-dien` | A | — | ⬜ TODO | **MoMo / ZaloPay / VNPay** + FPT Solar lead |
| `/tinh-tien-nuoc` | A | — | ⬜ TODO | MoMo + Karofi / Kangaroo |

> Comparison tables cần ≥2 brand approved để render. Hiện chỉ vibmax approved → mọi
> tool show single CTA, chưa có bảng so sánh. Comparison sẽ bật tự động khi add
> brand thứ 2 qua `/admin`.

### Infrastructure — affiliate

| Hạng mục | Status | Ghi chú |
|----------|--------|---------|
| Accesstrade publisher apply | ✅ Done | Publisher ID active, campaign VIB App Max đã duyệt |
| VIB App Max campaign | ✅ Live | URL affiliate + referral code `PAAT_2200776` + interstitial modal |
| Batch apply campaigns còn lại | ⬜ TODO | iShinhan, Tima, Lotte Finance, VPBank 3T, Cathay, Bảo Minh, VBI + Tier 1 (Cake, TNEX, Timo, Finhay, Tikop, Infina) |
| Admin tool (link management) | ✅ Live | `/admin` UI + KV + Pages Functions — không cần redeploy khi update config |
| Redirect layer `/go/:brand` | ⬜ Backlog | Cloudflare Worker + Supabase `affiliate_clicks` table — swap URL builder khi scale cần hard stats |

---

## Sprint 3 — Affiliate-driven new tools

> Quyết định 2026-04-20: build thêm tool mới để fill category Accesstrade chưa khai thác (MOBILE OFFER, Game, KOC/KOL, Entertainment) + comparison tool re-use Tier 1 brand đã apply.
> Spec chi tiết per-tool brand mapping: xem `AFFILIATE-PER-TOOL-MAP.md`.

### Tier 1 — High intent + high commission (build trước)

| Tool | Slug | Status | Category Accesstrade | Featured brand kỳ vọng | Ghi chú |
|------|------|--------|---------------------|------------------------|---------|
| So sánh TK tiết kiệm | `/so-sanh-tk-tiet-kiem` | ⬜ Spec | Financial & Service | Cake / TNEX / Timo / MB / VPBank | Re-use Tier 1 brand đã apply → ROI nhanh nhất. Input số tiền + kỳ hạn → table lãi suất 10 bank + CTA "Mở TK" |
| So sánh thẻ tín dụng | `/so-sanh-the-tin-dung` | ⬜ Spec | Financial & Service | TPBank / VPBank / Shinhan / MB / Sacombank | Filter theo income + mục đích (cashback / dặm bay / trả góp 0%) → recommend 2-3 thẻ. Commission 200-500k/thẻ duyệt |
| Cước data 3G/4G | `/cuoc-data-3g-4g` | ⬜ Spec | **MOBILE OFFER** | Viettel / Vina / Mobi / Wintel / Reddi / iTel | Fill category Accesstrade #1 đang trống. Chọn nhu cầu (data/phút/SMS) → recommend gói + đăng ký SIM/eSIM |
| Bảo hiểm xe máy/ô tô | `/bao-hiem-xe-may-oto` | ⬜ Spec | Financial & Service | Bảo Minh / PVI / PTI / VBI / Bảo Việt / Liberty | Bắt buộc — intent action ngay. Chọn loại xe + năm SX → list giá + mua online. Commission 50-200k/policy |

### Tier 2 — Mass traffic + cross-sell

| Tool | Slug | Status | Category Accesstrade | Featured brand kỳ vọng | Ghi chú |
|------|------|--------|---------------------|------------------------|---------|
| Tính cước Grab/Be/Xanh SM | `/tinh-cuoc-grab-be` | ⬜ Backlog | Online Service / Travel | Grab / Be / Xanh SM / Gojek | Input quãng đường → table giá + deeplink mở app + voucher. Daily intent |
| Tính TDEE / calo / nước | `/calo-tdee` | ⬜ Backlog | Mobile App + E-Commerce | MyFitnessPal / BetterMe / Lifesum / Centrum / Blackmores | Trend health, mass GenZ. CPI app + CPS thực phẩm chức năng |

### Tier 3 — Niche, high commission (chờ data Tier 1)

| Tool | Slug | Status | Category Accesstrade | Featured brand kỳ vọng | Ghi chú |
|------|------|--------|---------------------|------------------------|---------|
| Thuế hộ kinh doanh | `/tinh-thue-ho-kd` | ⬜ Backlog | Online Service | MISA AMIS / Fast / Cyberbiz / Sapo | SME owner intent. Commission cao |
| Vốn mở cửa hàng | `/tinh-chi-phi-mo-cua-hang` | ⬜ Backlog | Financial & Service + Online Service | KiotViet / Sapo / MISA + vay vốn SME | Cross-sell POS + vay doanh nghiệp |
| Quyết toán thuế TNCN cuối năm | `/uoc-tinh-thue-tncn-cuoi-nam` | ⬜ Backlog | Online Service + Financial & Service | TaxOnline / eTax mobile / Anpha | Seasonal Q1 hằng năm |

### Tier 4 — Fill category trống (Game / KOC / Entertainment)

| Tool | Slug | Status | Category Accesstrade | Featured brand kỳ vọng | Ghi chú |
|------|------|--------|---------------------|------------------------|---------|
| Setup PC stream game | `/tinh-chi-phi-stream-game` | ⬜ Idea | **Game** + E-Commerce | GearVN / Phong Vũ / An Phát / Hà Nội Computer | Fill category Game đang trống |
| Vốn mở kênh TikTok content | `/chi-phi-mo-kenh-tiktok-content` | ⬜ Idea | **KOC/KOL** | Thiết bị (E-Commerce) + Edumall / Unica | Fill category KOC/KOL |
| Du toán cuối tuần | `/du-toan-cuoi-tuan` | ⬜ Idea | **Entertainment** + F&B | GrabFood / ShopeeFood / CGV / Lotte | Fill category Entertainment |

### Build order

1. **`/so-sanh-tk-tiet-kiem`** — re-use brand đã apply, ship đầu tiên
2. **`/so-sanh-the-tin-dung`** — commission cao nhất, intent rõ
3. **`/cuoc-data-3g-4g`** — fill category MOBILE OFFER, dễ duyệt
4. **`/bao-hiem-xe-may-oto`** — seasonal-proof, intent bắt buộc
5. Tier 2-4 evaluate sau khi Tier 1 có GA4 data

### Avoid list

- Game cờ bạc / poker (cấm)
- Forex / sàn crypto (high reversal + risk)
- MMO / đào coin (compliance)

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
