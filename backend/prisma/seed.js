const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

function generateInitialLessonsForClass(classId, schedules, startDate, daysCount = 14) {
  const lessons = [];
  const start = new Date(startDate);
  
  const dayMap = {
    "Domingo": 0,
    "Segunda": 1,
    "Terça": 2,
    "Quarta": 3,
    "Quinta": 4,
    "Sexta": 5,
    "Sábado": 6
  };

  for (let i = 0; i < daysCount; i++) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    
    const currentDayName = Object.keys(dayMap).find(key => dayMap[key] === current.getDay());
    const matchedSchedules = schedules.filter(sch => sch.dayOfWeek === currentDayName);
    
    for (const sch of matchedSchedules) {
      lessons.push({
        classId,
        date: new Date(current.toISOString().substring(0, 10) + "T00:00:00.000Z"),
        timeStart: sch.timeStart,
        timeEnd: sch.timeEnd,
        type: "REGULAR",
        status: "SCHEDULED",
        scheduleId: sch.id
      });
    }
  }
  return lessons;
}

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
 
  // 5. Create initial students and guardians
  const studentsData = [
    {
      name: "Ana Clara Lima",
      birthDate: new Date("2019-05-15"),
      phone: "(11) 98765-4321",
      plan: "Mensal",
      notes: "Possui restrição leve no joelho esquerdo.",
      guardian: {
        name: "Carla Lima",
        phone: "(11) 98765-4321",
        email: "carla.lima@example.com",
        kinship: "Mãe"
      }
    },
    {
      name: "Beatriz Vasconcelos",
      birthDate: new Date("2018-09-22"),
      phone: "(11) 91234-5678",
      plan: "Semestral",
      notes: "Gosta de posições no centro. Muita flexibilidade.",
      guardian: {
        name: "Roberto Vasconcelos",
        phone: "(11) 91234-5678",
        email: "roberto.v@example.com",
        kinship: "Pai"
      }
    },
    {
      name: "Mariana Souza",
      birthDate: new Date("2015-02-10"),
      phone: "(11) 99887-7665",
      plan: "Anual",
      notes: "Concentrada, bom senso de ritmo.",
      guardian: {
        name: "Sandra Souza",
        phone: "(11) 99887-7665",
        email: "sandra.souza@example.com",
        kinship: "Mãe"
      }
    }
  ];

  for (const s of studentsData) {
    let student = await prisma.student.findFirst({
      where: {
        schoolId: school.id,
        name: s.name
      }
    });

    if (!student) {
      student = await prisma.student.create({
        data: {
          name: s.name,
          birthDate: s.birthDate,
          phone: s.phone,
          plan: s.plan,
          notes: s.notes,
          schoolId: school.id,
          isActive: true
        }
      });
      console.log(`Student created: ${student.name}`);

      let guardian = await prisma.guardian.findFirst({
        where: {
          name: s.guardian.name,
          phone: s.guardian.phone
        }
      });

      if (!guardian) {
        guardian = await prisma.guardian.create({
          data: {
            name: s.guardian.name,
            phone: s.guardian.phone,
            email: s.guardian.email
          }
        });
        console.log(`Guardian created: ${guardian.name}`);
      }

      await prisma.studentGuardian.create({
        data: {
          studentId: student.id,
          guardianId: guardian.id,
          kinship: s.guardian.kinship
        }
      });
      console.log(`Linked ${student.name} to guardian ${guardian.name} (${s.guardian.kinship})`);
    }
  }

  // 6. Create initial classes, schedules, enrollments, and lessons
  const classesData = [
    {
      name: "Ballet Infantil A",
      modalityName: "Ballet",
      teacherEmail: "teacher@danceflow.com",
      schedules: [
        { dayOfWeek: "Segunda", timeStart: "14:00", timeEnd: "15:00" },
        { dayOfWeek: "Quarta", timeStart: "14:00", timeEnd: "15:00" }
      ],
      studentNames: ["Ana Clara Lima", "Beatriz Vasconcelos"]
    },
    {
      name: "Jazz Infantil B",
      modalityName: "Jazz",
      teacherEmail: "teacher@danceflow.com",
      schedules: [
        { dayOfWeek: "Terça", timeStart: "15:30", timeEnd: "16:30" },
        { dayOfWeek: "Quinta", timeStart: "15:30", timeEnd: "16:30" }
      ],
      studentNames: ["Beatriz Vasconcelos"]
    },
    {
      name: "Ballet Infanto-Juvenil",
      modalityName: "Ballet",
      teacherEmail: "teacher@danceflow.com",
      schedules: [
        { dayOfWeek: "Segunda", timeStart: "16:00", timeEnd: "17:30" },
        { dayOfWeek: "Quarta", timeStart: "16:00", timeEnd: "17:30" }
      ],
      studentNames: ["Mariana Souza"]
    }
  ];

  const teacherUser = await prisma.user.findUnique({ where: { email: "teacher@danceflow.com" } });
  const balletMod = await prisma.modality.findFirst({ where: { schoolId: school.id, name: "Ballet" } });
  const jazzMod = await prisma.modality.findFirst({ where: { schoolId: school.id, name: "Jazz" } });

  const modMap = {
    "Ballet": balletMod,
    "Jazz": jazzMod
  };

  for (const c of classesData) {
    let dbClass = await prisma.class.findFirst({
      where: {
        schoolId: school.id,
        name: c.name
      }
    });

    if (!dbClass) {
      const activeMod = modMap[c.modalityName];
      
      dbClass = await prisma.class.create({
        data: {
          name: c.name,
          schoolId: school.id,
          modalityId: activeMod.id,
          mainTeacherId: teacherUser.id,
          isActive: true
        }
      });
      console.log(`Class created: ${dbClass.name}`);

      // Create schedules
      const createdSchedules = [];
      for (const sch of c.schedules) {
        const dbSchedule = await prisma.classSchedule.create({
          data: {
            classId: dbClass.id,
            dayOfWeek: sch.dayOfWeek,
            timeStart: sch.timeStart,
            timeEnd: sch.timeEnd
          }
        });
        createdSchedules.push(dbSchedule);
      }
      console.log(`Schedules created for ${dbClass.name}`);

      // Enroll students
      for (const sName of c.studentNames) {
        const student = await prisma.student.findFirst({ where: { schoolId: school.id, name: sName } });
        if (student) {
          await prisma.classStudent.create({
            data: {
              classId: dbClass.id,
              studentId: student.id,
              schedules: {
                connect: createdSchedules.map(s => ({ id: s.id }))
              }
            }
          });
          console.log(`Enrolled ${student.name} in ${dbClass.name}`);
        }
      }

      // Generate lessons
      const lessons = generateInitialLessonsForClass(dbClass.id, createdSchedules, new Date("2026-07-01"));
      for (const l of lessons) {
        await prisma.lesson.create({
          data: l
        });
      }
      console.log(`Generated ${lessons.length} lessons for ${dbClass.name}`);
    }
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
