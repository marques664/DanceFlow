const { StudentService } = require("./modules/students/StudentService");
const { prisma } = require("./shared/database/prisma");

const studentService = new StudentService();

async function runVerification() {
  console.log("--- STARTING STUDENT EDIT AND CLASS LINKS SYNC VERIFICATION ---\n");

  try {
    // 1. Get pilot school and admin
    const school = await prisma.school.findFirst({
      where: { name: "Escola Piloto de Dança" }
    });
    if (!school) throw new Error("School not found! Run seed.");

    const admin = await prisma.user.findFirst({
      where: { schoolId: school.id, role: "ADMIN" }
    });
    if (!admin) throw new Error("Admin user not found! Run seed.");

    // 2. Fetch or create a test student
    let student = await prisma.student.findFirst({
      where: { name: "Aluna Teste Edicao", schoolId: school.id }
    });

    if (!student) {
      student = await prisma.student.create({
        data: {
          name: "Aluna Teste Edicao",
          birthDate: new Date("2015-05-15"),
          phone: "(11) 98888-5555",
          plan: "Mensal",
          schoolId: school.id,
          isActive: true
        }
      });
      console.log(`Created test student: ${student.name} (${student.id})`);
    } else {
      console.log(`Using existing test student: ${student.name} (${student.id})`);
    }

    // 3. Fetch school classes and schedules
    const classes = await prisma.class.findMany({
      where: { schoolId: school.id, isActive: true },
      include: { schedules: true }
    });

    if (classes.length < 2) {
      throw new Error("Ensure you have at least 2 active classes in the database for the test.");
    }

    const classA = classes[0];
    const classB = classes[1];

    console.log(`Class A: "${classA.name}" (Schedules count: ${classA.schedules.length})`);
    console.log(`Class B: "${classB.name}" (Schedules count: ${classB.schedules.length})`);

    // 4. Enroll student in Class A and Class B initially
    console.log("\nEnrolling student in both classes initially...");
    await prisma.classStudent.deleteMany({ where: { studentId: student.id } }); // clean start
    
    await prisma.classStudent.create({
      data: {
        studentId: student.id,
        classId: classA.id,
        schedules: {
          connect: classA.schedules.map(s => ({ id: s.id }))
        }
      }
    });

    await prisma.classStudent.create({
      data: {
        studentId: student.id,
        classId: classB.id,
        schedules: {
          connect: classB.schedules.map(s => ({ id: s.id }))
        }
      }
    });

    let currentEnrollments = await prisma.classStudent.findMany({
      where: { studentId: student.id },
      include: { class: true }
    });
    console.log("Current enrollments:", currentEnrollments.map(e => e.class.name));

    // 5. Run the update method to REMOVE Class B and update Class A schedules
    console.log("\nRunning update operation (retaining Class A, removing Class B)...");
    const updatedData = {
      name: "Aluna Teste Edicao Alterado",
      birthDate: "2015-05-15",
      phone: "(11) 98888-5555",
      plan: "Semestral",
      notes: "Observação de edicao",
      guardian: null,
      classes: [
        {
          classId: classA.id,
          // Only link to the first schedule of Class A (updating schedules)
          scheduleIds: [classA.schedules[0].id]
        }
      ]
    };

    const result = await studentService.update(
      school.id,
      admin.id,
      student.id,
      updatedData
    );

    console.log(`Update succeeded! Student name in response: "${result.name}"`);

    // 6. Verify final database state
    const finalEnrollments = await prisma.classStudent.findMany({
      where: { studentId: student.id },
      include: { class: true, schedules: true }
    });

    console.log("\n--- VERIFICATION RESULT ---");
    console.log(`Active enrollments in DB: ${finalEnrollments.length}`);
    finalEnrollments.forEach(e => {
      console.log(`- Enrolled Class: "${e.class.name}"`);
      console.log(`  Schedules Linked:`, e.schedules.map(s => `${s.dayOfWeek} ${s.timeStart}-${s.timeEnd}`));
    });

    // Check if Class B is removed and Class A schedules is updated correctly
    const hasClassB = finalEnrollments.some(e => e.classId === classB.id);
    const classALink = finalEnrollments.find(e => e.classId === classA.id);
    const schedulesCount = classALink ? classALink.schedules.length : 0;

    if (!hasClassB && classALink && schedulesCount === 1) {
      console.log("\n✅ SUCCESS: Class B removed successfully and Class A schedules synchronized!");
    } else {
      console.error("\n❌ FAILURE: Verification conditions not met.");
      console.log(`- hasClassB (expected false): ${hasClassB}`);
      console.log(`- classALink exists (expected true): ${!!classALink}`);
      console.log(`- schedulesCount (expected 1): ${schedulesCount}`);
    }

  } catch (error) {
    console.error("Verification crashed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runVerification();
