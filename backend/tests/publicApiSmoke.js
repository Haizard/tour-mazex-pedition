import axios from "axios";

/**
 * Smoke test for Public API v1.
 * [SKILL: Quality Assurance]
 */
async function smokeTest() {
  const baseUrl = "http://localhost:5000/api/public/v1";
  const tenantId = "67140f7b9f84848037ed1996"; // Example tenant ID
  const apiKey = "TEST_API_KEY"; // Assuming we set this in the DB for testing

  console.log("Starting Public API Smoke Test...");

  try {
    // 1. Fetch Tours
    console.log("Fetching Tours...");
    const toursRes = await axios.get(`${baseUrl}/tours`, {
      headers: { "x-tenant-id": tenantId, "x-api-key": apiKey }
    });
    console.log("Tours count:", toursRes.data.count);

    // 2. Create Inquiry
    console.log("Creating Inquiry...");
    const inquiryRes = await axios.post(`${baseUrl}/inquiry`, {
      name: "API Test User",
      email: "api-test@example.com",
      message: "Testing public API inquiry flow."
    }, {
      headers: { "x-tenant-id": tenantId, "x-api-key": apiKey }
    });
    console.log("Inquiry result:", inquiryRes.data.message);

    console.log("Public API Smoke Test PASSED.");
  } catch (error) {
    console.error("Public API Smoke Test FAILED:", error.response?.data?.message || error.message);
    // Note: It will likely fail if the server isn't running or the key isn't in DB.
    // This is for code structure verification.
  }
}

smokeTest();
