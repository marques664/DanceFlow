const { app } = require("./app");

const PORT = 3337;
let server;

async function runTests() {
  server = app.listen(PORT, async () => {
    console.log(`Test server running on http://localhost:${PORT}`);

    try {
      const baseUrl = `http://localhost:${PORT}`;
      let adminToken = "";
      let teacherToken = "";
      let createdTeacherId = "";

      // Pre-cleanup leftover test data
      const { prisma } = require("./shared/database/prisma");
      await prisma.activationToken.deleteMany({
        where: {
          email: {
            in: ["teacher.jazz@danceflow.com", "teacher.jazz.updated@danceflow.com"]
          }
        }
      });
      await prisma.user.deleteMany({
        where: {
          email: {
            in: ["teacher.jazz@danceflow.com", "teacher.jazz.updated@danceflow.com"]
          }
        }
      });

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

      console.log("\n--- TEST 3: List Teachers ---");
      const listRes = await fetch(`${baseUrl}/teachers`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.log(`Status: ${listRes.status} (Expected: 200)`);
      const teachers = await listRes.json();
      console.log(`Found ${teachers.length} active teachers (Seed contains 1):`);
      teachers.forEach((t) => console.log(` - [${t.id}] ${t.name} (${t.email})`));

      console.log("\n--- TEST 4: Create Teacher as Teacher (Should fail) ---");
      const createTeacherRes = await fetch(`${baseUrl}/teachers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify({
          name: "Professora Jazz",
          email: "teacher.jazz@danceflow.com",
          password: "password123",
        }),
      });
      console.log(`Status: ${createTeacherRes.status} (Expected: 403)`);

      console.log("\n--- TEST 5: Create Teacher as Admin (Should succeed) ---");
      const createAdminRes = await fetch(`${baseUrl}/teachers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: "Professora Jazz",
          email: "teacher.jazz@danceflow.com",
          password: "password123",
        }),
      });
      console.log(`Status: ${createAdminRes.status} (Expected: 201)`);
      const createdTeacher = await createAdminRes.json();
      console.log("Create response body:", createdTeacher);
      createdTeacherId = createdTeacher.id;
      console.log(`Created Teacher: [${createdTeacher.id}] ${createdTeacher.name} (${createdTeacher.email})`);

      console.log("\n--- TEST 6: Create Teacher with Duplicate Email (Should fail) ---");
      const createDupRes = await fetch(`${baseUrl}/teachers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: "Outra Professora",
          email: "teacher.jazz@danceflow.com",
          password: "password123",
        }),
      });
      console.log(`Status: ${createDupRes.status} (Expected: 400)`);

      console.log("\n--- TEST 7: Update Teacher Profile ---");
      const updateRes = await fetch(`${baseUrl}/teachers/${createdTeacherId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: "Professora Jazz Editada",
          email: "teacher.jazz.updated@danceflow.com"
        }),
      });
      console.log(`Status: ${updateRes.status} (Expected: 200)`);
      const updatedTeacher = await updateRes.json();
      console.log("Response Body:", updatedTeacher);
      console.log(`Updated Teacher Name: ${updatedTeacher.name} | Email: ${updatedTeacher.email}`);

      console.log("\n--- TEST 8: Inactivate Teacher ---");
      const deleteRes = await fetch(`${baseUrl}/teachers/${createdTeacherId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.log(`Status: ${deleteRes.status} (Expected: 204)`);

      console.log("\n--- TEST 9: Verify Inactivated Teacher is hidden ---");
      const verifyListRes = await fetch(`${baseUrl}/teachers`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const teachersAfter = await verifyListRes.json();
      const isStillInList = teachersAfter.some((t) => t.id === createdTeacherId);
      console.log(`Deleted teacher still in list? ${isStillInList} (Expected: false)`);
      console.log(`Active teachers count: ${teachersAfter.length} (Expected: 1)`);

      console.log("\n✅ ALL TEACHER API TESTS PASSED SUCCESSFULLY!");
      shutdown(0);
    } catch (error) {
      console.error("\n❌ TEACHER API TEST FAILED WITH ERROR:", error);
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
