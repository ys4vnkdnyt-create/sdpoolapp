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

### PostHog (analytics + surveys)

The app sends anonymous usage events and can show PostHog **Surveys** (feedback). Keys are **not** in git — the server injects them at runtime.

**Environment variables (Render → your service → Environment):**

| Variable | Required | Purpose |
| -------- | -------- | ------- |
| `POSTHOG_KEY` | Yes (for production analytics) | Project API key from PostHog (`phc_…`) |
| `POSTHOG_HOST` | No | API host (default `https://us.i.posthog.com`; EU use `https://eu.i.posthog.com`) |
| `POSTHOG_FEEDBACK_SURVEY_ID` | No | Survey id for the in-app **Feedback** button |

Leave `POSTHOG_KEY` empty on your Mac for local dev — analytics stays off.

**Dashboard setup (one-time):**

1. Sign up at [posthog.com](https://posthog.com) and create a project.
2. **Project settings** → copy the **Project API key** (`phc_…`) into Render as `POSTHOG_KEY`. Redeploy.
3. **Surveys** → **New survey** (e.g. “App feedback”, popover or widget).
4. **Targeting** — show on your Render URL (or “All users”) so the SDK can display it automatically after init.
5. Optional: copy the survey **ID** into `POSTHOG_FEEDBACK_SURVEY_ID` so the **Feedback** link opens that survey on tap.
6. In PostHog, confirm events: `app_loaded`, `screen_view`, `search_submitted`, `favorite_toggled`, `feedback_link_clicked`.

Surveys are handled by `posthog-js` once initialized; no extra code beyond the Feedback button.

### Location (GPS) on your phone

Browsers treat **https** and **localhost** as secure. A home Wi‑Fi link like `http://192.168.50.156:3000` is **not** secure, so **iPhone Safari will not use GPS** there — search still works, sorted from downtown San Diego.

**To get real “sort by distance from you” on a phone:**

1. **Tunnel (quick):** `npx cloudflared tunnel --url http://localhost:3000` → open the `https://…trycloudflare.com` URL on your phone.
2. **Render deploy:** public `https://….onrender.com` URL (Option 4 above).

The app shows a short hint when GPS isn’t available and always falls back to San Diego center.

---

**Troubleshooting**


| Problem                          | Fix                                                             |
| -------------------------------- | --------------------------------------------------------------- |
| Phone cannot load `http://192.…` | Same Wi‑Fi? Mac firewall blocking Node? Try tunnel (Option 3).  |
| Page loads but buttons dead      | Restart server: `npm run web` after `npm run build` (needs fresh JS). |
| Location never works on phone    | `http://192.…` blocks GPS — use https tunnel or Render (see above). |
| Page loads but search fails      | Phone must reach your Mac; tunnel/deploy must stay running.     |
| Inputs zoom on focus (iOS)       | Should not happen — inputs use 16px font. Reload after updates. |


