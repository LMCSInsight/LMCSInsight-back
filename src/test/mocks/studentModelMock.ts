import { randomUUID } from 'node:crypto'

type CreateArgs<T> = {
  data: T
}

type MockStudent = Record<string, unknown> & { id: string }

let nextId = 1
const students: MockStudent[] = []

export const StudentModel = {
  async create<T extends Record<string, unknown>>({ data }: CreateArgs<T>) {
    const created = {
      id: String(nextId),
      ...data,
    }
    nextId += 1
    students.push(created)

    return created
  },
  async findMany() {
    return students
  },
  async count() {
    return students.length
  },
  async findUnique({ where }: { where: { id: string } }) {
    const student = students.find((s) => s.id === where.id)
    return student || null
  },
  async update<T extends Record<string, unknown>>({
    where,
    data,
  }: {
    where: { id: string }
    data: T
  }) {
    const index = students.findIndex((s) => s.id === where.id)

    if (index === -1) return null

    const updatedStudent = {
      ...students[index],
      ...data,
    }

    students[index] = updatedStudent

    return updatedStudent
  },
  async delete({ where }: { where: { id: string } }) {
    const index = students.findIndex((s) => s.id === where.id)
    if (index === -1) return null

    const deleted = students[index]
    students.splice(index, 1)
    return deleted
  },
}

export const SupervisionModel = {
  async create<T extends Record<string, unknown>>({ data }: CreateArgs<T>) {
    const created = {
      id: String(nextId),
      ...data,
    }
    nextId += 1
    return created
  },
  async findMany() {
    return []
  },
  async findUnique() {
    return null
  },
  async update() {
    return {}
  },
  async delete() {
    return {}
  },
}

type SSRow = {
  id: string
  supervisionId: string
  supervisorId: string
  isMainSupervisor: boolean
  isExternal: boolean
  contributionPercent: number
}

let supervisionSupervisorRows: SSRow[] = []
let ssRowId = 1

/** Reset in-memory supervision_supervisors rows between tests. */
export function resetSupervisionSupervisorMock(): void {
  supervisionSupervisorRows = []
  ssRowId = 1
}

export const SupervisionSupervisorModel = {
  async findFirst({
    where,
  }: {
    where: { supervisionId?: string; supervisorId?: string }
  }) {
    return (
      supervisionSupervisorRows.find(
        (r) =>
          (where.supervisionId === undefined ||
            r.supervisionId === where.supervisionId) &&
          (where.supervisorId === undefined ||
            r.supervisorId === where.supervisorId),
      ) ?? null
    )
  },
  async create({ data }: CreateArgs<Record<string, unknown>>) {
    const row: SSRow = {
      id: String(ssRowId++),
      supervisionId: String(data.supervisionId),
      supervisorId: String(data.supervisorId),
      isMainSupervisor: Boolean(data.isMainSupervisor),
      isExternal: Boolean(data.isExternal),
      contributionPercent: Number(data.contributionPercent),
    }
    supervisionSupervisorRows.push(row)
    return row
  },
  async findMany({
    where,
  }: {
    where: { supervisionId: string }
    select?: { contributionPercent?: boolean }
  }) {
    return supervisionSupervisorRows
      .filter((r) => r.supervisionId === where.supervisionId)
      .map((r) => ({ contributionPercent: r.contributionPercent }))
  },
  async delete({ where }: { where: { id: string } }) {
    const index = supervisionSupervisorRows.findIndex((r) => r.id === where.id)
    if (index === -1) return null
    const [removed] = supervisionSupervisorRows.splice(index, 1)
    return removed
  },
  async deleteMany({ where }: { where: { supervisionId?: string } }) {
    if (!where?.supervisionId) {
      const count = supervisionSupervisorRows.length
      supervisionSupervisorRows = []
      return { count }
    }
    const before = supervisionSupervisorRows.length
    supervisionSupervisorRows = supervisionSupervisorRows.filter(
      (r) => r.supervisionId !== where.supervisionId,
    )
    return { count: before - supervisionSupervisorRows.length }
  },
}

export const ChercheurModel = {
  async create<T extends Record<string, unknown>>({ data }: CreateArgs<T>) {
    const created = {
      chercheur_id: String(nextId),
      ...data,
    }
    nextId += 1
    return created
  },
}

const themes: Array<Record<string, unknown> & { id: string }> = []

export const ThemeModel = {
  async create<T extends Record<string, unknown>>({
    data,
  }: CreateArgs<T> & { include?: { team: boolean } }) {
    const created = {
      id: randomUUID(),
      ...data,
      team: null,
    }
    themes.push(created)
    return created
  },
  async findMany(
    {
      skip = 0,
      take = 20,
    }: {
      where?: object
      skip?: number
      take?: number
      orderBy?: object
      include?: { team: boolean }
    } = { skip: 0, take: 20 },
  ) {
    return themes.slice(skip, skip + take)
  },
  async count() {
    return themes.length
  },
  async findUnique({
    where,
  }: {
    where: { id: string }
    include?: { team: boolean }
  }) {
    return themes.find((t) => t.id === where.id) ?? null
  },
  async update<T extends Record<string, unknown>>({
    where,
    data,
  }: {
    where: { id: string }
    data: T
    include?: { team: boolean }
  }) {
    const index = themes.findIndex((t) => t.id === where.id)
    if (index === -1) return null
    const updated = { ...themes[index], ...data, team: null }
    themes[index] = updated
    return updated
  },
  async delete({ where }: { where: { id: string } }) {
    const index = themes.findIndex((t) => t.id === where.id)
    if (index === -1) return null
    const [deleted] = themes.splice(index, 1)
    return deleted
  },
}

const mockUsers: Array<Record<string, unknown> & { id: string }> = []

export const UserModel = {
  async create({ data }: CreateArgs<Record<string, unknown>>) {
    const row = {
      id: randomUUID(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    mockUsers.push(row as Record<string, unknown> & { id: string })
    return row
  },
  async findMany({
    skip = 0,
    take = 20,
  }: {
    where?: object
    skip?: number
    take?: number
    orderBy?: object
    select?: object
  } = {}) {
    return mockUsers.slice(skip, skip + take)
  },
  async count() {
    return mockUsers.length
  },
  async groupBy() {
    return [] as Array<{ role: string; _count: { role: number } }>
  },
  async findUnique({ where }: { where: { id: string }; select?: object }) {
    return mockUsers.find((u) => u.id === where.id) ?? null
  },
  async update({
    where,
    data,
  }: {
    where: { id: string }
    data: Record<string, unknown>
    select?: object
  }) {
    const index = mockUsers.findIndex((u) => u.id === where.id)
    if (index === -1) return null
    const updated = { ...mockUsers[index], ...data, updatedAt: new Date() }
    mockUsers[index] = updated as (typeof mockUsers)[number]
    return updated
  },
  async delete({ where }: { where: { id: string } }) {
    const index = mockUsers.findIndex((u) => u.id === where.id)
    if (index === -1) return null
    const [removed] = mockUsers.splice(index, 1)
    return removed
  },
}

export const TeamModel = {
  async findMany() {
    return []
  },
  async count() {
    return 0
  },
}

export const ValidationLogModel = {
  async create() {
    return { id: randomUUID() }
  },
}

export const AuditLogModel = {
  async create() {
    return { id: randomUUID() }
  },
}

export const NotificationModel = {
  async create() {
    return { id: randomUUID() }
  },
}
