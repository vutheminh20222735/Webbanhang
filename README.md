# Phone Shop - Build & deploy (Netlify + Render)

Frontend (Angular) → **Netlify**. Backend (Express) → **Render**.

## Local

Backend:

```bash
cd backend
npm ci
cp .env.example .env   # điền MONGODB_URI, JWT_SECRET
npm run dev
```

Frontend:

```bash
cd frontend
npm ci
npm start
```

`frontend/src/environments/environment.ts` trỏ `http://localhost:5000/api`.

## Render (API)

1. New Web Service, root directory: `backend`
2. Build: `npm ci` — Start: `npm start`
3. Environment:
   - `NODE_ENV=production`
   - `NODE_VERSION=18`
   - `MONGODB_URI` (Atlas, có tên database, ví dụ `...mongodb.net/phone-shop`)
   - `JWT_SECRET` (chuỗi ngẫu nhiên mạnh)
   - `CLIENT_URL` = URL Netlify, ví dụ `https://your-app.netlify.app`
   - Cloudinary / AI keys nếu dùng
4. Atlas Network Access: cho phép `0.0.0.0/0` (Render IP động)

URL API dạng `https://<service>.onrender.com`.

## Netlify (frontend)

1. Base directory: `frontend` (`netlify.toml` đã cấu hình)
2. Build: `npm ci && npm run build`
3. Publish: `dist/phone-shop-frontend`
4. Environment:
   - `API_URL` = `https://<service>.onrender.com/api`
   - `NODE_VERSION=18`
   - `STRIPE_PUBLIC_KEY` nếu dùng Stripe

Không commit file `.env`. Secret chỉ đặt trên dashboard Netlify/Render.

## Docker (tuỳ chọn)

```bash
docker compose up --build
```
