export default async function globalTeardown() {
  delete globalThis.__PGMEM_DB__
  delete globalThis.__PG_CLIENT__
}
