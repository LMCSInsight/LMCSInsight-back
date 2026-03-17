# LMCS PLATFORM - COMPLETE DATABASE DOCUMENTATION
## Version 3.0 - Chercheur Integration

---

## 🎯 Overview

This document describes the complete, integrated database architecture for the LMCS Supervision Tracking Platform. Version 3.0 introduces the **Chercheur** table as the central researcher profile system, properly integrated with the supervision tracking workflow.

---

## 📊 Architecture Overview

### Three-Tier Structure

```
┌─────────────────────────────────────────────┐
│           RESEARCHER LAYER                  │
│  ┌───────────────────────────────────┐     │
│  │       CHERCHEUR TABLE             │     │
│  │  (Central Researcher Profiles)    │     │
│  └───────────────────────────────────┘     │
│              ↓                              │
├─────────────────────────────────────────────┤
│         SUPERVISION LAYER                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │Supervisions│ │ Students │  │ Themes  │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│              ↓                              │
├─────────────────────────────────────────────┤
│         SYSTEM LAYER                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  Users   │  │Validation│  │  Audit   │  │
│  │ (Auth)   │  │   Logs   │  │   Logs   │  │
│  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────┘
```

---

## 🗂️ Complete Table Structure

### Core Tables (11 Total)

1. **teams** - Research teams (5 default teams)
2. **themes** - Research themes/domains
3. **chercheurs** - Central researcher profiles ⭐ NEW
4. **users** - System authentication and access control
5. **students** - Students being supervised
6. **supervisions** - Supervision records (PFE, Master, PhD, etc.)
7. **supervision_supervisors** - Junction table (supervisions ↔ chercheurs)
8. **validation_logs** - Validation history tracking
9. **audit_logs** - System-wide audit trail

### Views (2)
10. **chercheurs_actifs_details** - Active researchers with team info
11. **supervisions_avec_superviseurs** - Supervisions with full supervisor details

---

## 🔗 Key Relationships Explained

### 1. Chercheur ↔ Team Relationship

**Type:** Many-to-One  
**Foreign Key:** `chercheurs.equipe_id → teams.id`

```sql
-- A chercheur belongs to one team
-- A team can have many chercheurs
```

**Why this design:**
- Researchers belong to specific research teams
- Team assignment is optional (NULL allowed for flexibility)
- Cascading: If team is deleted, chercheur.equipe_id becomes NULL (preserves historical data)

### 2. User ↔ Chercheur Relationship

**Type:** Many-to-One (Optional Link)  
**Foreign Key:** `users.chercheur_id → chercheurs.chercheur_id`

```sql
-- A user MAY be linked to a chercheur profile
-- A chercheur MAY have multiple system user accounts (rare)
```

**Why this design:**
- **Separation of concerns**: Chercheur = academic profile, User = system access
- Not all chercheurs need system access (e.g., external collaborators)
- Not all users are chercheurs (e.g., administrators, assistants)
- **Example use case:**
  - Dr. Ahmed BENALI exists in `chercheurs` table with his academic profile
  - He also has a `users` account for logging into the system
  - His user account links to his chercheur profile via `chercheur_id = 'ESI001'`

### 3. Supervision ↔ Chercheur Relationship

**Type:** Many-to-Many  
**Junction Table:** `supervision_supervisors`  
**Foreign Keys:**
- `supervision_supervisors.supervisionId → supervisions.id`
- `supervision_supervisors.supervisorId → chercheurs.chercheur_id`

```sql
-- A supervision can have multiple supervisors (co-supervision)
-- A chercheur can supervise multiple supervisions
```

**Why this design:**
- Supports co-supervision (multiple professors working together)
- Tracks contribution percentage for each supervisor
- Distinguishes main supervisor vs co-supervisors
- Handles external supervisors from other institutions

**Important Note:** Supervisors are **chercheurs**, not users. This correctly models the academic relationship.

### 4. Supervision → Student Relationship

**Type:** Many-to-One  
**Foreign Key:** `supervisions.studentId → students.id`

```sql
-- Each supervision has exactly one student
-- A student can have multiple supervisions over time
```

**Why this design:**
- One student per supervision (standard academic model)
- Students can pursue multiple degrees (e.g., Master then PhD)
- Cascading delete: If student is deleted, their supervisions are also deleted

---

## 🆕 What Changed in Version 3.0

### Before (v2.0) vs After (v3.0)

