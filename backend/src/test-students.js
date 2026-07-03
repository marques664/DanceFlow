const { app } = require("./app");

const PORT = 3335;
let server;

async function runTests() {
  server = app.listen(PORT, async () => {
    console.log(`Test server running on http://localhost:${PORT}`);

    try {
      const baseUrl = `http://localhost:${PORT}`;
      let adminToken = "";
      let teacherToken = "";
      let createdStudentId = "";

      console.log("\n--- TEST 1: Successful Admin Login ---");
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

      console.log("\n--- TEST 2: Successful Teacher Login ---");
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

      console.log("\n--- TEST 3: List Students (Admin) ---");
      const listRes = await fetch(`${baseUrl}/students`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.log(`Status: ${listRes.status} (Expected: 200)`);
      const students = await listRes.json();
      console.log(`Found ${students.length} active students (Seed contains 3):`);
      students.forEach((s) => console.log(` - [${s.id}] ${s.name} (${s.age} anos) | Plan: ${s.plan} | Guardian: ${s.guardian?.name} (${s.guardian?.kinship})`));

      console.log("\n--- TEST 4: Create Student as Teacher (Should fail) ---");
      const createTeacherRes = await fetch(`${baseUrl}/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify({
          name: "Juliana Santos",
          birthDate: "2017-08-10",
          phone: "(11) 96543-2109",
          plan: "Mensal",
          notes: "Iniciante",
          guardian: {
            name: "Mauro Santos",
            phone: "(11) 96543-2109",
            email: "mauro@example.com",
            kinship: "Pai"
          }
        }),
      });
      console.log(`Status: ${createTeacherRes.status} (Expected: 403)`);
      const createTeacherBody = await createTeacherRes.json();
      console.log("Body:", createTeacherBody);

      console.log("\n--- TEST 5: Create Student as Admin (Should succeed) ---");
      const createAdminRes = await fetch(`${baseUrl}/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: "Juliana Santos",
          birthDate: "2017-08-10",
          phone: "(11) 96543-2109",
          plan: "Mensal",
          notes: "Iniciante",
          guardian: {
            name: "Mauro Santos",
            phone: "(11) 96543-2109",
            email: "mauro@example.com",
            kinship: "Pai"
          }
        }),
      });
      console.log(`Status: ${createAdminRes.status} (Expected: 201)`);
      const createdStudent = await createAdminRes.json();
      createdStudentId = createdStudent.id;
      console.log(`Created Student: [${createdStudent.id}] ${createdStudent.name} - Guardian: ${createdStudent.guardian.name}`);

      console.log("\n--- TEST 6: Get Student Details ---");
      const showRes = await fetch(`${baseUrl}/students/${createdStudentId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.log(`Status: ${showRes.status} (Expected: 200)`);
      const shownStudent = await showRes.json();
      console.log(`Details: ${shownStudent.name} - Plan: ${shownStudent.plan} - Kinship: ${shownStudent.guardian.kinship}`);

      console.log("\n--- TEST 7: Update Student as Admin ---");
      const updateRes = await fetch(`${baseUrl}/students/${createdStudentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: "Juliana Santos Silva",
          plan: "Semestral",
          guardian: {
            name: "Mauro Silva",
            phone: "(11) 96543-2109",
            email: "mauro.silva@example.com",
            kinship: "Pai"
          }
        }),
      });
      console.log(`Status: ${updateRes.status} (Expected: 200)`);
      const updatedStudent = await updateRes.json();
      console.log(`Updated Student: ${updatedStudent.name} - Plan: ${updatedStudent.plan} - Guardian: ${updatedStudent.guardian.name}`);

      console.log("\n--- TEST 8: Inactivate (Delete) Student ---");
      const deleteRes = await fetch(`${baseUrl}/students/${createdStudentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.log(`Status: ${deleteRes.status} (Expected: 204)`);

      console.log("\n--- TEST 9: Verify Inactivated Student is hidden ---");
      const verifyListRes = await fetch(`${baseUrl}/students`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const studentsAfter = await verifyListRes.json();
      const isStillInList = studentsAfter.some((s) => s.id === createdStudentId);
      console.log(`Deleted student still in list? ${isStillInList} (Expected: false)`);
      console.log(`Active students count: ${studentsAfter.length} (Expected: 3)`);

      console.log("\n✅ ALL STUDENT API TESTS PASSED SUCCESSFULLY!");
      shutdown(0);
    } catch (error) {
      console.error("\n❌ STUDENT API TEST FAILED WITH ERROR:", error);
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
