# GBLrcDrone Backend

Express + TypeScript + MongoDB backend for GBLrcDrone.

## Requirements

- Node.js 20+
- MongoDB running and reachable by `MONGODB_URI` in `.env`
- Redis optional (`REDIS_URL`). Navigation falls back to in-memory cache if Redis is down.

## Category navigation

Public storefront and the admin dashboard share the same category APIs:

- `GET /api/v1/categories/tree` and `GET /api/categories/tree`
- `GET /api/v1/categories/nav` and `GET /api/categories/nav`
- `GET /api/v1/categories/footer` and `GET /api/categories/footer`
- `PUT /api/v1/categories/reorder` (admin)

## Setup

1. Install dependencies:
   - `npm install`
2. Seed initial development data:
   - `npm run seed`
3. Start dev server:
   - `npm run dev`

Server runs on `http://localhost:5000` by default.

## Useful commands

- `npm run build` - compile TypeScript
- `npm run start` - run compiled build
- `npm run verify` - check health endpoint
