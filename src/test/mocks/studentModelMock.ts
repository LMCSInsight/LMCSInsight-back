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
  async findUnique({ where }: { where: { id: string } }) {
    const student = students.find(s => s.id === where.id)
    return student || null
  },
  async update<T extends Record<string, unknown>>({ where, data }: { where: { id: string }, data: T }) {
    const index = students.findIndex(s => s.id === where.id);
  
    if (index === -1) return null; 
  
    const updatedStudent = {
      ...students[index],
      ...data
    };
  
    students[index] = updatedStudent;
  
    return updatedStudent;
  },
  async delete({ where }: { where: { id: string } }) {
    const index = students.findIndex(s => s.id === where.id);
    if (index === -1) return null;
  
    const deleted = students[index];
    students.splice(index, 1); 
    return deleted;
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

export const SupervisionSupervisorModel = {
  async create<T extends Record<string, unknown>>({ data }: CreateArgs<T>) {
    const created = {
      id: String(nextId),
      ...data,
    }
    nextId += 1
    return created
  },
  async deleteMany() {
    return { count: 1 }
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
