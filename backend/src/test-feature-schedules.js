const { app } = require("./app");
const { prisma } = require("./shared/database/prisma");

const PORT = 3339;
let server;

async function runTests() {
  server = app.listen(PORT, async () => {
    console.log(`Test server running on http://localhost:${PORT}`);

    try {
      const baseUrl = `http://localhost:${PORT}`;
      let adminToken = "";
      let teacherToken = "";
      let studentAId = "";
      let studentBId = "";
      let classId = "";
      let scheduleQuintaId = "";
      let scheduleSabadoId = "";

      console.log("\n--- TEST 1: Admin & Teacher Logins ---");
      const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@danceflow.com", password: "admin123" }),
      });
      const adminLoginBody = await adminLoginRes.json();
      adminToken = adminLoginBody.token;
      console.log("Admin logged in successfully.");

      const teacherLoginRes = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "teacher@danceflow.com", password: "teacher123" }),
      });
      const teacherLoginBody = await teacherLoginRes.json();
      teacherToken = teacherLoginBody.token;
      const teacherId = teacherLoginBody.user.id;
      console.log("Teacher logged in successfully.");

      // Fetch student IDs
      const studentsRes = await fetch(`${baseUrl}/students`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const students = await studentsRes.json();
      studentAId = students.find(s => s.name === "Ana Clara Lima").id;
      studentBId = students.find(s => s.name === "Beatriz Vasconcelos").id;
      console.log(`Student A (Ana Clara Lima) ID: ${studentAId}`);
      console.log(`Student B (Beatriz Vasconcelos) ID: ${studentBId}`);

      // Fetch modality ID
      const modalitiesRes = await fetch(`${baseUrl}/modalities`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const modalities = await modalitiesRes.json();
      const modalityId = modalities[0].id;
      console.log(`Modality ID: ${modalityId} (${modalities[0].name})`);

      console.log("\n--- TEST 2: Create Class with Multiple Schedules ---");
      const createClassRes = await fetch(`${baseUrl}/classes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: "Baby Ballet Flex",
          modalityId,
          mainTeacherId: teacherId,
          schedules: [
            { dayOfWeek: "Quinta", timeStart: "19:00", timeEnd: "20:00" },
            { dayOfWeek: "Sábado", timeStart: "09:00", timeEnd: "10:00" }
          ]
        }),
      });
      console.log(`Status: ${createClassRes.status} (Expected: 201)`);
      const classBody = await createClassRes.json();
      classId = classBody.id;
      scheduleQuintaId = classBody.schedules.find(s => s.dayOfWeek === "Quinta").id;
      scheduleSabadoId = classBody.schedules.find(s => s.dayOfWeek === "Sábado").id;
      console.log(`Class Created: ${classBody.name} (${classId})`);
      console.log(` - Quinta Schedule ID: ${scheduleQuintaId}`);
      console.log(` - Sábado Schedule ID: ${scheduleSabadoId}`);

      console.log("\n--- TEST 3: Enroll Student A in BOTH schedules ---");
      const enrollARes = await fetch(`${baseUrl}/classes/${classId}/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          studentId: studentAId,
          scheduleIds: [scheduleQuintaId, scheduleSabadoId]
        }),
      });
      console.log(`Status: ${enrollARes.status} (Expected: 201)`);
      const enrollABody = await enrollARes.json();
      console.log(`Student A schedules enrolled count: ${enrollABody.schedules.length} (Expected: 2)`);

      console.log("\n--- TEST 4: Enroll Student B in Quinta schedule ONLY ---");
      const enrollBRes = await fetch(`${baseUrl}/classes/${classId}/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          studentId: studentBId,
          scheduleIds: [scheduleQuintaId]
        }),
      });
      console.log(`Status: ${enrollBRes.status} (Expected: 201)`);
      const enrollBBody = await enrollBRes.json();
      console.log(`Student B schedules enrolled count: ${enrollBBody.schedules.length} (Expected: 1)`);

      console.log("\n--- TEST 5: Verify Enrolled Students in Class lists ---");
      const enrolledStudentsRes = await fetch(`${baseUrl}/classes/${classId}/students`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const enrolledStudents = await enrolledStudentsRes.json();
      console.log(`Total enrolled: ${enrolledStudents.length} (Expected: 2)`);
      enrolledStudents.forEach(s => {
        console.log(` - Student: ${s.name} | Assigned Schedules: ${s.schedules.map(sch => sch.dayOfWeek).join(", ")}`);
      });

      console.log("\n--- TEST 6: Fetch Lessons and Check Attendance Filtering ---");
      const lessonsRes = await fetch(`${baseUrl}/lessons?classId=${classId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const lessons = await lessonsRes.json();
      console.log(`Generated lessons count: ${lessons.length}`);

      const quintaLesson = lessons.find(l => l.timeStart === "19:00");
      const sabadoLesson = lessons.find(l => l.timeStart === "09:00");

      console.log(`\nLesson Quinta details ID: ${quintaLesson.id} on ${quintaLesson.date}`);
      const qRes = await fetch(`${baseUrl}/lessons/${quintaLesson.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const qDetails = await qRes.json();
      console.log(`Quinta eligible students count: ${qDetails.students.length} (Expected: 2)`);
      qDetails.students.forEach(s => console.log(` - Student: ${s.name}`));
      if (qDetails.students.length !== 2) {
        throw new Error("Quinta lesson should list both Student A and Student B.");
      }

      console.log(`\nLesson Sábado details ID: ${sabadoLesson.id} on ${sabadoLesson.date}`);
      const sRes = await fetch(`${baseUrl}/lessons/${sabadoLesson.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const sDetails = await sRes.json();
      console.log(`Sábado eligible students count: ${sDetails.students.length} (Expected: 1)`);
      sDetails.students.forEach(s => console.log(` - Student: ${s.name}`));
      if (sDetails.students.length !== 1 || sDetails.students[0].id !== studentAId) {
        throw new Error("Sábado lesson should list ONLY Student A (Ana Clara Lima).");
      }

      console.log("\n--- TEST 7: Register Attendance and Check Dashboard Stats ---");
      // Clean previous attendances first to have clean stats
      await prisma.attendance.deleteMany({});

      // Quinta Lesson: Mark both Present
      const attQRes = await fetch(`${baseUrl}/lessons/${quintaLesson.id}/attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          isDraft: false,
          records: [
            { studentId: studentAId, status: "PRESENT" },
            { studentId: studentBId, status: "PRESENT" }
          ]
        })
      });
      console.log(`Quinta attendance register: ${attQRes.status} (Expected: 200)`);

      // Sábado Lesson: Mark Student A ABSENT
      const attSRes = await fetch(`${baseUrl}/lessons/${sabadoLesson.id}/attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          isDraft: false,
          records: [
            { studentId: studentAId, status: "ABSENT" }
          ]
        })
      });
      console.log(`Sábado attendance register: ${attSRes.status} (Expected: 200)`);

      // Fetch stats
      const statsRes = await fetch(`${baseUrl}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const stats = await statsRes.json();
      console.log(`Dashboard Active Students: ${stats.activeStudents}`);
      console.log(`Dashboard Concluded Lessons: ${stats.concludedLessons}`);
      
      const warningA = stats.lowAttendanceWarnings.find(w => w.id === studentAId);
      const warningB = stats.lowAttendanceWarnings.find(w => w.id === studentBId);

      console.log("\nVerify Student B stats:");
      console.log(`- Is Student B in low attendance warnings? ${!!warningB} (Expected: false, since they have 1/1 presents = 100%)`);
      if (warningB) {
        throw new Error("Student B should not be in warnings (attendance is 100%).");
      }

      console.log("\nVerify Student A stats:");
      console.log(`- Is Student A in low attendance warnings? ${!!warningA} (Expected: true)`);
      if (!warningA) {
        throw new Error("Student A should be in warnings (attendance is 50%).");
      }
      console.log(`- Student A attendance rate: ${warningA.attendanceRate}% (Expected: 50%)`);
      if (warningA.attendanceRate !== 50) {
        throw new Error(`Student A attendance rate expected 50%, got ${warningA.attendanceRate}`);
      }

      console.log("\n✅ FP-001 FLEXIBLE SCHEDULES END-TO-END TESTS PASSED SUCCESSFULLY!");
      shutdown(0);
    } catch (error) {
      console.error("\n❌ FP-001 TEST FAILED WITH ERROR:", error);
      shutdown(1);
    }
  });
}

function shutdown(code) {
  if (server) {
    server.close(() => {
      console.log("Test server closed.");
      process.exit(code);
    });
  } else {
    process.exit(code);
  }
}

runTests();
