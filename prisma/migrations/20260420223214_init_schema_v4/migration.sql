-- CreateEnum
CREATE TYPE "Qualite" AS ENUM ('Enseignant-Chercheur', 'Chercheur');

-- CreateEnum
CREATE TYPE "GradeRecherche" AS ENUM ('Attache de recherche', 'Charge de recherche', 'Directeur de recherche');

-- CreateEnum
CREATE TYPE "StatutChercheur" AS ENUM ('Actif', 'Non actif');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'DIRECTOR', 'RESEARCHER', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "SupervisionType" AS ENUM ('PFE', 'MASTER', 'PHD', 'INTERNSHIP', 'PROJECT');

-- CreateEnum
CREATE TYPE "SupervisionStatus" AS ENUM ('IN_PROGRESS', 'DEFENDED', 'ABANDONED', 'EXTENSION', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('PENDING', 'VALIDATED', 'REJECTED', 'REVISED');

-- CreateEnum
CREATE TYPE "Institution" AS ENUM ('ESI', 'EXTERNE');

-- CreateEnum
CREATE TYPE "StudentLevel" AS ENUM ('MASTER', 'DOCTORANT');

-- CreateEnum
CREATE TYPE "Specialty" AS ENUM ('SIL', 'SID', 'SIT', 'SIQ');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('VALIDATION_DECISION', 'NEW_SUBMISSION', 'RESUBMISSION');

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "themes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "teamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chercheurs" (
    "chercheur_id" VARCHAR(50) NOT NULL,
    "nom_complet" VARCHAR(255) NOT NULL,
    "mails" TEXT[],
    "tel" VARCHAR(20),
    "diplome" VARCHAR(255),
    "etablissement_origine" VARCHAR(255),
    "qualite" "Qualite" NOT NULL,
    "grade_recherche" "GradeRecherche",
    "statut" "StatutChercheur" NOT NULL DEFAULT 'Actif',
    "hindex" INTEGER NOT NULL DEFAULT 0,
    "equipe_id" TEXT,
    "url_dblp" VARCHAR(500),
    "url_google_scholar" VARCHAR(500),
    "url_researchgate" VARCHAR(500),
    "url_site_personnel" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chercheurs_pkey" PRIMARY KEY ("chercheur_id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "phoneNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "chercheur_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "institution" "Institution" NOT NULL,
    "level" "StudentLevel" NOT NULL,
    "specialty" "Specialty",
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supervisions" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "type" "SupervisionType" NOT NULL,
    "description" TEXT,
    "status" "SupervisionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "validationStatus" "ValidationStatus" NOT NULL DEFAULT 'PENDING',
    "validatedAt" TIMESTAMP(3),
    "validationNotes" TEXT,
    "academicYear" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "expectedEndDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "keywords" TEXT[],
    "deletedAt" TIMESTAMP(3),
    "studentId" TEXT NOT NULL,
    "themeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supervisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supervision_supervisors" (
    "id" TEXT NOT NULL,
    "supervisionId" TEXT NOT NULL,
    "supervisorId" VARCHAR(50) NOT NULL,
    "contributionPercent" INTEGER NOT NULL DEFAULT 100,
    "isMainSupervisor" BOOLEAN NOT NULL DEFAULT false,
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supervision_supervisors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validation_logs" (
    "id" TEXT NOT NULL,
    "supervisionId" TEXT NOT NULL,
    "validatorId" TEXT NOT NULL,
    "status" "ValidationStatus" NOT NULL,
    "comments" TEXT,
    "fieldsChecked" JSONB,
    "issues" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "validation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" VARCHAR(255),
    "changes" JSONB,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "userId" TEXT,
    "supervisionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "recipientId" TEXT NOT NULL,
    "supervisionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teams_name_key" ON "teams"("name");

-- CreateIndex
CREATE INDEX "themes_teamId_idx" ON "themes"("teamId");

-- CreateIndex
CREATE INDEX "chercheurs_nom_complet_idx" ON "chercheurs"("nom_complet");

-- CreateIndex
CREATE INDEX "chercheurs_qualite_idx" ON "chercheurs"("qualite");

-- CreateIndex
CREATE INDEX "chercheurs_statut_idx" ON "chercheurs"("statut");

-- CreateIndex
CREATE INDEX "chercheurs_equipe_id_idx" ON "chercheurs"("equipe_id");

-- CreateIndex
CREATE INDEX "chercheurs_qualite_statut_idx" ON "chercheurs"("qualite", "statut");

-- CreateIndex
CREATE INDEX "chercheurs_hindex_idx" ON "chercheurs"("hindex" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_chercheur_id_key" ON "users"("chercheur_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_chercheur_id_idx" ON "users"("chercheur_id");

-- CreateIndex
CREATE INDEX "users_role_isActive_idx" ON "users"("role", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

-- CreateIndex
CREATE INDEX "students_email_idx" ON "students"("email");

-- CreateIndex
CREATE INDEX "students_institution_idx" ON "students"("institution");

-- CreateIndex
CREATE INDEX "students_level_idx" ON "students"("level");

-- CreateIndex
CREATE INDEX "students_lastName_firstName_idx" ON "students"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "students_deletedAt_idx" ON "students"("deletedAt");

-- CreateIndex
CREATE INDEX "supervisions_type_idx" ON "supervisions"("type");

-- CreateIndex
CREATE INDEX "supervisions_status_idx" ON "supervisions"("status");

-- CreateIndex
CREATE INDEX "supervisions_validationStatus_idx" ON "supervisions"("validationStatus");

-- CreateIndex
CREATE INDEX "supervisions_validationStatus_status_idx" ON "supervisions"("validationStatus", "status");

-- CreateIndex
CREATE INDEX "supervisions_academicYear_idx" ON "supervisions"("academicYear");

-- CreateIndex
CREATE INDEX "supervisions_studentId_idx" ON "supervisions"("studentId");

-- CreateIndex
CREATE INDEX "supervisions_themeId_idx" ON "supervisions"("themeId");

-- CreateIndex
CREATE INDEX "supervisions_academicYear_type_idx" ON "supervisions"("academicYear", "type");

-- CreateIndex
CREATE INDEX "supervisions_academicYear_validationStatus_idx" ON "supervisions"("academicYear", "validationStatus");

-- CreateIndex
CREATE INDEX "supervisions_startDate_idx" ON "supervisions"("startDate");

-- CreateIndex
CREATE INDEX "supervisions_validatedAt_idx" ON "supervisions"("validatedAt");

-- CreateIndex
CREATE INDEX "supervisions_updatedAt_idx" ON "supervisions"("updatedAt" DESC);

-- CreateIndex
CREATE INDEX "supervisions_deletedAt_idx" ON "supervisions"("deletedAt");

-- CreateIndex
CREATE INDEX "supervision_supervisors_supervisionId_idx" ON "supervision_supervisors"("supervisionId");

-- CreateIndex
CREATE INDEX "supervision_supervisors_supervisorId_idx" ON "supervision_supervisors"("supervisorId");

-- CreateIndex
CREATE INDEX "supervision_supervisors_supervisorId_isMainSupervisor_idx" ON "supervision_supervisors"("supervisorId", "isMainSupervisor");

-- CreateIndex
CREATE UNIQUE INDEX "supervision_supervisors_supervisionId_supervisorId_key" ON "supervision_supervisors"("supervisionId", "supervisorId");

-- CreateIndex
CREATE INDEX "validation_logs_supervisionId_idx" ON "validation_logs"("supervisionId");

-- CreateIndex
CREATE INDEX "validation_logs_validatorId_idx" ON "validation_logs"("validatorId");

-- CreateIndex
CREATE INDEX "validation_logs_status_idx" ON "validation_logs"("status");

-- CreateIndex
CREATE INDEX "validation_logs_createdAt_idx" ON "validation_logs"("createdAt");

-- CreateIndex
CREATE INDEX "validation_logs_validatorId_createdAt_idx" ON "validation_logs"("validatorId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "validation_logs_supervisionId_createdAt_idx" ON "validation_logs"("supervisionId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_idx" ON "audit_logs"("entityType");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_supervisionId_idx" ON "audit_logs"("supervisionId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "notifications_recipientId_idx" ON "notifications"("recipientId");

-- CreateIndex
CREATE INDEX "notifications_recipientId_readAt_idx" ON "notifications"("recipientId", "readAt");

-- CreateIndex
CREATE INDEX "notifications_supervisionId_idx" ON "notifications"("supervisionId");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "themes" ADD CONSTRAINT "themes_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chercheurs" ADD CONSTRAINT "chercheurs_equipe_id_fkey" FOREIGN KEY ("equipe_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_chercheur_id_fkey" FOREIGN KEY ("chercheur_id") REFERENCES "chercheurs"("chercheur_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisions" ADD CONSTRAINT "supervisions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisions" ADD CONSTRAINT "supervisions_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "themes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervision_supervisors" ADD CONSTRAINT "supervision_supervisors_supervisionId_fkey" FOREIGN KEY ("supervisionId") REFERENCES "supervisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervision_supervisors" ADD CONSTRAINT "supervision_supervisors_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "chercheurs"("chercheur_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_logs" ADD CONSTRAINT "validation_logs_supervisionId_fkey" FOREIGN KEY ("supervisionId") REFERENCES "supervisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_logs" ADD CONSTRAINT "validation_logs_validatorId_fkey" FOREIGN KEY ("validatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_supervisionId_fkey" FOREIGN KEY ("supervisionId") REFERENCES "supervisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_supervisionId_fkey" FOREIGN KEY ("supervisionId") REFERENCES "supervisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
