-- Recreate views after running: npx prisma db push
-- Run this in psql or pgAdmin against your LMCSInsight database AFTER prisma db push succeeds.
-- Usage: psql -U postgres -d LMCSInsight -f scripts/recreate-views-after-prisma-push.sql

-- View: Active chercheurs with team names
CREATE OR REPLACE VIEW "chercheurs_actifs_details" AS
SELECT 
    c."chercheur_id",
    c."nom_complet",
    c."mails",
    c."tel",
    c."qualite",
    c."grade_recherche",
    c."hindex",
    t."name" as "equipe_name",
    c."url_google_scholar",
    c."url_researchgate"
FROM "chercheurs" c
LEFT JOIN "teams" t ON c."equipe_id" = t."id"
WHERE c."statut" = 'Actif'
ORDER BY c."hindex" DESC;

COMMENT ON VIEW "chercheurs_actifs_details" IS 
    'Active researchers with team names and key information';

-- View: Supervisions with supervisor details
CREATE OR REPLACE VIEW "supervisions_avec_superviseurs" AS
SELECT 
    s."id" as "supervision_id",
    s."title",
    s."type",
    s."status",
    s."validationStatus",
    s."academicYear",
    s."startDate",
    st."firstName" || ' ' || st."lastName" as "student_name",
    st."institution" as "student_institution",
    th."name" as "theme_name",
    tm."name" as "team_name",
    array_agg(
        jsonb_build_object(
            'chercheur_id', c."chercheur_id",
            'nom', c."nom_complet",
            'is_main', ss."isMainSupervisor",
            'contribution', ss."contributionPercent"
        )
    ) as "supervisors"
FROM "supervisions" s
LEFT JOIN "students" st ON s."studentId" = st."id"
LEFT JOIN "themes" th ON s."themeId" = th."id"
LEFT JOIN "teams" tm ON th."teamId" = tm."id"
LEFT JOIN "supervision_supervisors" ss ON s."id" = ss."supervisionId"
LEFT JOIN "chercheurs" c ON ss."supervisorId" = c."chercheur_id"
GROUP BY 
    s."id", s."title", s."type", s."status", s."validationStatus", s."academicYear", 
    s."startDate", st."firstName", st."lastName", st."institution", th."name", tm."name";

COMMENT ON VIEW "supervisions_avec_superviseurs" IS 
    'Supervisions with all details including supervisor information';
