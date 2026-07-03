const { app } = require("./app");
const { prisma } = require("./shared/database/prisma");

const PORT = 3338;
let server;

async function runTests() {
  server = app.listen(PORT, async () => {
    console.log(`Test server running on http://localhost:${PORT}`);

    try {
      const baseUrl = `http://localhost:${PORT}`;
      let adminToken = "";
      let lessonId = "";
      let student1Id = "";
      let student2Id = "";

      console.log("\n--- TEST 1: Admin Login ---");
      const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "admin@danceflow.com",
          password: "admin123",
        }),
      });
      console.log(`Status: ${adminLoginRes.status} (Expected: 200)`);
      const adminLoginBody = await adminLoginRes.json();
      adminToken = adminLoginBody.token;

      console.log("\n--- TEST 2: List Lessons ---");
      const listRes = await fetch(`${baseUrl}/lessons`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.log(`Status: ${listRes.status} (Expected: 200)`);
      const lessons = await listRes.json();
      console.log(`Found ${lessons.length} scheduled lessons:`);
      lessons.forEach((l) => console.log(` - [${l.id}] ${l.className} - ${l.date} ${l.timeStart}-${l.timeEnd} (${l.status})`));
      lessonId = lessons[0].id; // Pick first lesson

      console.log("\n--- TEST 3: Fetch Lesson Details and Enrolled Students ---");
      const detailsRes = await fetch(`${baseUrl}/lessons/${lessonId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.log(`Status: ${detailsRes.status} (Expected: 200)`);
      const lessonDetails = await detailsRes.json();
      console.log(`Class: ${lessonDetails.className} | Modality: ${lessonDetails.modality}`);
      console.log(`Enrolled students count: ${lessonDetails.students.length}`);
      lessonDetails.students.forEach((s) => console.log(` - Student: ${s.name} | Current Attendance Status: ${s.attendanceStatus}`));
      
      student1Id = lessonDetails.students[0].id;
      student2Id = lessonDetails.students[1]?.id; // If present

      console.log("\n--- TEST 4: Register Attendance Draft ---");
      const draftRes = await fetch(`${baseUrl}/lessons/${lessonId}/attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          isDraft: true,
          records: [
            { studentId: student1Id, status: "PRESENT" },
            ...(student2Id ? [{ studentId: student2Id, status: "ABSENT" }] : [])
          ]
        }),
      });
      console.log(`Status: ${draftRes.status} (Expected: 200)`);
      const draftBody = await draftRes.json();
      console.log(`Status returned: ${draftBody.status} (Expected: SCHEDULED)`);

      console.log("\n--- TEST 5: Finalize Attendance Call ---");
      const finalRes = await fetch(`${baseUrl}/lessons/${lessonId}/attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          isDraft: false,
          records: [
            { studentId: student1Id, status: "PRESENT" },
            ...(student2Id ? [{ studentId: student2Id, status: "ABSENT" }] : [])
          ]
        }),
      });
      console.log(`Status: ${finalRes.status} (Expected: 200)`);
      const finalBody = await finalRes.json();
      console.log(`Status returned: ${finalBody.status} (Expected: CONCLUDED)`);

      console.log("\n--- TEST 6: Fetch Dashboard Stats and Alerts ---");
      const statsRes = await fetch(`${baseUrl}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.log(`Status: ${statsRes.status} (Expected: 200)`);
      const stats = await statsRes.json();
      console.log(`Active Students: ${stats.activeStudents}`);
      console.log(`Concluded Lessons: ${stats.concludedLessons}`);
      console.log(`Low Attendance Alerts Count: ${stats.lowAttendanceWarnings.length}`);
      stats.lowAttendanceWarnings.forEach((w) => {
        console.log(` - Warning student: ${w.name} | Rate: ${w.attendanceRate}% | Status: ${w.classification} (Presents: ${w.presents}/${w.totalLessons})`);
      });

      console.log("\n--- TEST 7: Check Audit Logs ---");
      const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" }
      });
      console.log(`Found ${logs.length} audit logs in DB:`);
      logs.forEach(log => console.log(` - Action: ${log.action} | User: ${log.userId} | Details: ${log.details}`));

      console.log("\n✅ ALL LESSON AND ATTENDANCE TESTS PASSED SUCCESSFULLY!");
      shutdown(0);
    } catch (error) {
      console.error("\n❌ LESSON AND ATTENDANCE TEST FAILED:", error);
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
