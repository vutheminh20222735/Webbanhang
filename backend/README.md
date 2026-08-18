# Phone Shop Backend

Minimal Express + Mongoose backend scaffold for the Phone Shop project.

Commands:

```bash
npm install
npm run dev
npm run seed
```

See `.env.example` for environment variables.

Seed notes:

- Ensure `MONGODB_URI` is set in your `.env` before running `npm run seed`.
- Default demo credentials created by seed:
	- admin@demo.com / Password123 (ADMIN)
	- manager@demo.com / Password123 (MANAGER)
	- staff@demo.com / Password123 (STAFF)
	- customer1@demo.com ... customer5@demo.com / Password123

Run server:

```bash
npm run dev
```

API endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (requires Authorization header)
- `POST /api/ai/chat` (requires Authorization header)
- `GET /api/admin/users` (ADMIN/MANAGER)