#### **Before:**
```
supervisions ↔ users (via supervision_supervisors)
```
- Supervisors were system users
- Mixed academic and system concerns
- Limited researcher information

#### **After:**
```
supervisions ↔ chercheurs (via supervision_supervisors)
users → chercheurs (optional link)
```
- Supervisors are chercheurs (academic profiles)
- Clear separation: academic vs system access
- Rich researcher information (h-index, publications, etc.)

### Migration Impact

**Breaking Changes:**
- `supervision_supervisors.supervisorId` now references `chercheurs.chercheur_id` instead of `users.id`
- Type changed from UUID to VARCHAR(50) to match ESI matricule format

**Non-Breaking:**
- All existing tables remain
- Users table still exists (for authentication)
- New optional link `users.chercheur_id` connects the two systems

---

## 📋 Database Schema Details

### Complete Table: chercheurs

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| chercheur_id | VARCHAR(50) | PRIMARY KEY | ESI Matricule (e.g., "ESI001") |
| nom_complet | VARCHAR(255) | NOT NULL | Full name |
| mails | TEXT[] | NOT NULL | Email addresses (array) |
| tel | VARCHAR(20) | NULLABLE | Phone number |
| diplome | VARCHAR(255) | NULLABLE | Highest degree |
| etablissement_origine | VARCHAR(255) | NULLABLE | Origin institution |
| qualite | ENUM | NOT NULL | Enseignant-Chercheur / Chercheur / Doctorant |
| grade_recherche | ENUM | NULLABLE | Attaché / Chargé / Directeur de recherche |
| statut | ENUM | DEFAULT 'Actif' | Actif / Non actif |
| hindex | INTEGER | DEFAULT 0, ≥0 | Research impact metric |
| equipe_id | UUID | FK → teams | Team assignment |
| url_dblp | VARCHAR(500) | NULLABLE | DBLP profile |
| url_google_scholar | VARCHAR(500) | NULLABLE | Google Scholar |
| url_researchgate | VARCHAR(500) | NULLABLE | ResearchGate |
| url_site_personnel | VARCHAR(500) | NULLABLE | Personal website |
| createdAt | TIMESTAMP | AUTO | Record creation |
| updatedAt | TIMESTAMP | AUTO | Last modification |

**Business Rules:**
1. If `qualite = 'Doctorant'`, then `grade_recherche` must be NULL
2. `hindex` cannot be negative
3. At least one email required in `mails` array
4. `updatedAt` automatically updates on modification

### Junction Table: supervision_supervisors

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | UUID | PRIMARY KEY | Unique identifier |
| supervisionId | UUID | FK → supervisions | Which supervision |
| supervisorId | VARCHAR(50) | FK → chercheurs | Which chercheur (NOT user) |
| contributionPercent | INTEGER | 0-100 | Supervision contribution |
| isMainSupervisor | BOOLEAN | DEFAULT false | Main vs co-supervisor |
| isExternal | BOOLEAN | DEFAULT false | External institution |
| createdAt | TIMESTAMP | AUTO | When assigned |

**Unique Constraint:** (supervisionId, supervisorId) - Same chercheur can't be added twice

---

## 🔍 Common Query Patterns

### 1. Get All Supervisions for a Chercheur

```sql
SELECT 
    s.id,
    s.title,
    s.type,
    s.status,
    st.firstName || ' ' || st.lastName as student_name,
    ss.contributionPercent,
    ss.isMainSupervisor
FROM supervisions s
JOIN supervision_supervisors ss ON s.id = ss.supervisionId
JOIN students st ON s.studentId = st.id
WHERE ss.supervisorId = 'ESI001'
ORDER BY s.startDate DESC;
```

**Prisma equivalent:**
```javascript
const supervisions = await prisma.supervision.findMany({
  where: {
    supervisors: {
      some: {
        supervisorId: 'ESI001'
      }
    }
  },
  include: {
    student: true,
    supervisors: {
      include: {
        supervisor: true
      }
    }
  }
});
```

### 2. Get Chercheur Profile with System User Account

```sql
SELECT 
    c.chercheur_id,
    c.nom_complet,
    c.qualite,
    c.grade_recherche,
    c.hindex,
    t.name as team_name,
    u.email as system_email,
    u.role as system_role
FROM chercheurs c
LEFT JOIN teams t ON c.equipe_id = t.id
LEFT JOIN users u ON c.chercheur_id = u.chercheur_id
WHERE c.chercheur_id = 'ESI001';
```

