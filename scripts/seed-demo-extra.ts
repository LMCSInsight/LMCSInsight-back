/**
 * Optional extra demo rows (idempotent by email / title+student).
 * Requires DATABASE_URL. Run after `npm run db:seed` or whenever chercheurs MAT001–MAT004 exist.
 */
import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is not set')

const adapter = new PrismaPg({ connectionString: databaseUrl })
const prisma = new PrismaClient({ adapter })

const DEMO_EMAIL = (n: number) =>
  `demo.extra.${String(n).padStart(2, '0')}@lmcs.dz`

async function main() {
  for (const id of ['MAT001', 'MAT002', 'MAT003', 'MAT004'] as const) {
    const exists = await prisma.chercheur.findUnique({
      where: { chercheur_id: id },
    })
    if (!exists) {
      throw new Error(
        `Missing chercheur ${id}. Run "npm run db:seed" first to create chercheurs.`,
      )
    }
  }

  const studentRows = [
    {
      firstName: 'Hocine',
      lastName: 'Bensaïd',
      email: DEMO_EMAIL(1),
      institution: 'ESI' as const,
      level: 'MASTER' as const,
      specialty: 'SIL' as const,
    },
    {
      firstName: 'Leïla',
      lastName: 'Mokrani',
      email: DEMO_EMAIL(2),
      institution: 'ESI' as const,
      level: 'MASTER' as const,
      specialty: 'SID' as const,
    },
    {
      firstName: 'Djamel',
      lastName: 'Rezki',
      email: DEMO_EMAIL(3),
      institution: 'ESI' as const,
      level: 'DOCTORANT' as const,
      specialty: 'SIT' as const,
    },
    {
      firstName: 'Samira',
      lastName: 'Kadi',
      email: DEMO_EMAIL(4),
      institution: 'ESI' as const,
      level: 'MASTER' as const,
      specialty: 'SIQ' as const,
    },
    {
      firstName: 'Omar',
      lastName: 'Touati',
      email: DEMO_EMAIL(5),
      institution: 'EXTERNE' as const,
      level: 'MASTER' as const,
      specialty: 'SIL' as const,
    },
    {
      firstName: 'Karima',
      lastName: 'Selmani',
      email: DEMO_EMAIL(6),
      institution: 'EXTERNE' as const,
      level: 'DOCTORANT' as const,
      specialty: 'SID' as const,
    },
    {
      firstName: 'Mehdi',
      lastName: 'Zerrouki',
      email: DEMO_EMAIL(7),
      institution: 'ESI' as const,
      level: 'MASTER' as const,
      specialty: 'SIT' as const,
    },
    {
      firstName: 'Imane',
      lastName: 'Bouaziz',
      email: DEMO_EMAIL(8),
      institution: 'ESI' as const,
      level: 'DOCTORANT' as const,
      specialty: 'SIL' as const,
    },
    {
      firstName: 'Tarek',
      lastName: 'Hamidi',
      email: DEMO_EMAIL(9),
      institution: 'ESI' as const,
      level: 'MASTER' as const,
      specialty: 'SID' as const,
    },
    {
      firstName: 'Salima',
      lastName: 'Ouahrani',
      email: DEMO_EMAIL(10),
      institution: 'ESI' as const,
      level: 'MASTER' as const,
      specialty: 'SIQ' as const,
    },
  ]

  const students: { id: string; firstName: string }[] = []
  for (const s of studentRows) {
    const row = await prisma.student.upsert({
      where: { email: s.email },
      update: s,
      create: s,
    })
    students.push({ id: row.id, firstName: s.firstName })
  }

  const sid = (firstName: string) => {
    const x = students.find((s) => s.firstName === firstName)
    if (!x) throw new Error(`Unknown demo student: ${firstName}`)
    return x.id
  }

  type Sup = {
    title: string
    type: 'PFE' | 'MASTER' | 'PHD' | 'INTERNSHIP' | 'PROJECT'
    description?: string
    status: 'IN_PROGRESS' | 'DEFENDED' | 'ABANDONED' | 'EXTENSION' | 'SUSPENDED'
    validationStatus: 'PENDING' | 'VALIDATED' | 'REJECTED' | 'REVISED'
    academicYear: string
    startDate: Date
    expectedEndDate?: Date
    actualEndDate?: Date
    keywords: string[]
    studentFirstName: string
    mainSupervisorId: string
    coSupervisorId?: string
  }

  const supervisionsData: Sup[] = [
    {
      title: '[Démo+] Orchestration Kubernetes pour charges ML distribuées',
      type: 'MASTER',
      description: 'Déploiement et monitoring de pipelines ML sur cluster K8s.',
      status: 'IN_PROGRESS',
      validationStatus: 'PENDING',
      academicYear: '2025-2026',
      startDate: new Date('2025-10-01'),
      expectedEndDate: new Date('2026-06-30'),
      keywords: ['Kubernetes', 'ML', 'MLOps'],
      studentFirstName: 'Hocine',
      mainSupervisorId: 'MAT001',
    },
    {
      title: '[Démo+] Privacy-preserving federated learning en santé',
      type: 'PHD',
      status: 'IN_PROGRESS',
      validationStatus: 'VALIDATED',
      academicYear: '2024-2025',
      startDate: new Date('2023-09-01'),
      expectedEndDate: new Date('2026-09-30'),
      keywords: ['federated learning', 'privacy', 'santé'],
      studentFirstName: 'Djamel',
      mainSupervisorId: 'MAT001',
      coSupervisorId: 'MAT004',
    },
    {
      title: '[Démo+] PFE — Portail interne de réservation des salles LMCS',
      type: 'PFE',
      status: 'IN_PROGRESS',
      validationStatus: 'PENDING',
      academicYear: '2025-2026',
      startDate: new Date('2026-02-01'),
      expectedEndDate: new Date('2026-06-30'),
      keywords: ['PFE', 'planning', 'React'],
      studentFirstName: 'Leïla',
      mainSupervisorId: 'MAT002',
    },
    {
      title:
        '[Démo+] Analyse forensique de logs Windows avec graphes de dépendances',
      type: 'MASTER',
      status: 'DEFENDED',
      validationStatus: 'VALIDATED',
      academicYear: '2024-2025',
      startDate: new Date('2024-10-01'),
      expectedEndDate: new Date('2025-06-30'),
      actualEndDate: new Date('2025-06-10'),
      keywords: ['forensic', 'logs', 'graphe'],
      studentFirstName: 'Samira',
      mainSupervisorId: 'MAT003',
    },
    {
      title:
        '[Démo+] Recommandation de parcours académiques par apprentissage par renforcement',
      type: 'MASTER',
      status: 'IN_PROGRESS',
      validationStatus: 'VALIDATED',
      academicYear: '2025-2026',
      startDate: new Date('2025-10-01'),
      expectedEndDate: new Date('2026-06-30'),
      keywords: ['RL', 'recommandation', 'parcours'],
      studentFirstName: 'Omar',
      mainSupervisorId: 'MAT001',
    },
    {
      title:
        '[Démo+] Doctorat — Modèles foundation pour le traitement du darija écrit',
      type: 'PHD',
      status: 'IN_PROGRESS',
      validationStatus: 'PENDING',
      academicYear: '2025-2026',
      startDate: new Date('2024-09-01'),
      expectedEndDate: new Date('2027-09-30'),
      keywords: ['darija', 'LLM', 'NLP'],
      studentFirstName: 'Karima',
      mainSupervisorId: 'MAT002',
      coSupervisorId: 'MAT001',
    },
    {
      title:
        '[Démo+] Stage — Automatisation des rapports de validation ASSISTANT',
      type: 'INTERNSHIP',
      status: 'IN_PROGRESS',
      validationStatus: 'PENDING',
      academicYear: '2025-2026',
      startDate: new Date('2026-01-15'),
      expectedEndDate: new Date('2026-04-30'),
      keywords: ['stage', 'reporting', 'automation'],
      studentFirstName: 'Mehdi',
      mainSupervisorId: 'MAT003',
    },
    {
      title:
        '[Démo+] Projet — Cartographie interactive des collaborations recherche LMCS',
      type: 'PROJECT',
      status: 'IN_PROGRESS',
      validationStatus: 'VALIDATED',
      academicYear: '2025-2026',
      startDate: new Date('2025-11-01'),
      expectedEndDate: new Date('2026-05-31'),
      keywords: ['visualisation', 'graphe', 'collaboration'],
      studentFirstName: 'Imane',
      mainSupervisorId: 'MAT004',
    },
    {
      title:
        '[Démo+] Sécurisation des pipelines CI/CD pour artefacts sensibles',
      type: 'MASTER',
      status: 'EXTENSION',
      validationStatus: 'VALIDATED',
      academicYear: '2024-2025',
      startDate: new Date('2024-10-01'),
      expectedEndDate: new Date('2025-08-31'),
      keywords: ['CI/CD', 'secrets', 'DevSecOps'],
      studentFirstName: 'Tarek',
      mainSupervisorId: 'MAT001',
    },
    {
      title:
        '[Démo+] Abandon documenté — Plateforme blockchain pour diplômes (pivot produit)',
      type: 'MASTER',
      status: 'ABANDONED',
      validationStatus: 'REJECTED',
      academicYear: '2024-2025',
      startDate: new Date('2024-10-01'),
      expectedEndDate: new Date('2025-06-30'),
      keywords: ['blockchain', 'diplôme', 'abandon'],
      studentFirstName: 'Salima',
      mainSupervisorId: 'MAT002',
    },
  ]

  for (const sup of supervisionsData) {
    const { studentFirstName, mainSupervisorId, coSupervisorId, ...rest } = sup
    const studentId = sid(studentFirstName)

    const existing = await prisma.supervision.findFirst({
      where: { title: rest.title, studentId },
    })

    let supervisionId: string
    if (existing) {
      await prisma.supervision.update({
        where: { id: existing.id },
        data: { ...rest, studentId },
      })
      supervisionId = existing.id
    } else {
      const created = await prisma.supervision.create({
        data: { ...rest, studentId },
      })
      supervisionId = created.id
    }

    await prisma.supervisionSupervisor.upsert({
      where: {
        supervisionId_supervisorId: {
          supervisionId,
          supervisorId: mainSupervisorId,
        },
      },
      update: {
        isMainSupervisor: true,
        contributionPercent: coSupervisorId ? 70 : 100,
      },
      create: {
        supervisionId,
        supervisorId: mainSupervisorId,
        isMainSupervisor: true,
        contributionPercent: coSupervisorId ? 70 : 100,
      },
    })

    if (coSupervisorId) {
      await prisma.supervisionSupervisor.upsert({
        where: {
          supervisionId_supervisorId: {
            supervisionId,
            supervisorId: coSupervisorId,
          },
        },
        update: { isMainSupervisor: false, contributionPercent: 30 },
        create: {
          supervisionId,
          supervisorId: coSupervisorId,
          isMainSupervisor: false,
          contributionPercent: 30,
        },
      })
    }
  }

  console.log('✓ Demo extra seed:')
  console.log(`  • ${studentRows.length} students (${DEMO_EMAIL(1)} …)`)
  console.log(`  • ${supervisionsData.length} supervisions`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
