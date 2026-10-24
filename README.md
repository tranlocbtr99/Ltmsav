# LTMsav

Ứng dụng quản lý thu chi cá nhân React / PWA / Capacitor Android.

- Bắt đầu bảo trì: [AGENTS.md](AGENTS.md), [MAINTENANCE.md](MAINTENANCE.md)
- Bản đồ code: [APP_MAP.md](đọc%20trước%20khi%20làm/APP_MAP.md)
- Phát hành và tăng version tự động: [RELEASE.md](RELEASE.md)
- Bảo toàn dữ liệu: [DATA_SAFETY_RULES.md](DATA_SAFETY_RULES.md)

```sh
npm ci
npm run dev
npm run check
```

Production server: `NODE_ENV=production npm start`. Optional AI: set GEMINI_API_KEY in the server environment, never commit it. User data stays on the device; JSON backup is the recovery format. CSV export is for analysis, not full restore.
