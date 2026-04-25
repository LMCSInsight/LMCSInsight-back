import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 12)

  // ─── System Users ─────────────────────────────────────────────────────────────

  await prisma.user.upsert({
    where: { email: 'admin@lmcs.dz' },
    update: {
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrateur',
      role: 'ADMIN',
    },
    create: {
      firstName: 'System',
      lastName: 'Administrateur',
      email: 'admin@lmcs.dz',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  await prisma.user.upsert({
    where: { email: 'director@lmcs.dz' },
    update: {
      password: hashedPassword,
      firstName: 'Directeur',
      lastName: 'Utilisateur',
      role: 'DIRECTOR',
    },
    create: {
      firstName: 'Directeur',
      lastName: 'Utilisateur',
      email: 'director@lmcs.dz',
      password: hashedPassword,
      role: 'DIRECTOR',
    },
  })

  await prisma.user.upsert({
    where: { email: 'assistant@lmcs.dz' },
    update: {
      password: hashedPassword,
      firstName: 'Assistant',
      lastName: 'Validation',
      role: 'ASSISTANT',
    },
    create: {
      firstName: 'Assistant',
      lastName: 'Validation',
      email: 'assistant@lmcs.dz',
      password: hashedPassword,
      role: 'ASSISTANT',
    },
  })

  // ─── Chercheurs (researchers) ─────────────────────────────────────────────────

  const chercheurs = [
    {
      chercheur_id: 'MAT001',
      nom_complet: 'Pr. Abderrahim Laribi',
      mails: ['researcher@lmcs.dz', 'a.laribi@esi.dz'],
      qualite: 'Enseignant_Chercheur' as const,
      grade_recherche: 'Directeur_de_recherche' as const,
      hindex: 14,
    },
    {
      chercheur_id: 'MAT002',
      nom_complet: 'Dr. Nadia Boukhalfa',
      mails: ['n.boukhalfa@esi.dz'],
      qualite: 'Enseignant_Chercheur' as const,
      grade_recherche: 'Charge_de_recherche' as const,
      hindex: 9,
    },
    {
      chercheur_id: 'MAT003',
      nom_complet: 'Dr. Karim Meziane',
      mails: ['k.meziane@esi.dz'],
      qualite: 'Enseignant_Chercheur' as const,
      grade_recherche: 'Attache_de_recherche' as const,
      hindex: 6,
    },
    {
      chercheur_id: 'MAT004',
      nom_complet: 'Pr. Fatima Chérif',
      mails: ['f.cherif@esi.dz'],
      qualite: 'Enseignant_Chercheur' as const,
      grade_recherche: 'Directeur_de_recherche' as const,
      hindex: 18,
    },
  ]

  for (const c of chercheurs) {
    await prisma.chercheur.upsert({
      where: { chercheur_id: c.chercheur_id },
      update: c,
      create: c,
    })
  }

  // Link researcher account to MAT001
  await prisma.user.upsert({
    where: { email: 'researcher@lmcs.dz' },
    update: {
      password: hashedPassword,
      firstName: 'Abderrahim',
      lastName: 'Laribi',
      role: 'RESEARCHER',
      chercheur_id: 'MAT001',
    },
    create: {
      firstName: 'Abderrahim',
      lastName: 'Laribi',
      email: 'researcher@lmcs.dz',
      password: hashedPassword,
      role: 'RESEARCHER',
      chercheur_id: 'MAT001',
    },
  })

  // ─── Students ─────────────────────────────────────────────────────────────────

  const studentData = [
    // ESI Master students
    {
      firstName: 'Mohamed',
      lastName: 'Benali',
      email: 'm.benali@esi.dz',
      institution: 'ESI',
      level: 'MASTER',
      specialty: 'SIL',
    },
    {
      firstName: 'Amina',
      lastName: 'Rahmani',
      email: 'a.rahmani@esi.dz',
      institution: 'ESI',
      level: 'MASTER',
      specialty: 'SID',
    },
    {
      firstName: 'Yacine',
      lastName: 'Khelil',
      email: 'y.khelil@esi.dz',
      institution: 'ESI',
      level: 'MASTER',
      specialty: 'SIT',
    },
    {
      firstName: 'Nour',
      lastName: 'Tlemçani',
      email: 'n.tlemcani@esi.dz',
      institution: 'ESI',
      level: 'MASTER',
      specialty: 'SIQ',
    },
    {
      firstName: 'Anes',
      lastName: 'Benmoussa',
      email: 'a.benmoussa@esi.dz',
      institution: 'ESI',
      level: 'MASTER',
      specialty: 'SIL',
    },
    {
      firstName: 'Rania',
      lastName: 'Ziani',
      email: 'r.ziani@esi.dz',
      institution: 'ESI',
      level: 'MASTER',
      specialty: 'SID',
    },
    {
      firstName: 'Sofiane',
      lastName: 'Hadj',
      email: 's.hadj@esi.dz',
      institution: 'ESI',
      level: 'MASTER',
      specialty: 'SIT',
    },
    {
      firstName: 'Yasmine',
      lastName: 'Djebara',
      email: 'y.djebara@esi.dz',
      institution: 'ESI',
      level: 'MASTER',
      specialty: 'SIL',
    },
    // ESI Doctorants
    {
      firstName: 'Khalil',
      lastName: 'Lahmar',
      email: 'k.lahmar@esi.dz',
      institution: 'ESI',
      level: 'DOCTORANT',
      specialty: 'SIL',
    },
    {
      firstName: 'Ines',
      lastName: 'Saïdani',
      email: 'i.saidani@esi.dz',
      institution: 'ESI',
      level: 'DOCTORANT',
      specialty: 'SID',
    },
    {
      firstName: 'Redouane',
      lastName: 'Amrani',
      email: 'r.amrani@esi.dz',
      institution: 'ESI',
      level: 'DOCTORANT',
      specialty: 'SIT',
    },
    {
      firstName: 'Sara',
      lastName: 'Boudiaf',
      email: 's.boudiaf@esi.dz',
      institution: 'ESI',
      level: 'DOCTORANT',
      specialty: 'SIQ',
    },
    {
      firstName: 'Ibrahim',
      lastName: 'Chérif',
      email: 'i.cherif@esi.dz',
      institution: 'ESI',
      level: 'DOCTORANT',
      specialty: 'SIL',
    },
    // Extérieur students
    {
      firstName: 'Anis',
      lastName: 'Ghezali',
      email: 'a.ghezali@usthb.dz',
      institution: 'EXTERNE',
      level: 'MASTER',
      specialty: 'SIL',
    },
    {
      firstName: 'Lydia',
      lastName: 'Boudjelal',
      email: 'l.boudjelal@usthb.dz',
      institution: 'EXTERNE',
      level: 'MASTER',
      specialty: 'SID',
    },
    {
      firstName: 'Fares',
      lastName: 'Ouali',
      email: 'f.ouali@umbb.dz',
      institution: 'EXTERNE',
      level: 'DOCTORANT',
      specialty: 'SIT',
    },
    {
      firstName: 'Meriem',
      lastName: 'Slimani',
      email: 'm.slimani@univ-alger.dz',
      institution: 'EXTERNE',
      level: 'DOCTORANT',
      specialty: 'SIQ',
    },
    {
      firstName: 'Bilal',
      lastName: 'Hammoudi',
      email: 'b.hammoudi@usthb.dz',
      institution: 'EXTERNE',
      level: 'MASTER',
      specialty: 'SIL',
    },
    {
      firstName: 'Wafa',
      lastName: 'Belkacem',
      email: 'w.belkacem@umbb.dz',
      institution: 'EXTERNE',
      level: 'MASTER',
      specialty: 'SID',
    },
    {
      firstName: 'Nassim',
      lastName: 'Messaoud',
      email: 'n.messaoud@esi.dz',
      institution: 'ESI',
      level: 'MASTER',
      specialty: 'SIQ',
    },
  ]

  const students: { id: string; firstName: string; lastName: string }[] = []

  for (const s of studentData) {
    const student = await prisma.student.upsert({
      where: { email: s.email },
      update: s,
      create: s,
    })
    students.push({
      id: student.id,
      firstName: s.firstName,
      lastName: s.lastName,
    })
  }

  // Helper: find student index by name
  const sid = (firstName: string) =>
    students.find((s) => s.firstName === firstName)!.id

  // ─── Thématiques (labo / informatique) — upsert by name ────────────────────
  const laboThemes: { name: string; description: string }[] = [
    {
      name: 'Traitement du langage naturel (NLP)',
      description:
        "Modèles de langage, extraction d'information, traduction et analyse de opinions.",
    },
    {
      name: 'Vision par ordinateur',
      description:
        "Détection, segmentation, suivi d'objets et de scènes, applications industrielles ou médicales.",
    },
    {
      name: "Systèmes d'information et intégration d'entreprise",
      description:
        'SOA, ESB, interopérabilité, ERP et gouvernance des données.',
    },
    {
      name: 'Bases de données avancées',
      description:
        'Bases graphes, entrepôts, cohérence, requêtes analytiques et performance.',
    },
    {
      name: 'Développement logiciel et ingénierie',
      description:
        'Méthodologies agiles, qualité, tests, architecture logicielle et rétro-ingénierie.',
    },
    {
      name: 'Optimisation, recherche opérationnelle et aide à la décision',
      description:
        'Modélisation, programmation linéaire, métaheuristiques et planification.',
    },
    {
      name: 'Systèmes embarqués et temps réel',
      description:
        'Conception fiable, contraintes temps réel, IoT industriel et sûreté de fonctionnement.',
    },
  ]

  for (const t of laboThemes) {
    const existing = await prisma.theme.findFirst({
      where: { name: t.name },
    })
    if (existing) {
      await prisma.theme.update({
        where: { id: existing.id },
        data: { description: t.description },
      })
    } else {
      await prisma.theme.create({ data: t })
    }
  }

  // ─── Supervisions ─────────────────────────────────────────────────────────────

  const supervisionsData = [
    // ── 2022-2023 (mostly completed) ──────────────────────────────────────────
    {
      title:
        "Détection d'intrusions dans les réseaux IoT par apprentissage automatique",
      type: 'MASTER' as const,
      description:
        'Application des techniques de machine learning pour la détection en temps réel des intrusions dans les réseaux IoT.',
      status: 'DEFENDED' as const,
      validationStatus: 'VALIDATED' as const,
      academicYear: '2022-2023',
      startDate: new Date('2022-10-01'),
      expectedEndDate: new Date('2023-06-30'),
      actualEndDate: new Date('2023-06-15'),
      keywords: [
        'IoT',
        'machine learning',
        'intrusion detection',
        'sécurité réseau',
      ],
      studentFirstName: 'Mohamed',
      mainSupervisorId: 'MAT001',
    },
    {
      title: 'Analyse de sentiment en langue arabe dialectale algérienne',
      type: 'MASTER' as const,
      description:
        "Développement d'un modèle NLP pour l'analyse de sentiment dans les textes en dialecte algérien.",
      status: 'DEFENDED' as const,
      validationStatus: 'VALIDATED' as const,
      academicYear: '2022-2023',
      startDate: new Date('2022-10-01'),
      expectedEndDate: new Date('2023-06-30'),
      actualEndDate: new Date('2023-07-01'),
      keywords: [
        'NLP',
        'arabe dialectal',
        'analyse de sentiment',
        'deep learning',
      ],
      studentFirstName: 'Amina',
      mainSupervisorId: 'MAT002',
    },
    {
      title:
        'Optimisation des algorithmes de consensus dans les blockchains permissionnées',
      type: 'PHD' as const,
      description:
        'Étude et amélioration des protocoles de consensus pour les blockchains de type Fabric dans un contexte enterprise.',
      status: 'DEFENDED' as const,
      validationStatus: 'VALIDATED' as const,
      academicYear: '2022-2023',
      startDate: new Date('2020-09-01'),
      expectedEndDate: new Date('2023-09-30'),
      actualEndDate: new Date('2023-09-20'),
      keywords: [
        'blockchain',
        'consensus',
        'Hyperledger Fabric',
        'systèmes distribués',
      ],
      studentFirstName: 'Khalil',
      mainSupervisorId: 'MAT001',
      coSupervisorId: 'MAT003',
    },
    {
      title:
        "Plateforme de e-learning adaptative pour l'enseignement supérieur algérien",
      type: 'PFE' as const,
      status: 'DEFENDED' as const,
      validationStatus: 'VALIDATED' as const,
      academicYear: '2022-2023',
      startDate: new Date('2023-02-01'),
      expectedEndDate: new Date('2023-06-30'),
      actualEndDate: new Date('2023-06-28'),
      keywords: ['e-learning', 'personnalisation', 'recommandation', 'Algérie'],
      studentFirstName: 'Yacine',
      mainSupervisorId: 'MAT003',
    },
    {
      title:
        'Diagnostic médical assisté par intelligence artificielle — cancer du sein',
      type: 'MASTER' as const,
      description:
        "Classification automatique des images mammographiques à l'aide de réseaux de neurones convolutifs.",
      status: 'DEFENDED' as const,
      validationStatus: 'VALIDATED' as const,
      academicYear: '2022-2023',
      startDate: new Date('2022-10-01'),
      expectedEndDate: new Date('2023-06-30'),
      actualEndDate: new Date('2023-06-25'),
      keywords: ['deep learning', 'imagerie médicale', 'CNN', 'classification'],
      studentFirstName: 'Ines',
      mainSupervisorId: 'MAT004',
    },
    // ── 2023-2024 (mix of completed and in progress) ──────────────────────────
    {
      title:
        'Sécurisation des services cloud dans les administrations publiques algériennes',
      type: 'MASTER' as const,
      description:
        "Analyse des vulnérabilités et proposition d'une architecture sécurisée pour la migration cloud dans les administrations.",
      status: 'DEFENDED' as const,
      validationStatus: 'VALIDATED' as const,
      academicYear: '2023-2024',
      startDate: new Date('2023-10-01'),
      expectedEndDate: new Date('2024-06-30'),
      actualEndDate: new Date('2024-06-20'),
      keywords: [
        'cloud computing',
        'cybersécurité',
        'administration publique',
        'conformité',
      ],
      studentFirstName: 'Nour',
      mainSupervisorId: 'MAT001',
    },
    {
      title: 'Système de gestion intelligente du trafic urbain à Alger',
      type: 'PHD' as const,
      description:
        "Modélisation et optimisation du flux de trafic urbain par des algorithmes d'apprentissage par renforcement.",
      status: 'IN_PROGRESS' as const,
      validationStatus: 'VALIDATED' as const,
      academicYear: '2023-2024',
      startDate: new Date('2021-09-01'),
      expectedEndDate: new Date('2024-09-30'),
      keywords: [
        'apprentissage par renforcement',
        'trafic urbain',
        'smart city',
        'optimisation',
      ],
      studentFirstName: 'Redouane',
      mainSupervisorId: 'MAT001',
      coSupervisorId: 'MAT004',
    },
    {
      title: 'Détection de fake news en arabe sur les réseaux sociaux',
      type: 'MASTER' as const,
      status: 'DEFENDED' as const,
      validationStatus: 'VALIDATED' as const,
      academicYear: '2023-2024',
      startDate: new Date('2023-10-01'),
      expectedEndDate: new Date('2024-06-30'),
      actualEndDate: new Date('2024-07-03'),
      keywords: ['fake news', 'arabe', 'NLP', 'classification de texte'],
      studentFirstName: 'Rania',
      mainSupervisorId: 'MAT002',
    },
    {
      title:
        'Authentification multi-facteurs biométrique pour les applications mobiles',
      type: 'PFE' as const,
      status: 'DEFENDED' as const,
      validationStatus: 'VALIDATED' as const,
      academicYear: '2023-2024',
      startDate: new Date('2024-02-01'),
      expectedEndDate: new Date('2024-06-30'),
      actualEndDate: new Date('2024-06-29'),
      keywords: ['biométrie', 'authentification', 'mobile', 'sécurité'],
      studentFirstName: 'Anes',
      mainSupervisorId: 'MAT003',
    },
    {
      title:
        "Framework de microservices pour les systèmes d'information hospitaliers",
      type: 'MASTER' as const,
      status: 'IN_PROGRESS' as const,
      validationStatus: 'VALIDATED' as const,
      academicYear: '2023-2024',
      startDate: new Date('2023-10-01'),
      expectedEndDate: new Date('2024-06-30'),
      keywords: [
        'microservices',
        'santé numérique',
        'API REST',
        'interopérabilité',
      ],
      studentFirstName: 'Sofiane',
      mainSupervisorId: 'MAT001',
    },
    {
      title:
        'Analyse de séries temporelles pour la prédiction de consommation énergétique',
      type: 'MASTER' as const,
      description:
        'Application des modèles LSTM et Transformer pour prévoir la consommation électrique en Algérie.',
      status: 'EXTENSION' as const,
      validationStatus: 'VALIDATED' as const,
      academicYear: '2023-2024',
      startDate: new Date('2023-10-01'),
      expectedEndDate: new Date('2024-06-30'),
      keywords: ['LSTM', 'séries temporelles', 'énergie', 'prédiction'],
      studentFirstName: 'Sara',
      mainSupervisorId: 'MAT004',
    },
    {
      title: 'Reconnaissance automatique de la parole en darija algérien',
      type: 'PHD' as const,
      description:
        "Construction d'un corpus darija et entraînement de modèles ASR adaptés au dialecte algérien.",
      status: 'IN_PROGRESS' as const,
      validationStatus: 'VALIDATED' as const,
      academicYear: '2023-2024',
      startDate: new Date('2021-09-01'),
      expectedEndDate: new Date('2024-12-31'),
      keywords: ['speech recognition', 'darija', 'ASR', 'corpus linguistique'],
      studentFirstName: 'Ibrahim',
      mainSupervisorId: 'MAT002',
      coSupervisorId: 'MAT001',
    },
    {
      title: 'Architecture zero-trust pour les environnements multi-cloud',
      type: 'MASTER' as const,
      status: 'ABANDONED' as const,
      validationStatus: 'REJECTED' as const,
      academicYear: '2023-2024',
      startDate: new Date('2023-10-01'),
      expectedEndDate: new Date('2024-06-30'),
      keywords: ['zero-trust', 'multi-cloud', 'sécurité', 'IAM'],
      studentFirstName: 'Anis',
      mainSupervisorId: 'MAT003',
    },
    // ── 2024-2025 (mostly in progress / pending) ───────────────────────────────
    {
      title:
        'Génération automatique de code avec les grands modèles de langage',
      type: 'MASTER' as const,
      description:
        'Évaluation et fine-tuning de LLMs (GPT, LLaMA) pour la génération et correction de code source.',
      status: 'IN_PROGRESS' as const,
      validationStatus: 'VALIDATED' as const,
      academicYear: '2024-2025',
      startDate: new Date('2024-10-01'),
      expectedEndDate: new Date('2025-06-30'),
      keywords: [
        'LLM',
        'génération de code',
        'fine-tuning',
        'intelligence artificielle',
      ],
      studentFirstName: 'Yasmine',
      mainSupervisorId: 'MAT001',
    },
    {
      title: 'Détection de vulnérabilités dans les smart contracts Ethereum',
      type: 'MASTER' as const,
      status: 'IN_PROGRESS' as const,
      validationStatus: 'PENDING' as const,
      academicYear: '2024-2025',
      startDate: new Date('2024-10-01'),
      expectedEndDate: new Date('2025-06-30'),
      keywords: [
        'smart contracts',
        'Ethereum',
        'audit sécurité',
        'analyse statique',
      ],
      studentFirstName: 'Lydia',
      mainSupervisorId: 'MAT001',
      coSupervisorId: 'MAT003',
    },
    {
      title:
        'Système de recommandation culturelle basé sur le contexte algérien',
      type: 'MASTER' as const,
      status: 'IN_PROGRESS' as const,
      validationStatus: 'PENDING' as const,
      academicYear: '2024-2025',
      startDate: new Date('2024-10-01'),
      expectedEndDate: new Date('2025-06-30'),
      keywords: [
        'recommandation',
        'filtrage collaboratif',
        'culture',
        'graphe de connaissances',
      ],
      studentFirstName: 'Wafa',
      mainSupervisorId: 'MAT002',
    },
    {
      title:
        "Analyse d'images satellitaires pour le suivi de l'agriculture en Algérie",
      type: 'PHD' as const,
      description:
        "Utilisation de techniques de vision par ordinateur pour l'analyse des cultures à partir d'images Sentinel-2.",
      status: 'IN_PROGRESS' as const,
      validationStatus: 'VALIDATED' as const,
      academicYear: '2024-2025',
      startDate: new Date('2022-09-01'),
      expectedEndDate: new Date('2025-09-30'),
      keywords: ['télédétection', 'agriculture', 'deep learning', 'Sentinel-2'],
      studentFirstName: 'Fares',
      mainSupervisorId: 'MAT004',
      coSupervisorId: 'MAT001',
    },
    {
      title:
        'Optimisation de la consommation énergétique dans les datacenters algériens',
      type: 'MASTER' as const,
      status: 'IN_PROGRESS' as const,
      validationStatus: 'REVISED' as const,
      academicYear: '2024-2025',
      startDate: new Date('2024-10-01'),
      expectedEndDate: new Date('2025-06-30'),
      keywords: ['green computing', 'datacenter', 'optimisation', 'PUE'],
      studentFirstName: 'Bilal',
      mainSupervisorId: 'MAT003',
    },
    {
      title:
        'Détection de fraude dans les transactions bancaires par graphes neuronaux',
      type: 'MASTER' as const,
      status: 'IN_PROGRESS' as const,
      validationStatus: 'PENDING' as const,
      academicYear: '2024-2025',
      startDate: new Date('2024-10-01'),
      expectedEndDate: new Date('2025-06-30'),
      keywords: [
        'détection de fraude',
        'GNN',
        'banque',
        'apprentissage sur graphes',
      ],
      studentFirstName: 'Nassim',
      mainSupervisorId: 'MAT001',
    },
    {
      title:
        'Chatbot médical en langue arabe pour les soins de santé primaires',
      type: 'MASTER' as const,
      status: 'IN_PROGRESS' as const,
      validationStatus: 'PENDING' as const,
      academicYear: '2024-2025',
      startDate: new Date('2024-10-01'),
      expectedEndDate: new Date('2025-06-30'),
      keywords: ['chatbot', 'arabe', 'santé', 'traitement du langage naturel'],
      studentFirstName: 'Meriem',
      mainSupervisorId: 'MAT002',
      coSupervisorId: 'MAT004',
    },
    {
      title:
        "Stage — Développement d'une API REST pour la gestion des ressources humaines",
      type: 'INTERNSHIP' as const,
      status: 'DEFENDED' as const,
      validationStatus: 'VALIDATED' as const,
      academicYear: '2024-2025',
      startDate: new Date('2024-06-01'),
      expectedEndDate: new Date('2024-09-30'),
      actualEndDate: new Date('2024-09-28'),
      keywords: ['API REST', 'RH', 'Node.js', 'PostgreSQL'],
      studentFirstName: 'Nassim',
      mainSupervisorId: 'MAT003',
    },
    {
      title:
        'Modélisation ontologique du patrimoine culturel immatériel algérien',
      type: 'PHD' as const,
      description:
        "Construction d'une ontologie OWL pour la représentation et la préservation numérique du patrimoine culturel.",
      status: 'IN_PROGRESS' as const,
      validationStatus: 'VALIDATED' as const,
      academicYear: '2024-2025',
      startDate: new Date('2023-09-01'),
      expectedEndDate: new Date('2026-09-30'),
      keywords: ['ontologie', 'OWL', 'patrimoine', 'web sémantique'],
      studentFirstName: 'Meriem',
      mainSupervisorId: 'MAT004',
    },
    {
      title:
        'Compression et accélération de réseaux de neurones pour les systèmes embarqués',
      type: 'MASTER' as const,
      status: 'SUSPENDED' as const,
      validationStatus: 'VALIDATED' as const,
      academicYear: '2024-2025',
      startDate: new Date('2024-10-01'),
      expectedEndDate: new Date('2025-06-30'),
      keywords: ['edge AI', 'pruning', 'quantisation', 'systèmes embarqués'],
      studentFirstName: 'Fares',
      mainSupervisorId: 'MAT001',
    },
  ]

  for (const sup of supervisionsData) {
    const { studentFirstName, mainSupervisorId, coSupervisorId, ...rest } =
      sup as typeof sup & { coSupervisorId?: string }

    const studentId = sid(studentFirstName)

    // Check if a supervision with this title already exists for this student
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

    // Upsert main supervisor
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

    // Upsert co-supervisor if any
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

  console.log('✓ Seed completed:')
  console.log(`  • ${chercheurs.length} chercheurs`)
  console.log(`  • ${studentData.length} students`)
  console.log(`  • ${laboThemes.length} thématiques (labo)`)
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
