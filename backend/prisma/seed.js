const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create pilot school
  const school = await prisma.school.upsert({
    where: { id: "pilot-school-id" },
    update: {},
    create: {
      id: "pilot-school-id",
      name: "Escola Piloto de Dança",
    },
  });

  console.log(`School created/found: ${school.name} (${school.id})`);

  // 2. Create Admin user
  const adminEmail = "admin@danceflow.com";
  const adminPasswordHash = bcrypt.hashSync("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Administradora Dança",
      email: adminEmail,
      password: adminPasswordHash,
      role: "ADMIN",
      isActive: true,
      schoolId: school.id,
    },
  });

  console.log(`Admin user created/found: ${admin.name} (${admin.email})`);

  // 3. Create Teacher user
  const teacherEmail = "teacher@danceflow.com";
  const teacherPasswordHash = bcrypt.hashSync("teacher123", 10);

  const teacher = await prisma.user.upsert({
    where: { email: teacherEmail },
    update: {},
    create: {
      name: "Professora Ballet",
      email: teacherEmail,
      password: teacherPasswordHash,
      role: "TEACHER",
      isActive: true,
      schoolId: school.id,
    },
  });

  console.log(`Teacher user created/found: ${teacher.name} (${teacher.email})`);

  // 4. Create some initial modalities
  const initialModalities = [
    { name: "Ballet", description: "Ballet clássico para diferentes idades" },
    { name: "Jazz", description: "Dança jazz moderna e contemporânea" },
    { name: "Sapateado", description: "Aulas de sapateado americano" },
  ];

  for (const mod of initialModalities) {
    await prisma.modality.upsert({
      where: {
        schoolId_name: {
          schoolId: school.id,
          name: mod.name,
        },
      },
      update: {},
      create: {
        name: mod.name,
        description: mod.description,
        schoolId: school.id,
        isActive: true,
      },
    });
    console.log(`Modality created/found: ${mod.name}`);
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
