# GBLRC Admin Dashboard

Standalone admin app for the GBLrcDrone MERN backend. It uses the same category navigation APIs as the storefront.

## Run with the other two apps

1. Backend (`backend`): `npm run dev` on port 5000
2. Storefront (`frontend`): `npm run dev` on port 5173
3. This dashboard: `npm install && npm run dev` on port 5174

Set backend `CORS_ORIGIN=http://localhost:5173,http://localhost:5174`.

## Shared category APIs

- `GET /api/v1/categories/tree`
- `GET /api/v1/categories/nav`
- `GET /api/v1/categories/footer`
- `PUT /api/v1/categories/reorder`
- `PUT /api/v1/categories/bulk`
- `PATCH /api/v1/categories/:id/visibility`

Storefront navigation and footer update as soon as Redis/memory cache is invalidated by these writes.
