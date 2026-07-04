const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning database...");

  // 1. Delete all tables in safe order (prevent foreign key violations)
  await prisma.attendance.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.studentGuardian.deleteMany();
  await prisma.guardian.deleteMany();
  await prisma.classTeacher.deleteMany();
  await prisma.classStudent.deleteMany();
  await prisma.classSchedule.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.class.deleteMany();
  await prisma.modality.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();
  await prisma.school.deleteMany();

  console.log("Database cleared successfully!");

  // 2. Create the base School
  const school = await prisma.school.create({
    data: {
      id: "pilot-school-id",
      name: "Escola Piloto de Dança",
    },
  });
  console.log(`School recreated: ${school.name}`);

  // 3. Create the Admin account
  const adminEmail = "admin@danceflow.com";
  const adminPasswordHash = bcrypt.hashSync("admin123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Administradora Dança",
      email: adminEmail,
      password: adminPasswordHash,
      role: "ADMIN",
      isActive: true,
      schoolId: school.id,
    },
  });
  console.log(`Admin user recreated: ${admin.name} (${admin.email})`);
  console.log("Success! You can now log in and input your custom data.");
}

main()
  .catch((e) => {
    console.error("Error clearing database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
