import { beforeAll, afterAll } from '@jest/globals'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { newDb } from 'pg-mem'

beforeAll(async () => {
  const sqlPath = resolve(process.cwd(), 'prisma', 'generated-from-schema.sql')
  const schemaSql = readFileSync(sqlPath, 'utf8')

  // pg-mem is stricter than PostgreSQL for some Prisma-generated FK alters.
  // Keep the full generated schema, but drop ALTER TABLE FK blocks for in-memory tests.
  const pgMemCompatibleSql = schemaSql.replace(
    /ALTER TABLE[\s\S]*?FOREIGN KEY[\s\S]*?;/g,
    '',
  )

  const db = newDb({ autoCreateForeignKeyIndices: true })
  db.public.none(pgMemCompatibleSql)

  const { Client } = db.adapters.createPg()
  const client = new Client()
  await client.connect()

  globalThis.__PGMEM_DB__ = db
  globalThis.__PG_CLIENT__ = client
})

afterAll(async () => {
  if (globalThis.__PG_CLIENT__) {
    await globalThis.__PG_CLIENT__.end()
  }
})
