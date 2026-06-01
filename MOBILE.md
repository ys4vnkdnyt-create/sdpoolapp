# Use on your phone in 2 minutes

The web UI is built **mobile-first**. After `npm run build`, start the server with:

```bash
npm run web
```

The terminal prints URLs for this Mac and for your phone on the same Wi‑Fi.

## Option 1 — Same Wi‑Fi (fastest)

1. Mac and phone on the **same Wi‑Fi**.
2. Run `npm run web` on the Mac.
3. On the phone, open the URL shown under **“On your phone (same Wi‑Fi)”** (e.g. `http://192.168.1.42:3000`).

The server listens on `0.0.0.0` by default so it is reachable from other devices. To bind only to localhost (Mac browser only):

```bash
HOST=127.0.0.1 npm run web
```

## Option 2 — Add to Home Screen

1. Open the app in **Safari** (iPhone) or **Chrome** (Android) using Option 1 or 3.
2. **iPhone:** Share → **Add to Home Screen**.
3. **Android:** Menu (⋮) → **Install app** or **Add to Home screen**.

`manifest.webmanifest` and the mobile meta tags give a full-screen, app-like feel.

## Option 3 — Public URL (tunnel)

When you are not on the same Wi‑Fi, expose your local server with a tunnel.

**Cloudflare (free, no account for quick try):**

```bash
npm run web
# In another terminal:
npx --yes cloudflared tunnel --url http://localhost:3000
```

Use the `https://….trycloudflare.com` URL on your phone.

**ngrok** (account required for stable URLs):

```bash
ngrok http 3000
```

## Option 4 — Deploy (URL works anywhere)

Deploy to [Render](https://render.com) (free tier) using the repo’s `render.yaml`:

1. Push this repo to GitHub.
2. Render → **New** → **Blueprint** → connect the repo.
3. After deploy, open the `*.onrender.com` URL on your phone.

Locally, production-style run:

```bash
npm run build
PORT=3000 npm run start:web
```

On Render, `PORT` is set automatically; `start:web` runs `dist/server.js`.

---

**Troubleshooting**


| Problem                          | Fix                                                             |
| -------------------------------- | --------------------------------------------------------------- |
| Phone cannot load `http://192.…` | Same Wi‑Fi? Mac firewall blocking Node? Try tunnel (Option 3).  |
| Page loads but search fails      | Phone must reach your Mac; tunnel/deploy must stay running.     |
| Inputs zoom on focus (iOS)       | Should not happen — inputs use 16px font. Reload after updates. |