**Prisma equivalent:**
```javascript
const chercheur = await prisma.chercheur.findUnique({
  where: { chercheur_id: 'ESI001' },
  include: {
    team: true,
    users: true  // All linked system accounts
  }
});
```

### 3. Get Active Researchers by Team with Supervision Count

```sql
SELECT 
    t.name as team_name,
    c.chercheur_id,
    c.nom_complet,
    c.hindex,
    COUNT(DISTINCT ss.supervisionId) as total_supervisions
FROM chercheurs c
JOIN teams t ON c.equipe_id = t.id
LEFT JOIN supervision_supervisors ss ON c.chercheur_id = ss.supervisorId
WHERE c.statut = 'Actif'
GROUP BY t.name, c.chercheur_id, c.nom_complet, c.hindex
ORDER BY t.name, c.hindex DESC;
```

### 4. Find Supervisions with Co-Supervision

```sql
SELECT 
    s.id,
    s.title,
    s.type,
    array_agg(
        c.nom_complet || ' (' || ss.contributionPercent || '%)'
    ) as supervisors
FROM supervisions s
JOIN supervision_supervisors ss ON s.id = ss.supervisionId
JOIN chercheurs c ON ss.supervisorId = c.chercheur_id
GROUP BY s.id, s.title, s.type
HAVING COUNT(ss.id) > 1  -- More than one supervisor
ORDER BY s.startDate DESC;
```

### 5. Validation Queue for Assistants

```sql
SELECT 
    s.id,
    s.title,
    s.type,
    s.createdAt,
    st.firstName || ' ' || st.lastName as student_name,
    string_agg(c.nom_complet, ', ') as supervisors
FROM supervisions s
JOIN students st ON s.studentId = st.id
JOIN supervision_supervisors ss ON s.id = ss.supervisionId
JOIN chercheurs c ON ss.supervisorId = c.chercheur_id
WHERE s.validationStatus = 'PENDING'
GROUP BY s.id, s.title, s.type, s.createdAt, st.firstName, st.lastName
ORDER BY s.createdAt ASC;
```

---

## 🚀 Setup Instructions

### Step 1: Create Database

```bash
createdb lmcs_platform
# OR in PostgreSQL:
# CREATE DATABASE lmcs_platform;
```

### Step 2: Run SQL Script

```bash
psql -U postgres -d lmcs_platform -f create_complete_database.sql
```

**OR in pgAdmin:**
1. Right-click database → Query Tool
2. Open `create_complete_database.sql`
3. Execute (F5)

### Step 3: Configure Node.js Backend

Create `.env` file:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/lmcs_platform"
```

### Step 4: Generate Prisma Client

```bash
# Place complete_prisma_schema.prisma in prisma/schema.prisma
npx prisma generate
```

### Step 5: Verify Installation

```bash
npx prisma studio
# Opens browser interface to view/edit data
```

---

## 📊 Sample Data Included

The SQL script automatically creates:

### Teams (5)
- Intelligence Artificielle
- Génie Logiciel
- Réseaux et Sécurité
- Bases de Données
- Systèmes d'Information

### Chercheurs (5)
- **ESI001** - Dr. Ahmed BENALI (Enseignant-Chercheur, Directeur, AI team, h-index: 25)
- **ESI002** - Dr. Fatima MESSAOUDI (Enseignant-Chercheur, Chargé, Security team, h-index: 18)
- **ESI003** - Mohamed KHELIFI (Doctorant, Software Eng. team, h-index: 5)
- **ESI004** - Dr. Karima BOUDJEMA (Chercheur, Attaché, AI team, h-index: 12)
- **ESI005** - Prof. Rachid HAMDI (Inactive, Database team, h-index: 42)

### Users (3)
- **admin@lmcs.dz** - System Administrator (no chercheur link)
- **ahmed.benali@esi.dz** - Teacher (linked to ESI001)
- **assistant@lmcs.dz** - Validation Assistant (no chercheur link)

**All passwords:** `admin123` (⚠️ CHANGE IN PRODUCTION!)

---

## 🔐 Security Considerations

### User vs Chercheur Access

**Public Data (Chercheur):**
- Name, qualité, grade
- H-index, team
- Academic URLs (DBLP, Scholar)

**Private Data (Chercheur):**
- Email addresses
- Phone number
- Personal website

**System Data (User):**
- Login credentials
- System role
- Session information

### Recommended Access Control

```javascript
// Public researcher profile (no authentication)
router.get('/api/chercheurs/:id/public', async (req, res) => {
  const profile = await prisma.chercheur.findUnique({
    where: { chercheur_id: req.params.id },
    select: {
      chercheur_id: true,
      nom_complet: true,
      qualite: true,
      grade_recherche: true,
      hindex: true,
      url_dblp: true,
      url_google_scholar: true,
      url_researchgate: true,
      team: { select: { name: true } }
    }
  });
  res.json(profile);
});

