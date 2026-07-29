# Mini ERP + CRM Operations Portal

A small internal ERP/CRM system for a wholesale/distribution company: customers, products/inventory,
and a sales challan flow with stock-deduction business logic, built for the Full Stack Developer case study.

- **Backend:** Node.js, TypeScript, Express, Prisma ORM, PostgreSQL, JWT auth, Zod validation
- **Frontend:** React, TypeScript, Vite, React Router, Axios
- **DevOps:** Docker Compose (backend + frontend + Postgres), environment-variable based config

---

## 1. Project structure

```
erp-crm/
├── backend/                 # Express + TypeScript API
│   ├── prisma/schema.prisma # DB schema (Users, Customers, Products, Challans, ...)
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic (challan stock deduction, etc.)
│   │   ├── routes/          # Express routers
│   │   ├── middleware/      # auth, validation, error handling
│   │   ├── schemas/         # Zod validation schemas
│   │   ├── utils/           # JWT, challan numbering, error classes
│   │   ├── seed.ts          # Seeds test users + sample data
│   │   ├── app.ts / index.ts
│   ├── Dockerfile
│   └── .env.example
├── frontend/                # React + Vite admin UI
│   ├── src/
│   │   ├── pages/           # Login, Customers, Products, Challans
│   │   ├── context/         # Auth context (JWT storage, current user)
│   │   ├── api/client.ts    # Axios instance with auth interceptor
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .env.example
├── docker-compose.yml        # Postgres + backend + frontend, one command
├── postman_collection.json   # All API endpoints, ready to import
└── README.md                 # This file
```

---

## 2. How the server was set up

The backend is a standard Express app with a layered structure:

- **Routes** (`src/routes`) declare the URL + method + which middleware runs (`requireAuth`,
  `requireRole`, `validate(schema)`), then call a controller.
- **Controllers** (`src/controllers`) parse the request and call Prisma directly for simple
  CRUD, or call a **service** for anything with real business logic.
- **Services** (`src/services/challan.service.ts`) contain the sales-challan business rules:
  creating a challan (draft or confirmed), confirming a draft, and cancelling a challan — all
  wrapped in Prisma `$transaction` blocks so stock updates and challan status changes are atomic.
- **Middleware** handles JWT verification, role checks, Zod validation, and centralized error
  formatting (`src/middleware/errorHandler.ts`), so every error — validation, "not found",
  insufficient stock, duplicate SKU, etc. — comes back as consistent JSON with the right HTTP
  status code.
- **Prisma** is the single source of truth for the DB schema (`prisma/schema.prisma`) and
  generates a typed client, so query results are type-checked against the schema.

---

## 3. How environment variables are managed

Both apps read config from `.env` files that are **never committed** (see `.gitignore`); each
folder ships an `.env.example` documenting every variable.

**backend/.env**
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/erp_crm"
JWT_SECRET="change-this-to-a-long-random-string"
JWT_EXPIRES_IN="8h"
PORT=4000
CORS_ORIGIN="http://localhost:5173"
```

**frontend/.env**
```
VITE_API_URL=http://localhost:4000
```

When deploying, set the same keys as environment variables in your hosting provider's dashboard
(Render/Railway/Fly.io for the backend, Vercel/Netlify for the frontend) instead of committing a
`.env` file.

---

## 4. How to run the project locally

### Prerequisites
- Node.js 18+ and npm
- A PostgreSQL database (local install, Docker, or a free hosted instance like Neon/Supabase)

### Option A — plain npm (no Docker)

```bash
# 1. Backend
cd backend
cp .env.example .env          # then edit DATABASE_URL if needed
npm install
npx prisma migrate dev --name init   # creates tables
npm run seed                         # creates test users + sample products/customer
npm run dev                          # http://localhost:4000

# 2. Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                          # http://localhost:5173
```

### Option B — Docker Compose (one command, includes Postgres)

```bash
docker compose up --build
```
This starts Postgres on `5432`, the API on `4000`, and the frontend on `5173`. On first run,
open a shell into the backend container and run the migration + seed once:
```bash
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run seed
```

### Test login credentials (all roles, password: `Password123!`)

| Role      | Email               |
|-----------|----------------------|
| Admin     | admin@erp.test       |
| Sales     | sales@erp.test       |
| Warehouse | warehouse@erp.test   |
| Accounts  | accounts@erp.test    |

---

## 5. How to deploy the project (free-tier friendly)

1. **Database:** create a free Postgres instance on [Neon](https://neon.tech) or
   [Supabase](https://supabase.com). Copy the connection string into `DATABASE_URL`.
2. **Backend:** deploy `backend/` to [Render](https://render.com) or
   [Railway](https://railway.app) as a Web Service.
   - Build command: `npm install && npx prisma generate && npm run build`
   - Start command: `npx prisma migrate deploy && npm start`
   - Set env vars: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN` (your frontend URL), `PORT` (usually provided automatically)
