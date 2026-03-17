import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@lmcs.dz" },
    update: { password: hashedPassword, firstName: "System", lastName: "Administrator", role: "ADMIN" },
    create: {
      firstName: "System",
      lastName: "Administrator",
      email: "admin@lmcs.dz",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  const director = await prisma.user.upsert({
    where: { email: "director@lmcs.dz" },
    update: { password: hashedPassword, firstName: "Director", lastName: "User", role: "DIRECTOR" },
    create: {
      firstName: "Director",
      lastName: "User",
      email: "director@lmcs.dz",
      password: hashedPassword,
      role: "DIRECTOR",
    },
  });

  // Researcher (chercheur): user with role RESEARCHER. Link to Chercheur via chercheur_id when needed.
  const researcher = await prisma.user.upsert({
    where: { email: "researcher@lmcs.dz" },
    update: { password: hashedPassword, firstName: "Researcher", lastName: "User", role: "RESEARCHER" },
    create: {
      firstName: "Researcher",
      lastName: "User",
      email: "researcher@lmcs.dz",
      password: hashedPassword,
      role: "RESEARCHER",
    },
  });

  const assistant = await prisma.user.upsert({
    where: { email: "assistant@lmcs.dz" },
    update: { password: hashedPassword, firstName: "Assistant", lastName: "Validation", role: "ASSISTANT" },
    create: {
      firstName: "Assistant",
      lastName: "Validation",
      email: "assistant@lmcs.dz",
      password: hashedPassword,
      role: "ASSISTANT",
    },
  });

  console.log("Seed completed:", {
    admin: admin.email,
    director: director.email,
    researcher: researcher.email,
    assistant: assistant.email,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
