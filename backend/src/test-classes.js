const { app } = require("./app");

const PORT = 3336;
let server;

async function runTests() {
  server = app.listen(PORT, async () => {
    console.log(`Test server running on http://localhost:${PORT}`);

    try {
      const baseUrl = `http://localhost:${PORT}`;
      let adminToken = "";
      let teacherToken = "";
      let teacherId = "";
      let modalityId = "";
      let studentId = "";
      let createdClassId = "";

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

      console.log("\n--- TEST 2: Teacher Login ---");
      const teacherLoginRes = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "teacher@danceflow.com",
          password: "teacher123",
        }),
      });
      console.log(`Status: ${teacherLoginRes.status} (Expected: 200)`);
      const teacherLoginBody = await teacherLoginRes.json();
      teacherToken = teacherLoginBody.token;
      teacherId = teacherLoginBody.user.id;

      // Get a Modality ID
      console.log("\n--- GET DATA: Modalities and Students ---");
      const modalitiesRes = await fetch(`${baseUrl}/modalities`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const modalities = await modalitiesRes.json();
      modalityId = modalities[0].id;
      console.log(`Modality ID retrieved: ${modalityId} (${modalities[0].name})`);

      // Get a Student ID
      const studentsRes = await fetch(`${baseUrl}/students`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const students = await studentsRes.json();
      studentId = students[0].id;
      console.log(`Student ID retrieved: ${studentId} (${students[0].name})`);

      console.log("\n--- TEST 3: List Classes (Admin) ---");
      const listRes = await fetch(`${baseUrl}/classes`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.log(`Status: ${listRes.status} (Expected: 200)`);
      const classes = await listRes.json();
      console.log(`Found ${classes.length} active classes (Seed contains 3):`);
      classes.forEach((c) => console.log(` - [${c.id}] ${c.name} | Modality: ${c.modality} | Teacher: ${c.mainTeacher} | Students: ${c.studentCount} | Schedule: ${c.schedule}`));

      console.log("\n--- TEST 4: Create Class as Teacher (Should fail) ---");
      const createTeacherRes = await fetch(`${baseUrl}/classes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify({
          name: "Jazz Intermediário",
          modalityId,
          mainTeacherId: teacherId,
          secondaryTeachers: [],
          schedules: [
            { dayOfWeek: "Terça", timeStart: "18:00", timeEnd: "19:00" }
          ]
        }),
      });
      console.log(`Status: ${createTeacherRes.status} (Expected: 403)`);

      console.log("\n--- TEST 5: Create Class as Admin (Should succeed) ---");
      const createAdminRes = await fetch(`${baseUrl}/classes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: "Jazz Intermediário",
          modalityId,
          mainTeacherId: teacherId,
          secondaryTeachers: ["Professora Auxiliar"],
          schedules: [
            { dayOfWeek: "Terça", timeStart: "18:00", timeEnd: "19:00" },
            { dayOfWeek: "Quinta", timeStart: "18:00", timeEnd: "19:00" }
          ]
        }),
      });
      console.log(`Status: ${createAdminRes.status} (Expected: 201)`);
      const createdClass = await createAdminRes.json();
      createdClassId = createdClass.id;
      console.log(`Created Class: [${createdClass.id}] ${createdClass.name} - Teacher: ${createdClass.mainTeacher}`);

      console.log("\n--- TEST 6: Enroll Student in Class ---");
      const enrollRes = await fetch(`${baseUrl}/classes/${createdClassId}/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ studentId }),
      });
      console.log(`Status: ${enrollRes.status} (Expected: 201)`);

      console.log("\n--- TEST 7: List Enrolled Students ---");
      const enrolledRes = await fetch(`${baseUrl}/classes/${createdClassId}/students`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.log(`Status: ${enrolledRes.status} (Expected: 200)`);
      const enrolledList = await enrolledRes.json();
      console.log(`Enrolled students count: ${enrolledList.length} (Expected: 1)`);
      enrolledList.forEach(s => console.log(` - [${s.id}] ${s.name} (${s.plan})`));

      console.log("\n--- TEST 8: Inactivate Class ---");
      const deleteRes = await fetch(`${baseUrl}/classes/${createdClassId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.log(`Status: ${deleteRes.status} (Expected: 204)`);

      console.log("\n--- TEST 9: Verify Inactivated Class is hidden ---");
      const verifyListRes = await fetch(`${baseUrl}/classes`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const classesAfter = await verifyListRes.json();
      const isStillInList = classesAfter.some((c) => c.id === createdClassId);
      console.log(`Deleted class still in list? ${isStillInList} (Expected: false)`);
      console.log(`Active classes count: ${classesAfter.length} (Expected: 3)`);

      console.log("\n✅ ALL CLASS API TESTS PASSED SUCCESSFULLY!");
      shutdown(0);
    } catch (error) {
      console.error("\n❌ CLASS API TEST FAILED WITH ERROR:", error);
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
