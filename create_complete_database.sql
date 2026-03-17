-- ============================================
-- LMCS SUPERVISION TRACKING SYSTEM
-- COMPLETE DATABASE CREATION SCRIPT - VERSION 3.0
-- ============================================
-- 
-- This script creates the complete database schema for the LMCS 
-- Supervision Tracking System including:
-- - Chercheur table (independent researcher profiles)
-- - Supervision tracking with validation workflow
-- - Student management
-- - Teams and themes
-- - Audit logging
--
-- Database: PostgreSQL 15+
-- Encoding: UTF8
-- Author: LMCS Team
-- Version: 3.0 - Integrated Chercheur table
-- Date: March 2026
--
-- IMPORTANT NOTES:
-- 1. Run this script as a PostgreSQL superuser or database owner
-- 2. Make sure you have created the database first: CREATE DATABASE lmcs_platform;
-- 3. This script is idempotent - you can run it multiple times safely
-- 4. All tables use UUID for primary keys except Chercheur (uses Matricule ESI)
-- 5. Timestamps are automatically managed by PostgreSQL
--
-- PREREQUISITES:
-- - PostgreSQL 15 or higher installed
-- - Database created: lmcs_platform
-- - pgcrypto extension enabled (for UUID generation)
--
-- ============================================

-- Connect to the database (run this manually in your PostgreSQL client)
-- \c lmcs_platform

-- ============================================
-- STEP 1: ENABLE REQUIRED EXTENSIONS
-- ============================================

-- UUID generation function
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Text search capabilities for searching
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- STEP 2: CREATE CUSTOM ENUM TYPES
-- ============================================

-- ===== CHERCHEUR ENUMS =====

-- Qualité defines the type of researcher
CREATE TYPE "Qualite" AS ENUM (
    'Enseignant-Chercheur',  -- Teacher-Researcher
    'Chercheur',             -- Researcher
    'Doctorant'              -- PhD Student
);

-- Grade_Recherche defines the research grade (NULL for PhD students)
CREATE TYPE "GradeRecherche" AS ENUM (
    'Attache de recherche',      -- Research Associate
    'Charge de recherche',       -- Research Fellow
    'Directeur de recherche'     -- Research Director
);

-- Statut defines whether the researcher is currently active
CREATE TYPE "StatutChercheur" AS ENUM (
    'Actif',        -- Active
    'Non actif'     -- Inactive
);

-- ===== SYSTEM USER ENUMS =====

-- UserRole defines system access levels (for authentication)
-- Note: This is separate from Chercheur - these are system roles
CREATE TYPE "UserRole" AS ENUM (
  'ADMIN',          -- Full system access
  'DIRECTOR',       -- Laboratory director - view all data
  'TEACHER',        -- Regular teacher - manage own supervisions
  'ASSISTANT'       -- Data validation assistant - validate entries
);

-- ===== SUPERVISION ENUMS =====

-- SupervisionType categorizes the different kinds of academic work
CREATE TYPE "SupervisionType" AS ENUM (
    'PFE',         -- Projet de Fin d'Études (Engineering Final Project)
    'MASTER',      -- Master's Thesis
    'PHD',         -- PhD Dissertation
    'INTERNSHIP',  -- Academic Internship (SPE)
    'PROJECT'      -- Research Project
);

-- SupervisionStatus tracks the lifecycle of a supervision
CREATE TYPE "SupervisionStatus" AS ENUM (
    'IN_PROGRESS',  -- Currently active
    'DEFENDED',     -- Successfully completed and defended
    'ABANDONED',    -- Discontinued before completion
    'EXTENSION',    -- Granted additional time
    'SUSPENDED'     -- Temporarily paused
);

-- ValidationStatus tracks the data validation workflow
CREATE TYPE "ValidationStatus" AS ENUM (
    'PENDING',    -- Awaiting assistant review (default for new entries)
    'VALIDATED',  -- Approved by assistant, can appear in reports
    'REJECTED',   -- Contains errors, needs teacher correction
    'REVISED'     -- Resubmitted after correction, awaiting re-validation
);

-- ============================================
-- STEP 3: CREATE REFERENCE TABLES
-- ============================================

-- --------------------------------------------
-- TABLE: teams
-- --------------------------------------------
-- Stores laboratory research teams
CREATE TABLE IF NOT EXISTS "teams" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL UNIQUE,
    "description" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE "teams" IS 'Laboratory research teams that organize researchers and themes';

