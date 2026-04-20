# ChilàThu — Utility Tools

Bộ micro-tools tính toán tài chính cho người dùng Việt.
Deploy tại: `tienich.chilathu.com`

## Tech stack
- React + Vite
- Cloudflare Pages (static deploy, no backend)
- Không cần login — dùng 1 lần, không lưu dữ liệu

## Branch strategy

| Branch | Mục đích |
|--------|----------|
| `main` | Production → tienich.chilathu.com |
| `develop` | Integration — merge các tool trước khi lên main |
| `tool/[slug]` | Feature branch từng tool |

## Tools live (8)

| Slug | Tên |
|------|-----|
| `/tinh-tien-dien` | Tính tiền điện EVN bậc thang |
| `/tinh-tien-nuoc` | Tính tiền nước bậc thang (63 tỉnh) |
| `/tinh-luong` | Tính lương Net/Gross |
| `/tinh-lai-vay` | Tính lãi vay (4 mode: vay nhanh / mua nhà / mua xe / tiêu dùng) |
| `/tra-gop` | Tính trả góp (0% / 0% có phí / có lãi) |
| `/lai-the-tin-dung` | Lãi thẻ tín dụng quá hạn |
| `/chia-tien` | Chia tiền nhóm (đều / theo món) |
| `/chi-phi-du-lich` | Chi phí du lịch (7 hạng mục, đổi ngoại tệ) |

### Dropped
Từng có trong plan cũ, không làm nữa: `tiet-kiem`, `mua-duoc-khong`, `quy-khan-cap`, `chia-bill`.

## Deploy
Mỗi `tool/*` branch có thể preview riêng trên Cloudflare Pages.
Merge vào `develop` để test tích hợp, merge vào `main` để ship.
