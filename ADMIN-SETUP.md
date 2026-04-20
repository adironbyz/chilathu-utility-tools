# Admin Panel — Setup Guide

> Hướng dẫn deploy `/admin` page để quản lý affiliate config không qua code.
> Một lần setup, vĩnh viễn chỉnh qua UI.

---

## Tổng quan

Admin panel cho phép bật/tắt brand, đổi URL affiliate, đổi featured/comparison
mapping — **không cần deploy lại code**. Mỗi thay đổi ghi vào Cloudflare KV
(edge cache 60s), frontend tự fetch config mới mỗi lần page load.

```
┌─────────────────────────┐        ┌──────────────────────────┐
│  tienich.chilathu.com/    │ ─POST─▶│  Cloudflare Pages Fn     │
│  admin (editor UI)      │        │  /api/affiliates (auth)  │
└─────────────────────────┘        └────────────┬─────────────┘
                                                │ write
                                                ▼
┌─────────────────────────┐        ┌──────────────────────────┐
│  tienich.chilathu.com/    │ ◀─GET──│  Cloudflare KV           │
│  tinh-lai-vay (reader)  │        │  AFFILIATES_KV:config    │
└─────────────────────────┘        └──────────────────────────┘
```

---

## Bước 1 — Tạo KV namespace

Trên Cloudflare dashboard:

1. Vào **Workers & Pages → KV** (sidebar trái).
2. Bấm **Create a namespace**.
3. Tên: `AFFILIATES` (hoặc gì cũng được, mình sẽ bind tên lại ở bước 2).
4. Bấm **Add**.

Lưu lại **Namespace ID** — không cần copy, mình dùng UI binding thôi.

---

## Bước 2 — Bind KV vào Pages project

1. Vào **Workers & Pages → tools-chilathu** (Pages project của mình).
2. Tab **Settings → Functions → KV namespace bindings**.
3. Bấm **Add binding**:
   - **Variable name**: `AFFILIATES_KV`  ← phải đúng tên này (code ref)
   - **KV namespace**: chọn namespace vừa tạo (`AFFILIATES`)
4. **Save**.

> ⚠️ Binding variable name **phải là `AFFILIATES_KV`** (có underscore, uppercase).
> Code đọc qua `env.AFFILIATES_KV.get('config')`.

---

## Bước 3 — Thêm env vars (mật khẩu + session secret)

Cùng trang **Settings → Environment variables → Production**:

1. Bấm **Add variable**:
   - **Variable name**: `ADMIN_PASSWORD`
   - **Value**: mật khẩu admin (nên dài ≥12 ký tự, mix chữ+số+ký tự đặc biệt)
   - **Encrypt**: ✅ bật
2. Bấm **Add variable** lần nữa:
   - **Variable name**: `SESSION_SECRET`
   - **Value**: random string ≥32 ký tự (dùng để sign session cookie HMAC)
   - **Encrypt**: ✅ bật

**Tạo SESSION_SECRET an toàn** (chạy trên máy):
```bash
openssl rand -hex 32
# → ví dụ: 7a8b3c9f2d1e4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b
```

> ⚠️ `SESSION_SECRET` nếu rò rỉ → attacker tự ký được cookie. Đổi ngay khi nghi ngờ.

3. **Save**. Cloudflare sẽ prompt re-deploy — bấm **Save and deploy**.

---

## Bước 4 — Re-deploy (nếu chưa tự trigger)

Admin UI + Pages Functions đã nằm trong repo `utility-tools/`:

```
utility-tools/
├── src/pages/Admin/          # /admin page
├── functions/
│   ├── _lib/auth.js          # HMAC session helpers
│   ├── api/
│   │   ├── affiliates.js     # GET/POST config
│   │   └── admin/
│   │       ├── login.js      # POST login
│   │       ├── logout.js     # POST logout
│   │       └── session.js    # GET session check
```

Push lên main branch (hoặc branch Cloudflare Pages đang watch) → auto deploy.

```bash
cd utility-tools
git add .
git commit -m "feat: admin panel for affiliate config"
git push
```

---

## Bước 5 — Truy cập admin lần đầu

1. Mở `https://tienich.chilathu.com/admin`.
2. Nhập mật khẩu (value của `ADMIN_PASSWORD` ở bước 3).
3. Editor hiện ra — KV chưa có entry → editor seed từ defaults bundled trong code.
4. Bấm **Lưu config** → ghi vào KV.

**Check KV đã có entry:**
- Cloudflare dashboard → **Workers & Pages → KV → AFFILIATES → View**
- Phải thấy key `config` với JSON body.

---

## Workflow thường ngày

### Bật brand mới (khi Accesstrade duyệt campaign)