3. **Frontend:** deploy `frontend/` to [Vercel](https://vercel.com) or
   [Netlify](https://netlify.com) as a static site.
   - Build command: `npm run build`
   - Output directory: `dist`
   - Env var: `VITE_API_URL` = your deployed backend URL
4. After both are live, run `npm run seed` once against the deployed database (via Render's shell,
   or temporarily point your local `.env` at the deployed `DATABASE_URL` and run `npm run seed` from
   your machine) to create the test accounts.

AWS deployment (EC2 + RDS, or ECS) is treated as a bonus per the brief and isn't required — the
Docker images in this repo (`backend/Dockerfile`, `frontend/Dockerfile`) are AWS-compatible if you
want to push them to ECR/ECS or run them on an EC2 instance later.

---

## 6. Architecture, in short

- **Auth:** stateless JWT. On login, the API signs a token containing `userId`, `email`, `role`.
  The frontend stores it in `localStorage` and attaches it as `Authorization: Bearer <token>` via
  an Axios interceptor. `requireAuth` verifies the token; `requireRole(...)` gates specific routes
  (e.g. only `ADMIN`/`WAREHOUSE` can create products; only `ADMIN`/`SALES` can create challans).
- **Data model:** Users → Customers → FollowUps; Products → StockMovements; Challans → ChallanItems
  (each item snapshots product name/SKU/price at the time of the challan, per the spec, so later
  price changes don't rewrite history).
- **Challan business logic** (the core of the assignment) lives in `challan.service.ts`:
  - Creating a `CONFIRMED` challan or calling `/confirm` on a `DRAFT` checks stock for **every**
    line item first; if any item is short, the whole operation fails with a `409` and no stock is
    touched (all-or-nothing).
  - Confirming decrements `Product.currentStock` and writes a `StockMovement` (`OUT`) row per item,
    inside the same DB transaction as the status change.
  - Cancelling a `CONFIRMED` challan restores stock and writes matching `IN` movement rows for audit.
  - `DRAFT` challans never touch stock, so sales reps can prepare a challan without reserving stock.
- **Validation:** every route validates `body`/`query`/`params` with Zod before the controller runs;
  failures return `422` with a field-level error list.
- **Errors:** a single `errorHandler` middleware maps custom `AppError` subclasses (NotFound,
  Conflict, Unauthorized, Forbidden) and Prisma error codes (unique constraint, record not found) to
  consistent JSON + status codes.

---

## 7. Assumptions made

- Roles are fixed at four (Admin, Sales, Warehouse, Accounts) with straightforward permission
  boundaries: Sales owns Customers + Challans, Warehouse owns Products + Stock, Admin can do
  everything, Accounts has read-only access across modules (no separate invoicing module was
  built — see limitations).
- Challan numbers are simple, human-readable, year-scoped sequences (`CH-2026-000001`) rather than
  UUIDs, generated by counting existing challans for the year. This is documented as a concurrency
  limitation below rather than hidden.
- "Add customer" and "Add product" are restricted to the roles that would realistically own that
  data (Sales for customers, Warehouse for products), with Admin always allowed; other roles get
  read access so they have shared context.
- GST number, email, and address are optional per the spec ("GST number, optional"); other customer
  fields are required.

---

## 8. Known limitations / incomplete parts

- **No Invoice module.** The spec mentions invoices as part of the business context, but the
  "Core Modules Required" section only requires Auth, CRM, Inventory, and Sales Challan — an
  invoice/PDF-export module was treated as bonus scope and not built in this pass.
- **Challan numbering under concurrency:** the sequence is derived from `count()` at request time,
  which is safe for demo/low-concurrency use but could theoretically collide under simultaneous
  writes; a production system should use a DB sequence or advisory lock instead.
- **Low-stock filtering** is done in application code rather than as a SQL `WHERE currentStock <=
  minStock` (Prisma can't compare two columns directly without a raw query), fine at this scale but
  worth revisiting for a larger catalog.
- **No image upload / AWS S3 integration** (listed as bonus).
- **No GitHub Actions CI/CD pipeline** included (listed as bonus) — Dockerfiles are provided so
  this is straightforward to add later.
- **Prisma engine binaries could not be downloaded in the sandboxed environment this project was
  authored in**, so `npx prisma generate` / `migrate` were not run end-to-end here. The schema and
  application code were written and manually reviewed for correctness, and the frontend and backend
  both pass full TypeScript compilation. Run `npx prisma migrate dev` yourself on first setup (see
  section 4) — this is a completely standard step and will work normally with regular internet access.

---

## 9. Suggested order of work (if picking this up fresh, ~48 hours)

1. **Hours 0–4:** Confirm DB choice, spin up Postgres (local or Neon), run migrations, seed data.
2. **Hours 4–14:** Backend — auth, roles, customers module, products/inventory module.
3. **Hours 14–24:** Backend — sales challan module (the trickiest part: draft/confirm/cancel,
   stock deduction, snapshotting). Test thoroughly with Postman before touching the frontend.
4. **Hours 24–34:** Frontend — login, customers list/detail, products/inventory, basic styling.
5. **Hours 34–42:** Frontend — challan creation flow (multi-product form) + challan detail/confirm/cancel.
6. **Hours 42–46:** Deploy (Render/Neon/Vercel), or record a clean local walkthrough if skipping deploy.
7. **Hours 46–48:** README, Postman collection polish, screen recording, final review of "known
   limitations" honesty — better to flag a gap than have it discovered.

---

## 10. Bonus features included in this repo

- ✅ Docker setup (`docker-compose.yml`, both Dockerfiles)
- ⬜ GitHub Actions deployment (not included — flagged as a limitation above)
- ⬜ Export invoice as PDF (not included — no invoice module in this pass)
- ⬜ Upload product image to AWS S3 (not included)
