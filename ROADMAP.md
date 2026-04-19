# ChilàThu Tools — Roadmap
> Domain: `tools.chilathu.com` · Tech: React + Vite · Deploy: Cloudflare Pages
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
- **Footer**: 1 dòng text link "Theo dõi thu chi với Chilathu.com" + `LinkSquare01Icon` — KHÔNG đóng khung card
- Không có affiliate card

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
| Domain `tools.chilathu.com` | ✅ Live | Cloudflare Pages |
| OG meta tags | ✅ Done | og:image.png trong `public/`, static cho tất cả routes |
| Home page `/` | ✅ Done | Grid 8 tools + bills-app flagship card (UTM) |
| Dynamic OG per tool | ⬜ Backlog | Cần Cloudflare Pages Functions — scope sau |
| Nông nghiệp pricing | ⬜ Pending | Chờ ảnh QĐ 1279 trang nông nghiệp |
| GA4 tracking | ⬜ Chưa setup | Cần thêm gtag vào index.html |

---

## Pending decisions

- **Chia tiền**: mode "chia đều" vs mode "từng món" — 1 tool, 2 tab?
- **Tính lãi vay**: lãi đơn / lãi kép / dư nợ giảm dần — cần cả 3 hay chọn 1?

---

## Files quan trọng

```
utility-tools/
├── src/
│   ├── App.jsx              ← routes
│   ├── pages/
│   │   ├── Home/            ← trang chủ / = danh sách 8 tools
│   │   ├── TinhTienDien/    ← ✅ Live
│   │   ├── TinhTienNuoc/    ← ✅ Live
│   │   ├── TinhLuong/       ← ✅ Live
│   │   └── LaiTheTinDung/   ← ✅ Live
│   ├── data/
│   │   └── electricityRates.js  ← toàn bộ bảng giá EVN QĐ 1279
│   └── components/
│       └── Logo.jsx
├── public/
│   └── og-image.png         ← OG thumbnail (1200×630)
├── index.html               ← OG meta tags
└── ROADMAP.md               ← file này
```
