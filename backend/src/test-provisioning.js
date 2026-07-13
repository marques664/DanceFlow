const { app } = require("./app");
const { basePrisma } = require("./shared/database/prisma");

const PORT = 3342;
let server;

async function runTests() {
  server = app.listen(PORT, async () => {
    console.log(`Provisioning Test server running on http://localhost:${PORT}`);

    try {
      const baseUrl = `http://localhost:${PORT}`;

      console.log("\n--- TEST 1: Provision New Tenant ---");
      const provisionRes = await fetch(`${baseUrl}/tenants/provision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolName: "Academia De Danca Teste",
          adminEmail: "diretoria@dancateste.com"
        }),
      });

      console.log(`Provision response status: ${provisionRes.status} (Expected: 201)`);
      const provisionData = await provisionRes.json();
      
      if (provisionRes.status !== 201) {
        throw new Error(`Provisioning failed: ${JSON.stringify(provisionData)}`);
      }

      const { schoolId, slug, token } = provisionData.data;
      console.log(`- School ID: ${schoolId}`);
      console.log(`- School Slug: ${slug}`);
      console.log(`- Token generated: ${token}`);

      console.log("\n--- TEST 2: Retrieve Activation Details ---");
      const detailsRes = await fetch(`${baseUrl}/tenants/activate?token=${token}`);
      console.log(`Details response status: ${detailsRes.status} (Expected: 200)`);
      const detailsData = await detailsRes.json();
      
      if (detailsRes.status !== 200) {
        throw new Error(`Retrieve details failed: ${JSON.stringify(detailsData)}`);
      }
      console.log(`- Retrived Email: ${detailsData.data.email} (Expected: diretoria@dancateste.com)`);
      console.log(`- Retrived School Name: ${detailsData.data.schoolName} (Expected: Academia De Danca Teste)`);

      if (detailsData.data.email !== "diretoria@dancateste.com" || detailsData.data.schoolName !== "Academia De Danca Teste") {
        throw new Error("Activation details mismatch.");
      }

      console.log("\n--- TEST 3: Activate Administrator Account ---");
      const activateRes = await fetch(`${baseUrl}/tenants/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          adminName: "Diretora Maria Silva",
          password: "password123"
        }),
      });

      console.log(`Activation response status: ${activateRes.status} (Expected: 200)`);
      const activateData = await activateRes.json();

      if (activateRes.status !== 200) {
        throw new Error(`Activation failed: ${JSON.stringify(activateData)}`);
      }
      console.log(`- JWT Token returned: ${activateData.data.token ? "Present" : "Missing"}`);
      console.log(`- User role: ${activateData.data.user.role} (Expected: ADMIN)`);

      console.log("\n--- TEST 4: Double Activation Attempt (Single-use Protection) ---");
      const doubleActivateRes = await fetch(`${baseUrl}/tenants/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          adminName: "Outro Nome",
          password: "anotherpassword"
        }),
      });
      console.log(`Double activation status: ${doubleActivateRes.status} (Expected: 400)`);
      if (doubleActivateRes.status !== 400) {
        throw new Error("Security leak: Token was reused for a double activation!");
      }

      console.log("\n--- TEST 5: Verify Login with New Admin Account ---");
      const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "diretoria@dancateste.com",
          password: "password123"
        }),
      });

      console.log(`Login response status: ${loginRes.status} (Expected: 200)`);
      const loginData = await loginRes.json();
      if (loginRes.status !== 200) {
        throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
      }
      console.log("Successfully logged in with new Admin credentials!");

      // 6. Clean up database
      console.log("\nCleaning up test database records...");
      await basePrisma.user.delete({ where: { email: "diretoria@dancateste.com" } });
      await basePrisma.activationToken.delete({ where: { token } });
      await basePrisma.school.delete({ where: { id: schoolId } });
      console.log("Cleanup completed.");

      console.log("\n✅ ALL PROVISIONING AND ACTIVATION TESTS PASSED SUCCESSFULLY!");
      shutdown(0);
    } catch (error) {
      console.error("\n❌ PROVISIONING TEST FAILED WITH ERROR:", error);
      shutdown(1);
    }
  });
}

function shutdown(code) {
  if (server) {
    server.close(() => {
      console.log("Provisioning Test server closed.");
      process.exit(code);
    });
  } else {
    process.exit(code);
  }
}

runTests();
