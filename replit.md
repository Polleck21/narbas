# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Project: TopUp Zone

Game top-up store with Digiflazz (product/top-up) and Midtrans (payment) integrations.

- **Frontend**: `artifacts/web` (React + Vite)
- **Backend**: `artifacts/api-server` (Express 5)
- **DB Schema**: `lib/db/src/schema/` (products, denominations, orders)

### Admin Commands

```bash
# Sync produk dari Digiflazz
curl -X POST http://localhost/api/admin/sync-digiflazz \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Vercel Deployment

- `vercel.json` — konfigurasi Vercel (frontend + serverless API)
- `api/index.ts` — entry point serverless function
- `.env.example` — template env vars
- `VERCEL_DEPLOY.md` — panduan lengkap deploy ke Vercel

Untuk production: gunakan Neon (https://neon.tech) sebagai cloud PostgreSQL.
