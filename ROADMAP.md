# ChilàThu Tools — Roadmap
> Domain: `tools.chilathu.com` · Tech: React + Vite · Deploy: Cloudflare Pages
> Cập nhật: 2026-04-18

---

## Stack & conventions

- React + Vite, react-router-dom v6, Cloudflare Pages
- Icons: `@hugeicons/react` + `@hugeicons/core-free-icons`
- CSS: `--m-*` tokens từ Notebook Design System (shared với bills-app)
- Mỗi tool = 1 route `/slug`, 1 folder `src/pages/ToolName/`, 1 spec trong `/<slug>/spec.md`

### Tool page structure (bắt buộc)
- **Header**: Logo (left) + `DashboardSquare01Icon` navigate('/') (right) — KHÔNG có tool name ở header
- **Body đầu tiên**: `<h1 className="ttd-page-title">` — tool name to, rõ, trong content
- **Footer**: 1 dòng text link "Theo dõi thu chi với Chilathu.com" + `LinkSquare01Icon` — KHÔNG đóng khung card
- Không có affiliate card

---

## Sprint 1 — Công cụ cơ bản

| Tool | Slug | Status | Ghi chú |
|------|------|--------|---------|
| Tính tiền điện EVN | `/tinh-tien-dien` | ✅ Live | Sinh hoạt + TOU (kinh doanh/sản xuất/hành chính). Nông nghiệp pending data. Bug bậc 1 (min:0→1) đã fix. |
| Tính lương NET/GROSS | `/tinh-luong` | ⬜ Chưa build | — |
| Tính lãi vay | `/tinh-lai-vay` | ⬜ Chưa build | — |
| Chia tiền nhóm | `/chia-tien` | ⬜ Chưa build | — |

---

## Sprint 2 — Mở rộng

| Tool | Slug | Status | Ghi chú |
|------|------|--------|---------|
| Tính trả góp | `/tra-gop` | ⬜ Chưa build | — |
| Tính tiền nước | `/tinh-tien-nuoc` | ⬜ Chưa build | — |
| Tính tiết kiệm | `/tiet-kiem` | ⬜ Chưa build | — |
| Chia bill | `/chia-bill` | ⬜ Chưa build | — |

---

## Sprint 3 — Nâng cao

| Tool | Slug | Status | Ghi chú |
|------|------|--------|---------|
| Lãi thẻ tín dụng | `/lai-the-tin-dung` | ⬜ Chưa build | — |
| Mua được không? | `/mua-duoc-khong` | ⬜ Chưa build | — |
| Chi phí du lịch | `/chi-phi-du-lich` | ⬜ Chưa build | — |
| Quỹ khẩn cấp | `/quy-khan-cap` | ⬜ Chưa build | — |

---

## Infrastructure

| Hạng mục | Status | Ghi chú |
|----------|--------|---------|
| Domain `tools.chilathu.com` | ✅ Live | Cloudflare Pages |
| OG meta tags | ✅ Done | og:image.png trong `public/`, static cho tất cả routes |
| Home page `/` | ✅ Done | Grid 12 tools + bills-app flagship card (UTM) |
| Dynamic OG per tool | ⬜ Backlog | Cần Cloudflare Pages Functions — scope sau |
| Nông nghiệp pricing | ⬜ Pending | Chờ ảnh QĐ 1279 trang nông nghiệp |
| GA4 tracking | ⬜ Chưa setup | Cần thêm gtag vào index.html |

---

## Pending decisions

- **Tính lương**: NET→GROSS hay GROSS→NET hay cả 2? Có tính bảo hiểm xã hội theo vùng không?
- **Chia tiền**: chia đều hay chia theo tỉ lệ? Có export không?
- **Tiết kiệm**: tính lãi kép hay đơn? Có hỗ trợ gửi định kỳ không?

---

## Files quan trọng

```
utility-tools/
├── src/
│   ├── App.jsx              ← routes
│   ├── pages/
│   │   ├── Home/            ← trang chủ / = danh sách 12 tools
│   │   └── TinhTienDien/    ← tool duy nhất đã build
│   ├── data/
│   │   └── electricityRates.js  ← toàn bộ bảng giá EVN QĐ 1279
│   └── components/
│       └── Logo.jsx
├── public/
│   └── og-image.png         ← OG thumbnail (1200×630)
├── index.html               ← OG meta tags
├── ROADMAP.md               ← file này
└── /tinh-tien-dien/spec.md  ← spec v4 (verified data + use case TOU)
```
