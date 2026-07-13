const { app } = require("./app");
const { prisma, basePrisma } = require("./shared/database/prisma");

const PORT = 3341;
let server;

async function runTests() {
  server = app.listen(PORT, async () => {
    console.log(`Security Test server running on http://localhost:${PORT}`);

    try {
      const baseUrl = `http://localhost:${PORT}`;

      console.log("\n--- TEST 1: Helmet Security Headers ---");
      const testHeadersRes = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "invalid@email.com", password: "wrong" }),
      });
      
      const xContentTypeOptions = testHeadersRes.headers.get("x-content-type-options");
      const xFrameOptions = testHeadersRes.headers.get("x-frame-options");
      console.log(`- X-Content-Type-Options: ${xContentTypeOptions} (Expected: nosniff)`);
      console.log(`- X-Frame-Options: ${xFrameOptions} (Expected: SAMEORIGIN)`);
      if (xContentTypeOptions !== "nosniff" || xFrameOptions !== "SAMEORIGIN") {
        throw new Error("Helmet headers are missing or configured incorrectly.");
      }
      console.log("Helmet Headers verified successfully.");

      console.log("\n--- TEST 2: Login Rate Limiter (Brute-Force Protection) ---");
      console.log("Sending multiple fast requests to /auth/login to trigger the rate limiter...");
      let rateLimited = false;
      
      // Send 12 requests (limit is 10 per hour)
      for (let i = 0; i < 12; i++) {
        const res = await fetch(`${baseUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "spam@danceflow.com", password: "spam" }),
        });

        if (res.status === 429) {
          rateLimited = true;
          console.log(`- Request ${i + 1}: Rate limited successfully (Status 429).`);
          break;
        }
      }

      if (!rateLimited) {
        throw new Error("Login rate limiter was not triggered.");
      }
      console.log("Rate limiter verified successfully.");

      console.log("\n--- TEST 3: Tenant Data Isolation (Prisma Client Extension) ---");
      
      // 1. Get School A admin token
      const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Bypass rate limiter by using different login or wait (we will bypass the rate limit block since we only need 1 login)
        // Wait, since we are blocked on this IP from Test 2, let's bypass by calling the auth service directly to get token, 
        // OR reset rate limits?
        // Actually, we can just get the token using the AuthService! That's very easy and doesn't use HTTP!
      });
      
      // Let's get the School A admin token directly from AuthService
      const { AuthService } = require("./modules/auth/AuthService");
      const authService = new AuthService();
      const authResult = await authService.execute({ email: "admin@danceflow.com", password: "admin123" });
      const adminToken = authResult.token;
      const schoolAId = authResult.user.schoolId;
      console.log(`School A Admin token obtained. School A ID: ${schoolAId}`);

      // 2. Create another School (School B) and a Class belonging to it in the DB
      // We use basePrisma to bypass tenant isolation
      const schoolB = await basePrisma.school.create({
        data: {
          name: "Escola Secreta B"
        }
      });
      console.log(`School B created: ${schoolB.name} (${schoolB.id})`);

      const modalityB = await basePrisma.modality.create({
        data: {
          name: "Ballet Oculto",
          schoolId: schoolB.id
        }
      });

      const teacherB = await basePrisma.user.create({
        data: {
          name: "Teacher B",
          email: "teacherB@secret.com",
          password: "hash",
          role: "TEACHER",
          schoolId: schoolB.id
        }
      });

      const classB = await basePrisma.class.create({
        data: {
          name: "Class of School B",
          schoolId: schoolB.id,
          modalityId: modalityB.id,
          mainTeacherId: teacherB.id
        }
      });
      console.log(`Class B created under School B: ${classB.name} (${classB.id})`);

      // 3. Attempt to fetch Class B as School A Admin via API
      console.log("Fetching class details of Class B using School A credentials...");
      const fetchClassBRes = await fetch(`${baseUrl}/classes/${classB.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.log(`- Fetch Class B Status: ${fetchClassBRes.status} (Expected: 404)`);
      if (fetchClassBRes.status !== 404) {
        throw new Error("Security leak: School A admin was able to query School B's class!");
      }
      console.log("Tenant Data Isolation verified successfully: School A got a 404 when querying School B's data.");

      // Clean up School B records
      await basePrisma.class.delete({ where: { id: classB.id } });
      await basePrisma.user.delete({ where: { id: teacherB.id } });
      await basePrisma.modality.delete({ where: { id: modalityB.id } });
      await basePrisma.school.delete({ where: { id: schoolB.id } });
      console.log("Temporary School B records cleaned up.");

      console.log("\n✅ ALL SECURITY AND ISOLATION TESTS PASSED SUCCESSFULLY!");
      shutdown(0);
    } catch (error) {
      console.error("\n❌ SECURITY TEST FAILED WITH ERROR:", error);
      shutdown(1);
    }
  });
}

function shutdown(code) {
  if (server) {
    server.close(() => {
      console.log("Security Test server closed.");
      process.exit(code);
    });
  } else {
    process.exit(code);
  }
}

runTests();
