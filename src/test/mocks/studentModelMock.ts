type CreateArgs<T> = {
  data: T
}

let nextId = 1
const students: any[] = []

export const StudentModel = {
  async create<T extends Record<string, unknown>>({ data }: CreateArgs<T>) {
    const created = {
      id: nextId,
      ...data,
    }

    nextId += 1

    students.push(created)

    return created
  },
  async findMany() {
    return students
  },
}
