const { app } = require("./app");
const { prisma } = require("./shared/database/prisma");

async function testHealthEndpoint() {
  console.log("--- TESTING GET /health ENDPOINT ---");

  const server = app.listen(3399, async () => {
    try {
      const res = await fetch("http://localhost:3399/health");
      const data = await res.json();

      console.log("Status Code:", res.status);
      console.log("Response Body:", data);

      if (res.status === 200 && data.status === "ok" && data.database === "connected") {
        console.log("\n✅ HEALTH CHECK PASSED SUCCESSFULLY!");
      } else {
        console.error("\n❌ HEALTH CHECK FAILED!");
      }
    } catch (err) {
      console.error("Test error:", err);
    } finally {
      server.close();
      await prisma.$disconnect();
    }
  });
}

testHealthEndpoint();
