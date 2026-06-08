# Push code to GitHub (Sign in with Apple)

Use this when Terminal shows **403** or **Permission denied** for `ys4vnkdnyt-create/sdpoolapp`.

Your Mac project folder:

```text
/Users/benstern/Prototype Exercise
```

GitHub repo (empty, no README):

```text
https://github.com/ys4vnkdnyt-create/sdpoolapp
```

Terminal **cannot** use your Apple ID password. It needs a **Personal Access Token** (`ghp_…`).

---

## What the error means

```text
Permission to ys4vnkdnyt-create/sdpoolapp.git denied to ys4vnkdnyt-create
```

GitHub **knows who you are** (`ys4vnkdnyt-create`) but the saved password/token **cannot write** to the repo. Fix the token — not the username or repo name.

---

## Step 1 — Clear old saved passwords (Mac)

1. Open **Keychain Access** (Spotlight → “Keychain Access”).
2. Search **`github.com`**.
3. Delete **every** “internet password” entry for GitHub.
4. Quit Keychain Access.

This stops macOS from re-sending an old wrong password.

---

## Step 2 — Create a new token (classic — easiest)

1. Sign in at [github.com](https://github.com) (Sign in with Apple is fine).
2. Open **[github.com/settings/tokens](https://github.com/settings/tokens)**.
3. **Generate new token (classic)**.
4. Note: `Mac push sdpoolapp`.
5. Expiration: 90 days (or your choice).
6. Check the **`repo`** box (full control of private repositories).
7. **Generate token** → copy the **`ghp_…`** string immediately.

**Do not** paste the token in chat, email, or git. Store it in a password manager or Notes until push works.

### If you use a fine-grained token instead

- Resource owner: **your account**
- Repository access: **Only select repositories** → choose **sdpoolapp**
- Permissions → **Contents**: **Read and write**
- Permissions → **Metadata**: Read-only (default)

Classic tokens are simpler for first-time push.

---

## Step 3 — Push from Terminal

```bash
cd "/Users/benstern/Prototype Exercise"
git remote set-url origin https://github.com/ys4vnkdnyt-create/sdpoolapp.git
git push -u origin main
```

When prompted:

| Prompt     | Enter                          |
| ---------- | ------------------------------ |
| Username   | `ys4vnkdnyt-create`            |
| Password   | Paste the **`ghp_…` token**    |

Say **Yes** if macOS offers to save to Keychain.

Success looks like:

```text
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

---

## Step 4 — Confirm on GitHub

Open [github.com/ys4vnkdnyt-create/sdpoolapp](https://github.com/ys4vnkdnyt-create/sdpoolapp).

You should see project files and a recent commit (e.g. `Improve results UX and prepare for Render deploy`).

---

## Still 403?

1. Confirm the repo page loads (you created **sdpoolapp**, not an old name).
2. Create a **new** classic token with **`repo`** checked — old tokens may lack scope.
3. Clear Keychain again, then push.
4. One-line push (replace `YOUR_GHP_TOKEN` locally — do not share):

```bash
git push https://ys4vnkdnyt-create:YOUR_GHP_TOKEN@github.com/ys4vnkdnyt-create/sdpoolapp.git main
git branch --set-upstream-to=origin/main main
```

---

## After push — Render (next)

1. [dashboard.render.com](https://dashboard.render.com) → **New +** → **Blueprint** → connect **sdpoolapp** → **Apply**.
2. **Environment** → add `POSTHOG_KEY` (`phc_…`) → redeploy.

See **MOBILE.md** and **notes.md** (“Resume here”) for PostHog details.
