# Pet Management System — Frontend (TSI-6)

React 18 + TypeScript SPA built with Vite, against the frozen v1 API contract
(see TSI-4 → "Architecture & Contract — v1", §3).

## Stack

| Concern | Choice |
|---------|--------|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Routing | React Router v6 |
| Server state | TanStack Query v5 |
| HTTP | Axios (error-envelope interceptor) |
| Styling | Tailwind CSS |
| Tests | Vitest + Testing Library |

## Getting started

```bash
cd frontend
npm install
cp .env.example .env        # adjust VITE_API_BASE_URL if needed
npm run dev                 # http://localhost:5173
```

In dev, Vite proxies `/api` → `http://localhost:8000` (the FastAPI backend).
Override the target with `VITE_DEV_API_PROXY`. The app reads its base URL from
`VITE_API_BASE_URL` (defaults to `/api/v1`).

While the backend is being built (TSI-7), develop against the FastAPI Swagger
contract at `/docs` — the typed API layer here matches §3 exactly.

## Scripts

- `npm run dev` — dev server with HMR
- `npm run build` — type-check + production build
- `npm run test` — run Vitest once
- `npm run lint` — ESLint
- `npm run typecheck` — `tsc --noEmit`

## Structure

```
src/
├── api/        Axios client + typed endpoint calls (owners, pets, CSV export)
├── types/      Contract types: error envelope, pagination, Owner, Pet
├── hooks/      TanStack Query hooks + URL-backed list params
├── lib/        Validation (mirrors server rules), formatting, CSV download
├── components/ ui/ (Button, Field, Badge, Spinner), data/ (Table, Pagination,
│               Search, state blocks), feedback/ (toasts, confirm dialog), Layout
└── pages/      pets/ and owners/ — List, Form (create/edit), Detail
```

## Contract notes

- **Error envelope (§3.2)** is normalised to a single `ApiError` by the Axios
  interceptor; 422 `details` are mapped to field-level form errors.
- **Pagination (§3.3)** drives the list pager; `keepPreviousData` keeps paging smooth.
- **Validation (NFR-1)** is client-side UX only — the server is the source of truth.
- **CSV export (NFR-5)** reuses the active list filters/search on both entities.
- **Owner delete guard (FR-7)** — the UI disables delete when `pet_count > 0` and
  surfaces the server's 409 as a clear message if it still occurs.
```
