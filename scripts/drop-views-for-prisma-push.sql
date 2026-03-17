-- Drop views that depend on enum columns so Prisma can alter enum types (e.g. UserRole TEACHER->RESEARCHER, GradeRecherche, Qualite, StatutChercheur).
-- Run this in psql or pgAdmin against your LMCSInsight database BEFORE running: npx prisma db push
-- Usage: psql -U postgres -d LMCSInsight -f scripts/drop-views-for-prisma-push.sql

DROP VIEW IF EXISTS "supervisions_avec_superviseurs";
DROP VIEW IF EXISTS "chercheurs_actifs_details";
