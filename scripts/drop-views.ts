/**
 * Drop views so Prisma can alter enum types. Run: npx tsx scripts/drop-views.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe('DROP VIEW IF EXISTS "supervisions_avec_superviseurs"');
  await prisma.$executeRawUnsafe('DROP VIEW IF EXISTS "chercheurs_actifs_details"');
  console.log("Views dropped.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
