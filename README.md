# MindCocoon

A quiet, bilingual (Tiếng Việt / English) place to let it out, breathe, and fall asleep a
little lighter. Local-first and installable; optional 16+ sign-in adds an end-to-end-encrypted
backup.

- Product spec: `docs/superpowers/specs/2026-10-16-mindcocoon-design.md`
- Implementation plan: `docs/superpowers/plans/2026-10-16-mindcocoon-v1.md`
- Before launch: `docs/LAUNCH_CHECKLIST.md` · Supabase: `docs/SUPABASE.md`

## Chạy trên máy (Tiếng Việt)

Yêu cầu: Node.js ≥ 22 (khuyên dùng 24), npm. `ffmpeg` chỉ cần khi muốn tạo lại âm thanh mẫu.

```bash
npm install
cp .env.example .env.local      # điền khóa Supabase nếu muốn bật đăng nhập/sao lưu
npm run dev                     # http://localhost:3000
```

Không có khóa Supabase, app vẫn chạy đầy đủ trên máy và tự ẩn phần tài khoản.

Kiểm thử:

```bash
npm test            # unit + component (Vitest)
npm run test:e2e    # Playwright: Chrome desktop + iPhone (WebKit); tự build và chạy app
npm run typecheck && npm run lint
```

Triển khai lên Vercel:

1. Đẩy repo lên GitHub, import vào Vercel (framework: Next.js).
2. Thêm biến môi trường: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY` (chỉ server), `NEXT_PUBLIC_QUIET_HOURS=23-5`.
   Để trống `NEXT_PUBLIC_ADS_ENABLED` (quảng cáo tắt).
3. Làm theo `docs/SUPABASE.md` (áp migration, bật Email OTP/Google, thêm redirect URL của domain).

Bật/tắt tính năng: sửa biến môi trường trên Vercel rồi **Redeploy** — không cần sửa code.

## Running locally (English)

Requirements: Node.js ≥ 22 (24 recommended) and npm; `ffmpeg` only to regenerate audio.

```bash
npm install
cp .env.example .env.local
npm run dev
```

| Command | Purpose |
|---|---|
| `npm run dev` / `npm run build` / `npm start` | develop / build / serve |
| `npm test`, `npm run test:watch` | unit and component tests |
| `npm run test:e2e` | end-to-end flows (builds the app first) |
| `npm run typecheck`, `npm run lint` | static checks |
| `npm run gen:audio` | regenerate placeholder ambience and music (needs ffmpeg) |

Deploy on Vercel with the env vars above; feature flags (ads, quiet hours) are build-time env
vars — change them and redeploy.
