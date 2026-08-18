Phone Shop Frontend

Quick start:

```bash
cd frontend
npm install
npx ng serve
```

Environment:
- Update `src/environments/environment.ts` to point `apiUrl` to backend (e.g. http://localhost:5000/api)

Project structure (partial):
- src/app/core: guards, interceptors, services, models
- src/app/layouts: customer & admin layouts
- src/app/features: lazy-loaded features (auth, products, cart, orders, admin)
