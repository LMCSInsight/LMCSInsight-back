import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set')
}

const adapter = new PrismaPg({ connectionString: databaseUrl })
const prisma = new PrismaClient({ adapter })

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 12)

  // Ensure the linked chercheur exists for researcher-scoped tests.
  await prisma.chercheur.upsert({
    where: { chercheur_id: 'MAT001' },
    update: {
      nom_complet: 'Pr. Abderrahim Laribi',
      mails: ['researcher@lmcs.dz', 'a.laribi@esi.dz'],
      qualite: 'Enseignant_Chercheur',
      grade_recherche: 'Directeur_de_recherche',
      hindex: 14,
    },
    create: {
      chercheur_id: 'MAT001',
      nom_complet: 'Pr. Abderrahim Laribi',
      mails: ['researcher@lmcs.dz', 'a.laribi@esi.dz'],
      qualite: 'Enseignant_Chercheur',
      grade_recherche: 'Directeur_de_recherche',
      hindex: 14,
    },
  })

  const researcher = await prisma.user.upsert({
    where: { email: 'researcher@lmcs.dz' },
    update: {
      password: hashedPassword,
      firstName: 'Abderrahim',
      lastName: 'Laribi',
      role: 'RESEARCHER',
      chercheur_id: 'MAT001',
      isActive: true,
    },
    create: {
      firstName: 'Abderrahim',
      lastName: 'Laribi',
      email: 'researcher@lmcs.dz',
      password: hashedPassword,
      role: 'RESEARCHER',
      chercheur_id: 'MAT001',
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true,
      isActive: true,
    },
  })

  await prisma.chercheur.upsert({
    where: { chercheur_id: 'MAT002' },
    update: {
      nom_complet: 'Dr. Test Researcher Two',
      mails: ['researcher2@lmcs.dz'],
      qualite: 'Chercheur',
      grade_recherche: 'Charge_de_recherche',
      hindex: 5,
    },
    create: {
      chercheur_id: 'MAT002',
      nom_complet: 'Dr. Test Researcher Two',
      mails: ['researcher2@lmcs.dz'],
      qualite: 'Chercheur',
      grade_recherche: 'Charge_de_recherche',
      hindex: 5,
    },
  })

  const researcher2 = await prisma.user.upsert({
    where: { email: 'researcher2@lmcs.dz' },
    update: {
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'ResearcherTwo',
      role: 'RESEARCHER',
      chercheur_id: 'MAT002',
      isActive: true,
    },
    create: {
      firstName: 'Test',
      lastName: 'ResearcherTwo',
      email: 'researcher2@lmcs.dz',
      password: hashedPassword,
      role: 'RESEARCHER',
      chercheur_id: 'MAT002',
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true,
      isActive: true,
    },
  })

  const assistant = await prisma.user.upsert({
    where: { email: 'assistant@lmcs.dz' },
    update: {
      password: hashedPassword,
      firstName: 'LMCS',
      lastName: 'Assistant',
      role: 'ASSISTANT',
      isActive: true,
    },
    create: {
      firstName: 'LMCS',
      lastName: 'Assistant',
      email: 'assistant@lmcs.dz',
      password: hashedPassword,
      role: 'ASSISTANT',
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true,
      isActive: true,
    },
  })

  console.log('Created/updated test users:')
  console.log(JSON.stringify({ researcher, researcher2, assistant }, null, 2))
  console.log('Password for all accounts: admin123')
  console.log('Second researcher login: researcher2@lmcs.dz (chercheur MAT002)')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
