# Panduan Deploy ke Vercel

## Arsitektur

- **Frontend** (`artifacts/web`) → Static site di Vercel
- **Backend** (`artifacts/api-server`) → Serverless function di Vercel (`/api/*`)
- **Database** → Cloud PostgreSQL (Neon/Supabase)

---

## Langkah 1: Siapkan Database Cloud

Gunakan **Neon** (gratis): https://neon.tech

1. Buat akun → New Project → pilih region terdekat
2. Copy **Connection string** (format: `postgresql://...`)
3. Gunakan string pooled (`?pgbouncer=true`) untuk performa optimal di serverless

---

## Langkah 2: Push Skema Database

Setelah dapat `DATABASE_URL` dari Neon, set sebagai env var lalu jalankan:

```bash
DATABASE_URL="postgresql://..." pnpm --filter @workspace/db run push
```

---

## Langkah 3: Deploy ke Vercel

### 3a. Push kode ke GitHub
```bash
git add .
git commit -m "setup vercel deployment"
git push
```

### 3b. Import di Vercel
1. Buka https://vercel.com → New Project
2. Import repo GitHub kamu
3. **Jangan ubah** build settings — `vercel.json` sudah mengaturnya otomatis

### 3c. Set Environment Variables di Vercel Dashboard

Buka **Settings → Environment Variables** dan tambahkan semua nilai berikut:

| Variable | Nilai |
|---|---|
| `DATABASE_URL` | Connection string dari Neon |
| `MIDTRANS_SERVER_KEY` | Server key Midtrans |
| `MIDTRANS_CLIENT_KEY` | Client key Midtrans |
| `VITE_MIDTRANS_CLIENT_KEY` | Client key Midtrans (sama) |
| `VITE_MIDTRANS_SNAP_URL` | `https://app.midtrans.com/snap/snap.js` (production) |
| `DIGIFLAZZ_USERNAME` | Username Digiflazz |
| `DIGIFLAZZ_API_KEY` | API key Digiflazz |
| `ADMIN_TOKEN` | Token admin untuk sync produk |
| `PRICE_MARKUP_PERCENT` | `5` (markup harga, opsional) |
| `SESSION_SECRET` | String acak panjang untuk keamanan |

> ⚠️ **Penting**: Set semua env vars untuk environment **Production**, **Preview**, dan **Development**

### 3d. Deploy
Klik **Deploy** — Vercel akan build dan deploy otomatis.

---

## Langkah 4: Sinkronisasi Produk di Production

Setelah deploy berhasil, sync produk dari Digiflazz:

```bash
curl -X POST https://domain-kamu.vercel.app/api/admin/sync-digiflazz \
  -H "Authorization: Bearer TOKEN_ADMIN_KAMU"
```

---

## Cara Kerja Routing

```
https://domain.vercel.app/          → Frontend React (static)
https://domain.vercel.app/topup/*   → Frontend React (static)
https://domain.vercel.app/api/*     → Express.js Serverless Function
```

---

## Troubleshooting

**Build gagal karena `BASE_PATH` tidak ada?**
→ `vercel.json` sudah menyertakan `BASE_PATH=/` di build command. Pastikan `vercel.json` ter-commit.

**Error koneksi database?**
→ Pastikan `DATABASE_URL` sudah diset di Vercel. Gunakan connection pooling dari Neon.

**Produk tidak muncul?**
→ Jalankan `/api/admin/sync-digiflazz` setelah deploy.

**Pino logger error di Vercel?**
→ Logger otomatis menggunakan mode production (tanpa worker threads) saat `NODE_ENV=production`.
