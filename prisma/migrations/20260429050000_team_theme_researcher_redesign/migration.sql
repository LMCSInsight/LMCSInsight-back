-- 1) Team now owns a required theme
ALTER TABLE "teams" ADD COLUMN "themeId" TEXT;

-- 2) Backfill teams.themeId from existing themes.teamId
WITH ranked AS (
  SELECT
    t."id" AS team_id,
    th."id" AS theme_id,
    ROW_NUMBER() OVER (
      PARTITION BY t."id"
      ORDER BY th."createdAt" ASC, th."id" ASC
    ) AS rn
  FROM "teams" t
  JOIN "themes" th ON th."teamId" = t."id"
),
picked AS (
  SELECT team_id, theme_id
  FROM ranked
  WHERE rn = 1
)
UPDATE "teams" t
SET "themeId" = p.theme_id
FROM picked p
WHERE t."id" = p.team_id
  AND t."themeId" IS NULL;

-- 3) Create a fallback theme for teams with no linked theme
INSERT INTO "themes" ("id", "name", "description", "createdAt", "updatedAt")
SELECT
  'fallback-theme-' || t."id",
  'Auto-migrated theme - ' || t."name",
  'Auto-created during Team/Theme redesign migration.',
  NOW(),
  NOW()
FROM "teams" t
WHERE t."themeId" IS NULL;

UPDATE "teams" t
SET "themeId" = 'fallback-theme-' || t."id"
WHERE t."themeId" IS NULL;

-- 4) New many-to-many Team <-> Chercheur relation
CREATE TABLE "_TeamMembers" (
  "A" VARCHAR(50) NOT NULL,
  "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX "_TeamMembers_AB_unique" ON "_TeamMembers"("A", "B");
CREATE INDEX "_TeamMembers_B_index" ON "_TeamMembers"("B");

ALTER TABLE "_TeamMembers"
ADD CONSTRAINT "_TeamMembers_A_fkey"
FOREIGN KEY ("A") REFERENCES "chercheurs"("chercheur_id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_TeamMembers"
ADD CONSTRAINT "_TeamMembers_B_fkey"
FOREIGN KEY ("B") REFERENCES "teams"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- 5) Backfill membership from legacy chercheurs.equipe_id
INSERT INTO "_TeamMembers" ("A", "B")
SELECT c."chercheur_id", c."equipe_id"
FROM "chercheurs" c
WHERE c."equipe_id" IS NOT NULL
ON CONFLICT ("A", "B") DO NOTHING;

-- 6) Remove old one-to-many relations
ALTER TABLE "themes" DROP CONSTRAINT IF EXISTS "themes_teamId_fkey";
DROP INDEX IF EXISTS "themes_teamId_idx";
ALTER TABLE "themes" DROP COLUMN IF EXISTS "teamId";

ALTER TABLE "chercheurs" DROP CONSTRAINT IF EXISTS "chercheurs_equipe_id_fkey";
DROP INDEX IF EXISTS "chercheurs_equipe_id_idx";
ALTER TABLE "chercheurs" DROP COLUMN IF EXISTS "equipe_id";

-- 7) Enforce required team.themeId relation
CREATE INDEX "teams_themeId_idx" ON "teams"("themeId");

ALTER TABLE "teams"
ADD CONSTRAINT "teams_themeId_fkey"
FOREIGN KEY ("themeId") REFERENCES "themes"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "teams" ALTER COLUMN "themeId" SET NOT NULL;
