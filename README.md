# ChilàThu — Utility Tools

Bộ micro-tools tính toán tài chính cho người dùng Việt.
Deploy tại: `tools.chilathu.com`

## Tech stack
- React + Vite
- Cloudflare Pages (static deploy, no backend)
- Không cần login — dùng 1 lần, không lưu dữ liệu

## Branch strategy

| Branch | Mục đích |
|--------|----------|
| `main` | Production → tools.chilathu.com |
| `develop` | Integration — merge các tool trước khi lên main |
| `tool/[slug]` | Feature branch từng tool |

## Tools

### Sprint 1
- `tool/tinh-tien-dien` — Tính tiền điện EVN bậc thang
- `tool/tinh-luong` — Tính lương net/gross
- `tool/tinh-lai-vay` — Tính lãi vay tiêu dùng
- `tool/chia-tien` — Chia tiền nhóm

### Sprint 2
- `tool/tra-gop` — Trả góp 0% có thật không?
- `tool/tinh-tien-nuoc` — Tính tiền nước
- `tool/tiet-kiem` — Tiết kiệm bao lâu mua được X?
- `tool/chia-bill` — Chia bill nhà hàng

### Sprint 3
- `tool/lai-the-tin-dung` — Lãi thẻ tín dụng nếu trả tối thiểu
- `tool/mua-duoc-khong` — Mua được không?
- `tool/chi-phi-du-lich` — Chi phí du lịch/đầu người
- `tool/quy-khan-cap` — Quỹ khẩn cấp cần bao nhiêu?

## Deploy
Mỗi `tool/*` branch có thể preview riêng trên Cloudflare Pages.
Merge vào `develop` để test tích hợp, merge vào `main` để ship.
