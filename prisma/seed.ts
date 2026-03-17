import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@lmcs.dz" },
    update: {},
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
    update: {},
    create: {
      firstName: "Director",
      lastName: "User",
      email: "director@lmcs.dz",
      password: hashedPassword,
      role: "DIRECTOR",
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: "teacher@lmcs.dz" },
    update: {},
    create: {
      firstName: "Teacher",
      lastName: "User",
      email: "teacher@lmcs.dz",
      password: hashedPassword,
      role: "TEACHER",
    },
  });

  const assistant = await prisma.user.upsert({
    where: { email: "assistant@lmcs.dz" },
    update: {},
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
    teacher: teacher.email,
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
