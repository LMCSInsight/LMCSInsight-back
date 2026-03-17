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

```bash
cd backend
npm install
cp .env.example .env   # Edit DATABASE_URL, JWT_SECRET, etc.
```

Create the database and run the SQL script (PostgreSQL):

```bash
createdb lmcs_platform
psql -U postgres -d lmcs_platform -f create_complete_database.sql
```

Then:

```bash
npx prisma generate
npm run db:seed        # Optional: seed users (admin, director, teacher, assistant)
npm run dev            # Start dev server (default port 5000)
```

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
- **TEACHER** – Own supervisions (filtered by `chercheur_id` when linked).
- **ASSISTANT** – Validation workflow (pending list, validate/reject).
