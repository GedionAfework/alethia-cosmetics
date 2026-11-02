# Aletheia Cosmo & Gift

Inventory and sales for the cosmetics and gift shop. The same app is the website and the Telegram Mini App.

Access is by role. Create a role, select its permissions, then create a user and assign that role. The seeded Admin role can do everything. The seeded Employee role can take sales and see their own receipts.

## Local

```bash
docker compose up -d
cp .env.example .env
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

`docker compose` publishes Postgres on port **5433**. If Postgres is already running on port 5432, create a database named `alethia_cosmetics` there instead and point `.env` at it. That keeps this shop separate from Alethia Honey.

Open http://localhost:3001

Seeded logins (change them in `.env` before real use):

- Admin: `admin` / `change-me-admin`
- Employee: `cashier` / `change-me-staff`

In development, the login page also has one-click buttons for those two accounts.

The shop day is Africa/Addis_Ababa. Prices are in ETB.

## What you can do

- Roles are created first. Each role is a set of permissions, and each user is assigned one role.
- Inventory is alphabetical, with received, sold, corrections, and on-hand quantity.
- Categories are Cosmetics, Perfumes, and Gifts. Search covers name, SKU, and barcode.
- Out-of-stock and low-stock lists. Low stock is at or below the item's reorder level (default 5) while something is still left.
- Daily sales show the employee, items, quantities, and the day's revenue. Export Excel or PDF.
- Monthly totals include a bar chart and the same exports.
- Checkout accepts a USB barcode scanner (it types into search) and a phone camera where the browser supports it.
- A receipt can be printed after each sale.

See `SETUP.md` for Vercel, Neon, and the Telegram bot.
