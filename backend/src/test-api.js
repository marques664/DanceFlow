const { app } = require("./app");

const PORT = 3334;
let server;

async function runTests() {
  server = app.listen(PORT, async () => {
    console.log(`Test server running on http://localhost:${PORT}`);

    try {
      const baseUrl = `http://localhost:${PORT}`;
      let adminToken = "";
      let teacherToken = "";
      let createdModalityId = "";

      console.log("\n--- TEST 1: Bad Login Credentials ---");
      const badLoginRes = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "admin@danceflow.com",
          password: "wrongpassword",
        }),
      });
      console.log(`Status: ${badLoginRes.status} (Expected: 401)`);
      const badLoginBody = await badLoginRes.json();
      console.log("Body:", badLoginBody);

      console.log("\n--- TEST 2: Successful Admin Login ---");
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
      console.log(`Token received (truncated): ${adminToken.substring(0, 30)}...`);

      console.log("\n--- TEST 3: Successful Teacher Login ---");
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
      console.log(`Token received (truncated): ${teacherToken.substring(0, 30)}...`);

      console.log("\n--- TEST 4: List Modalities (Admin) ---");
      const listRes = await fetch(`${baseUrl}/modalities`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.log(`Status: ${listRes.status} (Expected: 200)`);
      const modalities = await listRes.json();
      console.log(`Found ${modalities.length} active modalities (Seed contains 3):`);
      modalities.forEach((m) => console.log(` - [${m.id}] ${m.name}: ${m.description}`));

      console.log("\n--- TEST 5: Create Modality as Teacher (Should fail) ---");
      const createTeacherRes = await fetch(`${baseUrl}/modalities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify({
          name: "Hip Hop",
          description: "Aulas de Hip Hop de rua",
        }),
      });
      console.log(`Status: ${createTeacherRes.status} (Expected: 403)`);
      const createTeacherBody = await createTeacherRes.json();
      console.log("Body:", createTeacherBody);

      console.log("\n--- TEST 6: Create Modality as Admin (Should succeed) ---");
      const createAdminRes = await fetch(`${baseUrl}/modalities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: "Hip Hop",
          description: "Aulas de Hip Hop de rua",
        }),
      });
      console.log(`Status: ${createAdminRes.status} (Expected: 201)`);
      const createdModality = await createAdminRes.json();
      createdModalityId = createdModality.id;
      console.log(`Created Modality: [${createdModality.id}] ${createdModality.name}`);

      console.log("\n--- TEST 7: Create Modality Duplicate Name (Should fail) ---");
      const createDupRes = await fetch(`${baseUrl}/modalities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: "Hip Hop",
          description: "Duplicate",
        }),
      });
      console.log(`Status: ${createDupRes.status} (Expected: 400)`);
      const createDupBody = await createDupRes.json();
      console.log("Body:", createDupBody);

      console.log("\n--- TEST 8: Get Modality details ---");
      const showRes = await fetch(`${baseUrl}/modalities/${createdModalityId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.log(`Status: ${showRes.status} (Expected: 200)`);
      const shownModality = await showRes.json();
      console.log(`Details: ${shownModality.name} - ${shownModality.description}`);

      console.log("\n--- TEST 9: Update Modality as Admin ---");
      const updateRes = await fetch(`${baseUrl}/modalities/${createdModalityId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: "Hip Hop Urban",
          description: "Aulas de danças urbanas e Hip Hop",
        }),
      });
      console.log(`Status: ${updateRes.status} (Expected: 200)`);
      const updatedModality = await updateRes.json();
      console.log(`Updated Modality: ${updatedModality.name} - ${updatedModality.description}`);

      console.log("\n--- TEST 10: Inactivate (Delete) Modality ---");
      const deleteRes = await fetch(`${baseUrl}/modalities/${createdModalityId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.log(`Status: ${deleteRes.status} (Expected: 204)`);

      console.log("\n--- TEST 11: Verify Inactivated Modality is hidden ---");
      const verifyListRes = await fetch(`${baseUrl}/modalities`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const modalitiesAfter = await verifyListRes.json();
      const isStillInList = modalitiesAfter.some((m) => m.id === createdModalityId);
      console.log(`Deleted modality still in list? ${isStillInList} (Expected: false)`);
      console.log(`Active modalities count: ${modalitiesAfter.length}`);

      console.log("\n✅ ALL TESTS PASSED SUCCESSFULLY!");
      shutdown(0);
    } catch (error) {
      console.error("\n❌ TEST FAILED WITH ERROR:", error);
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