// Full profile (authenticated users only)
router.get('/api/chercheurs/:id', authMiddleware, async (req, res) => {
  const profile = await prisma.chercheur.findUnique({
    where: { chercheur_id: req.params.id },
    include: {
      team: true,
      users: true,
      supervision_supervisors: {
        include: {
          supervision: {
            include: {
              student: true
            }
          }
        }
      }
    }
  });
  res.json(profile);
});
```

---

## 📈 Performance Optimization

### Strategic Indexes

**Chercheur Table (7 indexes):**
1. Name search
2. Qualité filter
3. Status filter
4. Team assignment
5. Compound (qualité + status)
6. H-index ranking (DESC)
7. Email array (GIN)

**Supervision Table (15 indexes):**
- Type, status, validation status
- Academic year, dates
- Keywords (GIN), full-text search
- Foreign keys
- Compound indexes for common reports

**Junction Table (4 indexes):**
- Both foreign keys
- Compound (supervisor + main flag)
- External supervisor filter

### Query Performance Tips

```javascript
// ❌ BAD: N+1 query problem
const supervisions = await prisma.supervision.findMany();
for (const s of supervisions) {
  const supervisors = await prisma.supervisionSupervisor.findMany({
    where: { supervisionId: s.id }
  });
}

// ✅ GOOD: Single query with include
const supervisions = await prisma.supervision.findMany({
  include: {
    supervisors: {
      include: {
        supervisor: true
      }
    }
  }
});
```

---

## 🔄 Migration from Version 2.0 to 3.0

If you have existing data from version 2.0:

### Step 1: Backup Current Database

```bash
pg_dump lmcs_supervisions > backup_v2.sql
```

### Step 2: Create Migration Script

```sql
-- 1. Create chercheurs table and migrate users
INSERT INTO chercheurs (
  chercheur_id, nom_complet, mails, tel, qualite, statut, equipe_id
)
SELECT 
  'ESI' || LPAD(ROW_NUMBER() OVER (ORDER BY createdAt)::TEXT, 3, '0'),
  firstName || ' ' || lastName,
  ARRAY[email],
  phoneNumber,
  CASE role
    WHEN 'TEACHER' THEN 'Enseignant-Chercheur'
    WHEN 'DIRECTOR' THEN 'Enseignant-Chercheur'
    ELSE 'Chercheur'
  END::Qualite,
  'Actif'::StatutChercheur,
  teamId
FROM users
WHERE role IN ('TEACHER', 'DIRECTOR');

-- 2. Update supervision_supervisors to reference chercheurs
-- This requires manual mapping of user IDs to chercheur_ids
```

### Step 3: Verify Data Integrity

```sql
-- Check that all supervisors exist
SELECT ss.supervisorId
FROM supervision_supervisors ss
LEFT JOIN chercheurs c ON ss.supervisorId = c.chercheur_id
WHERE c.chercheur_id IS NULL;
-- Should return 0 rows
```

---

## ✅ Validation Checklist

Before going to production:

- [ ] All default passwords changed
- [ ] Team names match your laboratory structure
- [ ] Chercheurs imported from existing data
- [ ] User accounts created and linked to chercheurs
- [ ] Sample supervisions created for testing
- [ ] Validation workflow tested (PENDING → VALIDATED flow)
- [ ] All API endpoints tested
- [ ] Frontend connected and working
- [ ] Backup strategy implemented
- [ ] Access control verified
- [ ] Performance tested with realistic data volume

---

## 📞 Support & Documentation

**Key Files:**
- `create_complete_database.sql` - Full SQL script
- `complete_prisma_schema.prisma` - Prisma ORM schema
- This document - Integration guide

**Next Steps:**
1. Review and customize team structure
2. Import your researcher data
3. Set up authentication system
4. Build API endpoints
5. Create frontend interface

---

**Version:** 3.0  
**Last Updated:** March 2026  
**Database:** PostgreSQL 15+  
**Status:** Production Ready ✅