1. Mở `/admin` → tab **Brands**.
2. Tìm brand pending (toggle Off) hoặc **Thêm brand** mới.
3. Điền:
   - **Name**: tên hiển thị (VD: "MB Bank Loan")
   - **Initial**: 1-2 chữ cho logo fallback (VD: "MB")
   - **Color**: brand color (hex)
   - **Tagline**: mô tả ngắn (VD: "Vay tín chấp online, duyệt 10 phút")
   - **Metric**: dòng số liệu (VD: "Lãi từ 5.6%/năm")
   - **URL**: affiliate deeplink từ Accesstrade
   - **Referral code**: nếu app-based (để trống nếu redirect trực tiếp)
4. Bấm toggle **Off → Live**.
5. Bấm **Lưu config**.
6. Chờ tối đa 60s (edge cache) → brand xuất hiện ở featured/comparison.

### Tắt brand (campaign paused, không muốn track)

1. Tab **Brands** → brand đó → toggle **Live → Off**.
2. **Lưu config**.
3. Brand ẩn khỏi mọi tool ngay lập tức (sau 60s cache).

> Không cần xoá brand — giữ toggle Off để dữ dùng lại sau.

### Đổi featured brand cho tool (VD: /tinh-lai-vay swap từ VIB sang MB)

1. Tab **Tool mappings** → tìm row `/tinh-lai-vay`.
2. Dropdown **Featured brand** → chọn brand mới.
3. **Lưu config**.

### Đổi bảng so sánh (comparison)

Tab **Tool mappings** → row tool → chip group **Comparison brands** → click để
toggle. Cần ≥2 brand approved mới render bảng (1 brand sẽ không show).

### Đổi URL affiliate (VD: campaign cho URL mới)

1. Tab **Brands** → brand đó → field **Affiliate URL** → paste URL mới.
2. **Lưu config**.
3. Click-tracking tiếp tục bình thường, SubID không thay đổi.

---

## Security notes

- Cookie auth: `HttpOnly; Secure; SameSite=Strict; Max-Age=86400` — JS không
  đọc được, chỉ server verify.
- Session token: HMAC-SHA256 ký payload `{iat, exp}`. Stateless, không lưu KV.
- Login có delay 50ms chống timing-probe, password compare dùng constant-time.
- Không có rate limit layer riêng — Cloudflare Pages DDoS protection mặc định.
  Nếu cần chặt hơn: add Cloudflare WAF rule limit `/api/admin/login` → 10/min/IP.

**Đổi mật khẩu:**
1. Dashboard → Settings → Env vars → sửa `ADMIN_PASSWORD`.
2. Re-deploy. Cookie cũ vẫn valid đến hết 24h (không invalidate được không đổi
   `SESSION_SECRET` — nếu cần force logout tất cả session, đổi luôn
   `SESSION_SECRET`).

---

## Troubleshooting

### "SESSION_SECRET chưa setup" ở `/admin`

→ Chưa add env var ở bước 3, hoặc chưa re-deploy sau khi add.

### "KV binding chưa setup"

→ Chưa bind KV ở bước 2, hoặc tên binding sai (phải là `AFFILIATES_KV`).

### Save config thành công nhưng frontend không thấy

→ Edge cache 60s. Chờ 1 phút rồi hard refresh (Cmd+Shift+R). Nếu vẫn không thấy:
- DevTools → Network → check response `/api/affiliates` có đúng JSON mới không.
- Nếu đúng → do `loadAffiliateConfig()` đã cache ở memory — refresh page full.

### Login sai password liên tục

→ Value env var có whitespace đầu/cuối? Cloudflare UI đôi khi paste lẫn newline.
Xoá và gõ lại tay.

### Muốn xóa toàn bộ config về defaults

Option 1: Admin UI → bấm **Reset defaults** → **Lưu config**.
Option 2: Dashboard → KV → AFFILIATES → delete key `config`. Frontend sẽ
fallback sang defaults bundled.

---

## Development (local testing)

Pages Functions chạy được local với `wrangler`:

```bash
cd utility-tools
npm run build
npx wrangler pages dev dist --kv AFFILIATES_KV
```

Env vars local: tạo file `.dev.vars` (đã gitignore):
```
ADMIN_PASSWORD=test1234
SESSION_SECRET=local-dev-secret-key-min-32-chars-xxxxx
```

Mở `http://localhost:8788/admin` → test login + edit.

> ⚠️ Không commit `.dev.vars`. Đã có trong `.gitignore`.

---

## Files liên quan

| File | Mục đích |
|------|----------|
| `src/pages/Admin/Admin.jsx` | UI editor |
| `src/pages/Admin/Admin.css` | Styling (notebook DS tokens) |
| `src/data/affiliates.js` | Config schema + loader + defaults |
| `functions/_lib/auth.js` | HMAC session helpers |
| `functions/api/affiliates.js` | GET/POST config endpoint |
| `functions/api/admin/login.js` | POST login |
| `functions/api/admin/logout.js` | POST logout |
| `functions/api/admin/session.js` | GET session check |

---

**Last updated:** 2026-04-20