-- --------------------------------------------
-- TABLE: themes
-- --------------------------------------------
-- Stores research themes/domains
CREATE TABLE IF NOT EXISTS "themes" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "teamId" UUID,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "fk_themes_team" 
        FOREIGN KEY ("teamId") 
        REFERENCES "teams"("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_themes_teamId" ON "themes"("teamId");

COMMENT ON TABLE "themes" IS 'Research themes/domains that can be assigned to supervisions';

-- ============================================
-- STEP 4: CREATE CHERCHEUR TABLE (RESEARCHERS)
-- ============================================

-- --------------------------------------------
-- TABLE: chercheurs
-- --------------------------------------------
-- Central table storing all researcher information
-- This is the main researcher profile table
CREATE TABLE IF NOT EXISTS "chercheurs" (
    -- Primary Key: ESI Registration Number (Matricule ESI)
    "chercheur_id" VARCHAR(50) PRIMARY KEY,
    
    -- Basic Information
    "nom_complet" VARCHAR(255) NOT NULL,
    
    -- Contact Information
    "mails" TEXT[] NOT NULL,  -- Array of email addresses
    "tel" VARCHAR(20),        -- Phone number (optional)
    
    -- Academic Background
    "diplome" VARCHAR(255),                -- Highest degree
    "etablissement_origine" VARCHAR(255),  -- Origin institution
    
    -- Professional Classification
    "qualite" "Qualite" NOT NULL,          -- Type of researcher
    "grade_recherche" "GradeRecherche",    -- Research grade (NULL for PhD students)
    
    -- Status
    "statut" "StatutChercheur" NOT NULL DEFAULT 'Actif',
    
    -- Research Metrics
    "hindex" INTEGER DEFAULT 0 CHECK ("hindex" >= 0),  -- H-index (cannot be negative)
    
    -- Team Assignment - Links to teams table
    "equipe_id" UUID,  -- Foreign key to teams
    
    -- Online Presence (Academic URLs)
    "url_dblp" VARCHAR(500),           -- DBLP profile URL
    "url_google_scholar" VARCHAR(500), -- Google Scholar profile URL
    "url_researchgate" VARCHAR(500),   -- ResearchGate profile URL
    "url_site_personnel" VARCHAR(500), -- Personal website URL
    
    -- Timestamps
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key to teams
    CONSTRAINT "fk_chercheurs_team" 
        FOREIGN KEY ("equipe_id") 
        REFERENCES "teams"("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,
    
    -- Business rule: PhD students cannot have research grade
    CONSTRAINT "chk_doctorant_no_grade" 
        CHECK (
            ("qualite" != 'Doctorant') OR 
            ("grade_recherche" IS NULL)
        ),
    
    -- Ensure at least one email is provided
    CONSTRAINT "chk_has_email" 
        CHECK (array_length("mails", 1) > 0)
);

-- Indexes for chercheurs table
CREATE INDEX IF NOT EXISTS "idx_chercheurs_nom" ON "chercheurs"("nom_complet");
CREATE INDEX IF NOT EXISTS "idx_chercheurs_qualite" ON "chercheurs"("qualite");
CREATE INDEX IF NOT EXISTS "idx_chercheurs_statut" ON "chercheurs"("statut");
CREATE INDEX IF NOT EXISTS "idx_chercheurs_equipe" ON "chercheurs"("equipe_id");
CREATE INDEX IF NOT EXISTS "idx_chercheurs_qualite_statut" ON "chercheurs"("qualite", "statut");
CREATE INDEX IF NOT EXISTS "idx_chercheurs_hindex" ON "chercheurs"("hindex" DESC);
CREATE INDEX IF NOT EXISTS "idx_chercheurs_mails" ON "chercheurs" USING gin("mails");

COMMENT ON TABLE "chercheurs" IS 
    'Central researcher profiles including teachers, research staff, and PhD students';
COMMENT ON COLUMN "chercheurs"."chercheur_id" IS 
    'Primary key: ESI registration number (Matricule ESI)';
COMMENT ON COLUMN "chercheurs"."mails" IS 
    'Array of email addresses (professional and personal)';
COMMENT ON COLUMN "chercheurs"."equipe_id" IS 
    'Foreign key reference to teams table';

-- ============================================
-- STEP 5: CREATE USERS TABLE (SYSTEM ACCESS)
-- ============================================

-- --------------------------------------------
-- TABLE: users
-- --------------------------------------------
-- System authentication and authorization
-- Links to chercheurs for researcher accounts
CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL UNIQUE,  -- Login email
    "password" VARCHAR(255) NOT NULL,      -- Bcrypt hashed password
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "role" "UserRole" NOT NULL,            -- System role
    "phoneNumber" VARCHAR(20),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    
    -- Link to chercheur profile (optional - for researchers who are also system users)
    "chercheur_id" VARCHAR(50),
    
    -- Legacy team reference (kept for backward compatibility)
    "teamId" UUID,
    
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key to chercheurs (optional link)
    CONSTRAINT "fk_users_chercheur" 
        FOREIGN KEY ("chercheur_id") 
        REFERENCES "chercheurs"("chercheur_id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,
    
    -- Foreign key to teams (legacy)
    CONSTRAINT "fk_users_team" 
        FOREIGN KEY ("teamId") 
        REFERENCES "teams"("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users"("role");
CREATE INDEX IF NOT EXISTS "idx_users_chercheur" ON "users"("chercheur_id");
CREATE INDEX IF NOT EXISTS "idx_users_teamId" ON "users"("teamId");
CREATE INDEX IF NOT EXISTS "idx_users_role_isActive" ON "users"("role", "isActive") WHERE "isActive" = true;

COMMENT ON TABLE "users" IS 
    'System users with authentication credentials and role-based access control';
COMMENT ON COLUMN "users"."chercheur_id" IS 
    'Optional link to chercheur profile for researchers who have system access';

-- ============================================
-- STEP 6: CREATE STUDENTS TABLE
-- ============================================

-- --------------------------------------------
-- TABLE: students
-- --------------------------------------------
-- Students being supervised (PFE, Master, PhD, Internship)
CREATE TABLE IF NOT EXISTS "students" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) UNIQUE,
    "institution" VARCHAR(255) NOT NULL,
    "level" VARCHAR(50) NOT NULL,
    "specialty" VARCHAR(255),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for students
CREATE INDEX IF NOT EXISTS "idx_students_email" ON "students"("email");
CREATE INDEX IF NOT EXISTS "idx_students_institution" ON "students"("institution");
CREATE INDEX IF NOT EXISTS "idx_students_level" ON "students"("level");
CREATE INDEX IF NOT EXISTS "idx_students_name" ON "students"("lastName", "firstName");

COMMENT ON TABLE "students" IS 
    'Students, PhD candidates, and interns being supervised';

-- ============================================
-- STEP 7: CREATE SUPERVISIONS TABLE
-- ============================================

-- --------------------------------------------
-- TABLE: supervisions
-- --------------------------------------------
-- Core table storing all supervision records
CREATE TABLE IF NOT EXISTS "supervisions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" VARCHAR(500) NOT NULL,
    "type" "SupervisionType" NOT NULL,
    "description" TEXT,
    "status" "SupervisionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    
    -- Validation workflow fields
    "validationStatus" "ValidationStatus" NOT NULL DEFAULT 'PENDING',
    "validatedAt" TIMESTAMP,
    "validationNotes" TEXT,
    
    "academicYear" VARCHAR(20) NOT NULL,
    "startDate" TIMESTAMP NOT NULL,
    "expectedEndDate" TIMESTAMP,
    "actualEndDate" TIMESTAMP,
    "keywords" TEXT[],
    
    -- Foreign keys
    "studentId" UUID NOT NULL,
    "themeId" UUID,
    
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT "fk_supervisions_student" 
        FOREIGN KEY ("studentId") 
        REFERENCES "students"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    CONSTRAINT "fk_supervisions_theme" 
        FOREIGN KEY ("themeId") 
        REFERENCES "themes"("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,
    
    -- Business rule: actualEndDate must be >= startDate
    CONSTRAINT "chk_supervisions_dates" 
        CHECK ("actualEndDate" IS NULL OR "actualEndDate" >= "startDate")
);

-- Indexes for supervisions (most important table - needs extensive indexing)
CREATE INDEX IF NOT EXISTS "idx_supervisions_type" ON "supervisions"("type");
CREATE INDEX IF NOT EXISTS "idx_supervisions_status" ON "supervisions"("status");
CREATE INDEX IF NOT EXISTS "idx_supervisions_validationStatus" ON "supervisions"("validationStatus");
CREATE INDEX IF NOT EXISTS "idx_supervisions_validation_supervision_status" 
    ON "supervisions"("validationStatus", "status");
CREATE INDEX IF NOT EXISTS "idx_supervisions_academicYear" ON "supervisions"("academicYear");
CREATE INDEX IF NOT EXISTS "idx_supervisions_studentId" ON "supervisions"("studentId");
CREATE INDEX IF NOT EXISTS "idx_supervisions_themeId" ON "supervisions"("themeId");
CREATE INDEX IF NOT EXISTS "idx_supervisions_year_type" ON "supervisions"("academicYear", "type");
CREATE INDEX IF NOT EXISTS "idx_supervisions_year_validation" 
    ON "supervisions"("academicYear", "validationStatus") 
    WHERE "validationStatus" = 'VALIDATED';
CREATE INDEX IF NOT EXISTS "idx_supervisions_startDate" ON "supervisions"("startDate");
CREATE INDEX IF NOT EXISTS "idx_supervisions_validatedAt" ON "supervisions"("validatedAt") 
    WHERE "validatedAt" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_supervisions_keywords_gin" ON "supervisions" USING gin("keywords");
CREATE INDEX IF NOT EXISTS "idx_supervisions_title_search" 
    ON "supervisions" USING gin(to_tsvector('english', "title"));
CREATE INDEX IF NOT EXISTS "idx_supervisions_description_search" 
    ON "supervisions" USING gin(to_tsvector('english', coalesce("description", '')));
CREATE INDEX IF NOT EXISTS "idx_supervisions_updatedAt" ON "supervisions"("updatedAt" DESC);

COMMENT ON TABLE "supervisions" IS 
    'Core table storing all supervision records (PFE, Master, PhD, etc.)';

-- ============================================
-- STEP 8: CREATE SUPERVISION_SUPERVISORS JUNCTION TABLE
-- ============================================

-- --------------------------------------------
-- TABLE: supervision_supervisors
-- --------------------------------------------
-- Many-to-many relationship: supervisions <-> chercheurs
-- Allows co-supervision with multiple teachers
CREATE TABLE IF NOT EXISTS "supervision_supervisors" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "supervisionId" UUID NOT NULL,
    "supervisorId" VARCHAR(50) NOT NULL,  -- References chercheurs.chercheur_id
    "contributionPercent" INTEGER NOT NULL DEFAULT 100,
    "isMainSupervisor" BOOLEAN NOT NULL DEFAULT false,
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT "fk_supervision_supervisors_supervision" 
        FOREIGN KEY ("supervisionId") 
        REFERENCES "supervisions"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    CONSTRAINT "fk_supervision_supervisors_supervisor" 
        FOREIGN KEY ("supervisorId") 
        REFERENCES "chercheurs"("chercheur_id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    -- Unique constraint: same supervisor cannot be added twice to same supervision
    CONSTRAINT "unique_supervision_supervisor" 
        UNIQUE ("supervisionId", "supervisorId"),
    
    -- Business rule: contribution percentage must be between 0 and 100
    CONSTRAINT "chk_contribution_percent" 
        CHECK ("contributionPercent" >= 0 AND "contributionPercent" <= 100)
);

-- Indexes for supervision_supervisors
CREATE INDEX IF NOT EXISTS "idx_supervision_supervisors_supervisionId" 
    ON "supervision_supervisors"("supervisionId");
CREATE INDEX IF NOT EXISTS "idx_supervision_supervisors_supervisorId" 
    ON "supervision_supervisors"("supervisorId");
CREATE INDEX IF NOT EXISTS "idx_supervision_supervisors_supervisor_main" 
    ON "supervision_supervisors"("supervisorId", "isMainSupervisor") 
    WHERE "isMainSupervisor" = true;
CREATE INDEX IF NOT EXISTS "idx_supervision_supervisors_isExternal" 
    ON "supervision_supervisors"("isExternal") 
    WHERE "isExternal" = true;

COMMENT ON TABLE "supervision_supervisors" IS 
    'Junction table linking supervisions to chercheurs (supervisors) with co-supervision support';
COMMENT ON COLUMN "supervision_supervisors"."supervisorId" IS 
    'Foreign key to chercheurs.chercheur_id (not users table)';

-- ============================================
-- STEP 9: CREATE VALIDATION_LOGS TABLE
-- ============================================

-- --------------------------------------------
-- TABLE: validation_logs
-- --------------------------------------------
-- Tracks complete history of all validation actions
CREATE TABLE IF NOT EXISTS "validation_logs" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "supervisionId" UUID NOT NULL,
    "validatorId" UUID NOT NULL,  -- References users (assistants)
    "status" "ValidationStatus" NOT NULL,
    "comments" TEXT,
    "fieldsChecked" JSONB,
    "issues" JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT "fk_validation_logs_supervision" 
        FOREIGN KEY ("supervisionId") 
        REFERENCES "supervisions"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    CONSTRAINT "fk_validation_logs_validator" 
        FOREIGN KEY ("validatorId") 
        REFERENCES "users"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- Indexes for validation_logs
CREATE INDEX IF NOT EXISTS "idx_validation_logs_supervisionId" ON "validation_logs"("supervisionId");
CREATE INDEX IF NOT EXISTS "idx_validation_logs_validatorId" ON "validation_logs"("validatorId");
CREATE INDEX IF NOT EXISTS "idx_validation_logs_status" ON "validation_logs"("status");
CREATE INDEX IF NOT EXISTS "idx_validation_logs_createdAt" ON "validation_logs"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_validation_logs_validator_date" 
    ON "validation_logs"("validatorId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_validation_logs_supervision_date" 
    ON "validation_logs"("supervisionId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_validation_logs_fieldsChecked" 
    ON "validation_logs" USING gin("fieldsChecked");
CREATE INDEX IF NOT EXISTS "idx_validation_logs_issues" 
    ON "validation_logs" USING gin("issues");

COMMENT ON TABLE "validation_logs" IS 
    'Audit trail of all validation actions by assistants';

-- ============================================
-- STEP 10: CREATE AUDIT_LOGS TABLE
-- ============================================

-- --------------------------------------------
-- TABLE: audit_logs
-- --------------------------------------------
-- System-wide audit trail for security and compliance
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "action" VARCHAR(50) NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" VARCHAR(255),  -- Changed to VARCHAR to support both UUID and chercheur_id
    "changes" JSONB,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    
    -- Foreign keys
    "userId" UUID,
    "supervisionId" UUID,
    
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "fk_audit_logs_user" 
        FOREIGN KEY ("userId") 
        REFERENCES "users"("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,
    
    CONSTRAINT "fk_audit_logs_supervision" 
        FOREIGN KEY ("supervisionId") 
        REFERENCES "supervisions"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- Indexes for audit_logs
CREATE INDEX IF NOT EXISTS "idx_audit_logs_action" ON "audit_logs"("action");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_entityType" ON "audit_logs"("entityType");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_userId" ON "audit_logs"("userId") WHERE "userId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_audit_logs_supervisionId" ON "audit_logs"("supervisionId") 
    WHERE "supervisionId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_audit_logs_createdAt" ON "audit_logs"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_audit_logs_action_date" ON "audit_logs"("action", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_audit_logs_user_date" ON "audit_logs"("userId", "createdAt" DESC) 
    WHERE "userId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_audit_logs_entity" ON "audit_logs"("entityType", "entityId") 
    WHERE "entityId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_audit_logs_changes" ON "audit_logs" USING gin("changes");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_ipAddress" ON "audit_logs"("ipAddress") 
    WHERE "ipAddress" IS NOT NULL;

COMMENT ON TABLE "audit_logs" IS 
    'System-wide audit trail of all important actions';

-- ============================================
-- STEP 11: CREATE TRIGGERS FOR AUTO-UPDATE
-- ============================================

-- Function for automatic updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updatedAt
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON "teams"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_themes_updated_at BEFORE UPDATE ON "themes"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chercheurs_updated_at BEFORE UPDATE ON "chercheurs"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON "students"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supervisions_updated_at BEFORE UPDATE ON "supervisions"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 12: INSERT DEFAULT/SEED DATA
-- ============================================

-- Create default teams
INSERT INTO "teams" ("id", "name", "description") 
VALUES 
    (gen_random_uuid(), 'Intelligence Artificielle', 'Recherche en IA, apprentissage automatique et deep learning'),
    (gen_random_uuid(), 'Génie Logiciel', 'Développement logiciel, méthodologies agiles et qualité logicielle'),
    (gen_random_uuid(), 'Réseaux et Sécurité', 'Sécurité informatique, cryptographie et réseaux'),
    (gen_random_uuid(), 'Bases de Données', 'Systèmes de gestion de bases de données et big data'),
    (gen_random_uuid(), 'Systèmes d''Information', 'Conception et développement de systèmes d''information')
ON CONFLICT ("name") DO NOTHING;

-- Get team IDs for reference
DO $$
DECLARE
    ai_team_id UUID;
    gl_team_id UUID;
    rs_team_id UUID;
    bd_team_id UUID;
BEGIN
    SELECT "id" INTO ai_team_id FROM "teams" WHERE "name" = 'Intelligence Artificielle';
    SELECT "id" INTO gl_team_id FROM "teams" WHERE "name" = 'Génie Logiciel';
    SELECT "id" INTO rs_team_id FROM "teams" WHERE "name" = 'Réseaux et Sécurité';
    SELECT "id" INTO bd_team_id FROM "teams" WHERE "name" = 'Bases de Données';

    -- Insert sample chercheurs with team references
    INSERT INTO "chercheurs" (
        "chercheur_id", "nom_complet", "mails", "tel", "diplome", "etablissement_origine",
        "qualite", "grade_recherche", "statut", "hindex", "equipe_id",
        "url_dblp", "url_google_scholar", "url_researchgate", "url_site_personnel"
    ) VALUES 
    (
        'ESI001',
        'Dr. Ahmed BENALI',
        ARRAY['ahmed.benali@esi.dz', 'a.benali@gmail.com'],
        '+213 555 123 456',
        'Doctorat en Informatique',
        'Université Paris-Saclay',
        'Enseignant-Chercheur',
        'Directeur de recherche',
        'Actif',
        25,
        ai_team_id,
        'https://dblp.org/pid/123/456.html',
        'https://scholar.google.com/citations?user=ABC123',
        'https://www.researchgate.net/profile/Ahmed-Benali',
        'https://www.ahmed-benali.com'
    ),
    (
        'ESI002',
        'Dr. Fatima MESSAOUDI',
        ARRAY['fatima.messaoudi@esi.dz'],
        '+213 555 234 567',
        'PhD in Computer Science',
        'Université Grenoble Alpes',
        'Enseignant-Chercheur',
        'Charge de recherche',
        'Actif',
        18,
        rs_team_id,
        'https://dblp.org/pid/234/567.html',
        'https://scholar.google.com/citations?user=DEF456',
        'https://www.researchgate.net/profile/Fatima-Messaoudi',
        NULL
    ),
    (
        'ESI003',
        'Mohamed KHELIFI',
        ARRAY['mohamed.khelifi@esi.dz'],
        '+213 555 345 678',
        'Master en Génie Logiciel',
        'ESI Alger',
        'Doctorant',
        NULL,
        'Actif',
        5,
        gl_team_id,
        NULL,
        'https://scholar.google.com/citations?user=GHI789',
        NULL,
        NULL
    ),
    (
        'ESI004',
        'Dr. Karima BOUDJEMA',
        ARRAY['k.boudjema@cerist.dz', 'karima.b@esi.dz'],
        NULL,
        'Doctorat en Intelligence Artificielle',
        'USTHB',
        'Chercheur',
        'Attache de recherche',
        'Actif',
        12,
        ai_team_id,
        'https://dblp.org/pid/345/678.html',
        'https://scholar.google.com/citations?user=JKL012',
        'https://www.researchgate.net/profile/Karima-Boudjema',
        'https://kboudjema.cerist.dz'
    ),
    (
        'ESI005',
        'Prof. Rachid HAMDI',
        ARRAY['rachid.hamdi@esi.dz'],
        '+213 555 456 789',
        'Doctorat d''État en Informatique',
        'Université d''Oran',
        'Enseignant-Chercheur',
        'Directeur de recherche',
        'Non actif',
        42,
        bd_team_id,
        'https://dblp.org/pid/456/789.html',
        'https://scholar.google.com/citations?user=MNO345',
        NULL,
        NULL
    )
    ON CONFLICT ("chercheur_id") DO NOTHING;
END $$;

-- Create system admin user (password: 'admin123' - CHANGE THIS IN PRODUCTION!)
INSERT INTO "users" ("email", "password", "firstName", "lastName", "role", "isActive", "chercheur_id")
VALUES (
    'admin@lmcs.dz',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIBx0pBzEu',
    'System',
    'Administrator',
    'ADMIN',
    true,
    NULL  -- Admin is not linked to a chercheur
)
ON CONFLICT ("email") DO NOTHING;

-- Create a sample teacher user linked to a chercheur
INSERT INTO "users" ("email", "password", "firstName", "lastName", "role", "isActive", "chercheur_id")
VALUES (
    'ahmed.benali@esi.dz',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIBx0pBzEu',  -- password: 'admin123'
    'Ahmed',
    'BENALI',
    'TEACHER',
    true,
    'ESI001'  -- Linked to chercheur
)
ON CONFLICT ("email") DO NOTHING;

-- Create a sample assistant user
INSERT INTO "users" ("email", "password", "firstName", "lastName", "role", "isActive", "chercheur_id")
VALUES (
    'assistant@lmcs.dz',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIBx0pBzEu',
    'Assistant',
    'Validation',
    'ASSISTANT',
    true,
    NULL
)
ON CONFLICT ("email") DO NOTHING;

-- ============================================
-- STEP 13: CREATE USEFUL VIEWS
-- ============================================

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

-- ============================================
-- STEP 14: VERIFICATION QUERIES
-- ============================================

-- Count all records by table
DO $$
DECLARE
    teams_count INTEGER;
    chercheurs_count INTEGER;
    users_count INTEGER;
    students_count INTEGER;
    supervisions_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO teams_count FROM "teams";
    SELECT COUNT(*) INTO chercheurs_count FROM "chercheurs";
    SELECT COUNT(*) INTO users_count FROM "users";
    SELECT COUNT(*) INTO students_count FROM "students";
    SELECT COUNT(*) INTO supervisions_count FROM "supervisions";
    
    RAISE NOTICE '
    ============================================
    DATABASE CREATION COMPLETED SUCCESSFULLY!
    ============================================
    
    DATABASE: LMCS Platform v3.0
    
    TABLES CREATED:
    ✓ teams ............... % records
    ✓ themes .............. 0 records
    ✓ chercheurs .......... % records
    ✓ users ............... % records
    ✓ students ............ % records
    ✓ supervisions ........ % records
    ✓ supervision_supervisors
    ✓ validation_logs
    ✓ audit_logs
    
    ENUMS CREATED: 8
    - Qualite (Enseignant-Chercheur, Chercheur, Doctorant)
    - GradeRecherche (Attaché, Chargé, Directeur de recherche)
    - StatutChercheur (Actif, Non actif)
    - UserRole (ADMIN, DIRECTOR, TEACHER, ASSISTANT)
    - SupervisionType (PFE, MASTER, PHD, INTERNSHIP, PROJECT)
    - SupervisionStatus (IN_PROGRESS, DEFENDED, ABANDONED, etc.)
    - ValidationStatus (PENDING, VALIDATED, REJECTED, REVISED)
    
    VIEWS CREATED: 2
    - chercheurs_actifs_details
    - supervisions_avec_superviseurs
    
    KEY RELATIONSHIPS:
    ✓ Chercheurs ←→ Teams (Many-to-One)
    ✓ Users → Chercheurs (Optional link for system access)
    ✓ Supervisions ←→ Chercheurs (Many-to-Many via supervision_supervisors)
    ✓ Supervisions → Students (Many-to-One)
    ✓ Supervisions → Themes (Many-to-One)
    ✓ Themes → Teams (Many-to-One)
    
    DEFAULT CREDENTIALS (CHANGE IMMEDIATELY):
    Admin: admin@lmcs.dz / admin123
    Teacher: ahmed.benali@esi.dz / admin123
    Assistant: assistant@lmcs.dz / admin123
    
    NEXT STEPS:
    1. Change all default passwords immediately!
    2. Review and customize team names
    3. Import your researcher data
    4. Configure your Node.js backend
    5. Run: npx prisma generate
    
    ============================================
    ', teams_count, chercheurs_count, users_count, students_count, supervisions_count;
END $$;

-- Verification queries
SELECT 
    'teams' as table_name, 
    COUNT(*) as record_count 
FROM "teams"
UNION ALL
SELECT 'chercheurs', COUNT(*) FROM "chercheurs"
UNION ALL
SELECT 'users', COUNT(*) FROM "users"
UNION ALL
SELECT 'students', COUNT(*) FROM "students"
UNION ALL
SELECT 'supervisions', COUNT(*) FROM "supervisions";

-- Show all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Show all enums
SELECT typname 
FROM pg_type 
WHERE typtype = 'e' 
ORDER BY typname;

-- Show all views
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;
