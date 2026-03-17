# LMCS Insight – Backend API

REST API for the LMCS Supervision Tracking System (Suivi des encadrements – Phase II 2025-2026). Built with **Node.js**, **Express**, **Prisma**, and **PostgreSQL**.

## Stack

- **Runtime:** Node.js 20+ LTS
- **Framework:** Express 5
- **ORM:** Prisma (PostgreSQL)
- **Auth:** JWT, bcrypt
- **Validation:** Zod

## Database (v3)

The API uses a **Chercheur-centric** schema (v3):

- **Chercheur** = researcher profile (ESI matricule, qualite, grade, h-index, team).
- **User** = system account (auth, roles). Optional link: `users.chercheur_id → chercheurs.chercheur_id`.
- Supervisors on supervisions are **chercheurs**, not users.

The database is created by the SQL script (no Prisma migrations for initial schema). See `create_complete_database.sql` and `COMPLETE_DATABASE_DOCUMENTATION.md` in this folder.

## Setup

### 1. Install and env

```bash
cd backend
npm install
cp .env.example .env   # Or edit the existing .env
```

### 2. Local PostgreSQL (e.g. pgAdmin)

1. In **pgAdmin** (or psql), create a database named `lmcs_platform` (e.g. right‑click Databases → Create → Database).
2. In `.env`, set `DATABASE_URL` to your local Postgres credentials:
   - Format: `postgresql://USER:PASSWORD@localhost:5432/lmcs_platform`
   - Example: `postgresql://postgres:yourpassword@localhost:5432/lmcs_platform`
   - Use the same user/password you use in pgAdmin to connect.

### 3. Create tables and seed users

Either use Prisma to create tables from the schema:

```bash
npx prisma generate
npx prisma db push     # Creates/updates tables from schema.prisma
npm run db:seed        # Creates one user per role (see Seed users below)
```

**If `prisma db push` fails with "cannot alter type of a column used by a view or rule"** (e.g. view `chercheurs_actifs_details`), drop the views first, push, then recreate them:

```bash
npm run db:drop-views
npx prisma db push --accept-data-loss
npm run db:recreate-views
npm run db:seed
```

Or with psql: run `scripts/drop-views-for-prisma-push.sql`, then `db push`, then `scripts/recreate-views-after-prisma-push.sql`.

Or, if you use the legacy SQL script:

```bash
createdb lmcs_platform
psql -U postgres -d lmcs_platform -f create_complete_database.sql
npx prisma generate
npm run db:seed
```

### 4. Start the API

```bash
npm run dev            # Default port 5000
```

### Seed users (for login tests)

After `npm run db:seed`, you can log in with:

| Role       | Email               | Password   |
|------------|---------------------|------------|
| ADMIN      | admin@lmcs.dz       | `admin123` |
| DIRECTOR   | director@lmcs.dz    | `admin123` |
| RESEARCHER | researcher@lmcs.dz  | `admin123` |
| ASSISTANT  | assistant@lmcs.dz   | `admin123` |

## Environment (.env)

| Variable     | Description                    |
|-------------|---------------------------------|
| `DATABASE_URL` | PostgreSQL connection string (e.g. `postgresql://user:password@localhost:5432/lmcs_platform`) |
| `JWT_SECRET`   | Secret for signing JWTs        |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `15m`)  |
| `PORT`         | Server port (default `5000`)  |
| `CORS_ORIGIN`  | Allowed frontend origin (e.g. `http://localhost:5173`) |

## Scripts

| Script           | Description                |
|------------------|----------------------------|
| `npm run dev`    | Start dev server (tsx watch) |
| `npm run build`  | Compile TypeScript to `dist/` |
| `npm run start`  | Run compiled app          |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:seed`    | Seed database (users)     |
| `npm run db:studio`  | Open Prisma Studio       |

## API

- **Base URL:** `http://localhost:5000/api`
- **Health:** `GET /health`

### Auth

- `POST /api/auth/register` – body: `firstName`, `lastName`, `email`, `password`, `role?`, `chercheur_id?`
- `POST /api/auth/login` – body: `email`, `password` → `{ token, user }`

Use header: `Authorization: Bearer <token>` for protected routes.

### Main routes

- **Supervisions:** `GET/POST /api/supervisions`, `GET/PUT/DELETE /api/supervisions/:id`, `GET /api/supervisions/search`, `POST /api/supervisions/:id/supervisors` (body: `supervisorId` = chercheur_id)
- **Students:** `GET/POST /api/students`, `GET/PUT/DELETE /api/students/:id`
- **Validation:** `GET /api/validation/pending`, `PATCH /api/validation/:id/status`, `PATCH /api/validation/:id/validate` (ASSISTANT/ADMIN)
- **Statistics:** `GET /api/statistics/overview` (DIRECTOR/ADMIN)
- **Admin:** `GET/POST/PUT/DELETE /api/admin/users` (ADMIN)

## Architecture

- **Routes** – Define endpoints, call services, attach middleware.
- **Services** – Business logic, call repositories.
- **Repositories** – Prisma queries in `src/db/repositories/`.

Request flow: **Route → Service → Repository → Prisma → PostgreSQL**.

## Roles

- **ADMIN** – Full access, user management.
- **DIRECTOR** – Read-all stats and reports.
- **RESEARCHER** – Own supervisions (filtered by `chercheur_id` when linked; researcher = chercheur).
- **ASSISTANT** – Validation workflow (pending list, validate/reject).
