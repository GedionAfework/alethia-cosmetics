# Aletheia Cosmo & Gift — Deploy

You need PostgreSQL. With Vercel, use Neon.

## 1. Database

1. Create a Postgres database (Neon, or Vercel → Storage → Neon).
2. Copy the connection string into `DATABASE_URL` and `DIRECT_URL`.

## 2. Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Add the variables from `.env.example`. At minimum set `DATABASE_URL` (Neon’s Vercel integration often does this for you). Prefer Neon’s **direct / non-pooler** URL so `prisma migrate deploy` is reliable.
3. Set `NEXT_PUBLIC_APP_URL` to the Vercel domain, for example `https://your-app.vercel.app`.
4. Set a long random `SESSION_SECRET`.
5. Change `SEED_ADMIN_PASSWORD` and `SEED_EMPLOYEE_PASSWORD`.
6. In Build & Development Settings, set Build Command to `npm run build` (or clear the override).
7. Deploy from the latest commit on `main` (do not Redeploy an old failed deployment).

Then seed once from a machine that has the production `DATABASE_URL`:

```bash
npx prisma db seed
```

Sign in as admin and create roles with the permissions you need, then add each person and assign a role. Put a Telegram username on their user if they will use the Mini App.

## 3. Telegram

1. Create a bot with BotFather.
2. Set the Mini App / Menu Button URL to the **site root only**, e.g. `https://alethia-cosmetics.vercel.app` — never `/api/telegram/webhook`.
3. Set the webhook (this is separate from the Mini App URL):

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-app.vercel.app/api/telegram/webhook"
```

4. Put the owner's Telegram username in `ADMIN_TELEGRAM_USERNAMES`.
5. The owner sends `/start` once so the bot can store their chat and deliver low-stock alerts.
6. Other people need their Telegram username saved on their user, then they send `/start`.

The bot shows the shortcuts that match that person's role. Low-stock and sold-out alerts go to accounts whose role can view alerts and that have opened the bot. The same lists are on the Alerts page.
