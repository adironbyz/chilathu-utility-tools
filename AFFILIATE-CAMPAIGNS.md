# Affiliate Campaigns — Application Tracker

> Log tiến độ apply Accesstrade campaigns. Cập nhật khi apply xong / được duyệt / có URL.
> Source: `tools-chilathu-affiliate-plan.md` section 2.

---

## Tier 1 — apply NGAY (6 campaigns)

Đây là backbone revenue tháng đầu. Tất cả convert nhanh (24-72h) cho GenZ audience.

| Brand | Loại | Commission kỳ vọng | Cookie | Apply | Duyệt | URL ready |
|-------|------|------|------|-------|-------|-----------|
| Cake by VPBank | Mở tài khoản số | 100-200k | 30 ngày | ⬜ | ⬜ | ⬜ |
| TNEX | Mở tài khoản số | 80-150k | 30 ngày | ⬜ | ⬜ | ⬜ |
| Timo Plus | Mở tài khoản | 100-200k | 30 ngày | ⬜ | ⬜ | ⬜ |
| Finhay | App đầu tư | 50-150k | 30 ngày | ⬜ | ⬜ | ⬜ |
| Tikop | App đầu tư | 50-120k | 30 ngày | ⬜ | ⬜ | ⬜ |
| Infina | App đầu tư | 50-150k | 30 ngày | ⬜ | ⬜ | ⬜ |

**Ghi chú khi apply:**
- Site giới thiệu: `tienich.chilathu.com`
- Audience: người trẻ VN, quan tâm quản lý tài chính cá nhân
- Traffic source: SEO + paid ads (đang chạy Google/FB)
- Placement dự kiến: sau kết quả tool tính toán (non-intrusive, contextual)

---

## Tier 2 — apply SAU 2-4 tuần (khi có traffic proof)

Campaigns này duyệt khó, advertiser audit kỹ site. Cần 2-4 tuần GA4 data.

| Brand | Loại | Commission | Ghi chú |
|-------|------|------|---------|
| TPBank | Thẻ tín dụng | 200-500k | Manual review |
| Shinhan Bank | Thẻ tín dụng | 200-400k | Manual review |
| VPBank NEO | Thẻ tín dụng | 200-500k | Chưa có trong registry — thêm nếu duyệt |
| FE Credit | Vay tiêu dùng | 300-800k | Audit site kỹ, reversal cao |
| Home Credit | Vay tiêu dùng | 300-700k | |
| F88 | Vay cầm cố | 200-600k | Chưa có trong registry |

---

## Info cần copy về từ mỗi campaign (sau khi duyệt)

Mỗi brand được duyệt → mở campaign detail → copy 3 thứ gửi mình update `BRANDS` registry:

1. **Tracking URL** (hoặc "deeplink" / "link affiliate")
   - Format Accesstrade thường: `https://clickv2.accesstrade.vn/deep_link/...`
   - KIỂM TRA: có param nào nhận `SubID` (hoặc `sub_id` / `subid` / `aff_sub`) không?
2. **Commission rate chính thức** (nhiều khi khác với số kỳ vọng)
3. **Cookie window thực tế** (đôi khi 24h không phải 30 ngày như mô tả)
4. **Disclosure / terms**: có yêu cầu copy disclosure đặc biệt không?
5. **Pricing / metric cập nhật**: lãi suất, ưu đãi hiện tại để update field `metric` trong BRANDS

Gửi mình theo format:
```
Brand: Cake
URL: https://clickv2.accesstrade.vn/deep_link/...?...&sub_id=
Commission: 150k/mở TK thành công
Cookie: 30d
Metric: "Lãi suất tiết kiệm 5.8%/năm, miễn phí chuyển khoản"
```

---

## Sau khi tất cả Tier 1 URL ready

1. Mình update `src/data/affiliates.js` → thay URL placeholder bằng tracking URL thật
2. Mình plug `<AffiliateBlock>` vào tool pilot (TinhLuong — audience chất, reversal thấp theo plan)
3. Deploy → chạy pilot 1-2 tuần → thu GA4 data
4. Dùng data làm proof để apply Tier 2

---

## Parallel tasks — làm song song trong lúc chờ duyệt

Accesstrade thường duyệt 1-3 ngày. Trong lúc chờ, có thể làm sẵn:

- [x] ~~**Setup GA4 property**~~ — đã done (`G-5BMHEBYFVQ` trong `index.html`, property riêng cho tienich tách khỏi app). Events: `affiliate_clicked`, `tool_card_click`, `app_crosslink_click`.
- [ ] **Review disclosure copy** với Rog — mặc định đã có trong `AffiliateDisclosure` component. Accesstrade đôi khi yêu cầu wording cụ thể.
- [ ] **Plug `<AffiliateBlock>` vào pilot tool** (TinhLuong) — dùng URL placeholder hiện tại. Click sẽ fire `affiliate_clicked` về GA4 → bắt đầu thu CTR data ngay kể cả trước khi campaign duyệt.
- [ ] **Decide pilot tool**: plan đề xuất TinhLuong. Có thể đổi nếu GA4 data cho thấy traffic tập trung vào tool khác.
