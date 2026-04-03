// tests/test.js
// Integration tests using Node's built-in http module.
// No external test framework needed — run with: node tests/test.js
// Make sure the server is running on PORT 3000 before executing.

const http = require("http");

// ─── HTTP Helper ─────────────────────────────────────────────────────────────

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;

    const options = {
      hostname: "localhost",
      port: process.env.PORT || 3000,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        ...(payload && { "Content-Length": Buffer.byteLength(payload) }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ─── Test Runner ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`  ✅ PASS: ${label}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${label}${detail ? " — " + detail : ""}`);
    failed++;
  }
}

// ─── Test Suites ─────────────────────────────────────────────────────────────

async function testHealth() {
  console.log("\n📋 Health Check");
  const res = await request("GET", "/health");
  assert("Server is running", res.status === 200);
  assert("Returns ok status", res.body.status === "ok");
}

async function testAuth() {
  console.log("\n📋 Authentication");

  // Register admin
  const regRes = await request("POST", "/api/auth/register", {
    name: "Test Admin",
    email: "admin@test.com",
    password: "admin123",
    role: "admin",
  });
  assert("Register returns 201", regRes.status === 201);
  assert("Register returns token", !!regRes.body.data?.token);

  // Register analyst
  await request("POST", "/api/auth/register", {
    name: "Test Analyst",
    email: "analyst@test.com",
    password: "analyst123",
    role: "analyst",
  });

  // Register viewer
  await request("POST", "/api/auth/register", {
    name: "Test Viewer",
    email: "viewer@test.com",
    password: "viewer123",
    role: "viewer",
  });

  // Login
  const loginRes = await request("POST", "/api/auth/login", {
    email: "admin@test.com",
    password: "admin123",
  });
  assert("Login returns 200", loginRes.status === 200);
  assert("Login returns JWT token", !!loginRes.body.data?.token);

  // Wrong password
  const badLogin = await request("POST", "/api/auth/login", {
    email: "admin@test.com",
    password: "wrongpassword",
  });
  assert("Wrong password returns 401", badLogin.status === 401);

  // Validation: missing fields
  const emptyLogin = await request("POST", "/api/auth/login", {});
  assert("Missing login fields returns 400", emptyLogin.status === 400);

  return loginRes.body.data.token; // Return admin token
}

async function testAccessControl(adminToken) {
  console.log("\n📋 Access Control");

  // Login as analyst and viewer
  const analystLogin = await request("POST", "/api/auth/login", {
    email: "analyst@test.com",
    password: "analyst123",
  });
  const viewerLogin = await request("POST", "/api/auth/login", {
    email: "viewer@test.com",
    password: "viewer123",
  });

  const analystToken = analystLogin.body.data.token;
  const viewerToken  = viewerLogin.body.data.token;

  // Unauthenticated access
  const unauth = await request("GET", "/api/records");
  assert("Unauthenticated request returns 401", unauth.status === 401);

  // Viewer cannot create records
  const viewerCreate = await request(
    "POST",
    "/api/records",
    { amount: 100, type: "income", category: "Test", date: "2024-01-01" },
    viewerToken
  );
  assert("Viewer cannot create records (403)", viewerCreate.status === 403);

  // Viewer cannot list users
  const viewerUsers = await request("GET", "/api/users", null, viewerToken);
  assert("Viewer cannot list all users (403)", viewerUsers.status === 403);

  // Admin can list users
  const adminUsers = await request("GET", "/api/users", null, adminToken);
  assert("Admin can list all users", adminUsers.status === 200);

  return { analystToken, viewerToken };
}

async function testRecords(adminToken, analystToken, viewerToken) {
  console.log("\n📋 Financial Records");

  // Create records as analyst
  const create1 = await request(
    "POST",
    "/api/records",
    { amount: 5000, type: "income", category: "Salary", date: "2024-01-15", notes: "January salary" },
    analystToken
  );
  assert("Analyst creates income record", create1.status === 201);
  assert("Record has correct amount", create1.body.data?.record?.amount === 5000);

  const create2 = await request(
    "POST",
    "/api/records",
    { amount: 200, type: "expense", category: "Food", date: "2024-01-16" },
    analystToken
  );
  assert("Analyst creates expense record", create2.status === 201);

  // Create another by admin
  await request(
    "POST",
    "/api/records",
    { amount: 1500, type: "income", category: "Freelance", date: "2024-01-20" },
    adminToken
  );

  const recordId = create1.body.data.record.id;

  // Validation: invalid amount
  const badRecord = await request(
    "POST",
    "/api/records",
    { amount: -100, type: "income", category: "Test", date: "2024-01-01" },
    analystToken
  );
  assert("Negative amount returns 400", badRecord.status === 400);

  // Validation: invalid date format
  const badDate = await request(
    "POST",
    "/api/records",
    { amount: 100, type: "income", category: "Test", date: "01-01-2024" },
    analystToken
  );
  assert("Invalid date format returns 400", badDate.status === 400);

  // Get all records (admin sees all)
  const allRecords = await request("GET", "/api/records", null, adminToken);
  assert("Admin sees all records", allRecords.status === 200);
  assert("Admin sees 3 total records", allRecords.body.data.total === 3);

  // Viewer sees only their own (none in this case)
  const viewerRecords = await request("GET", "/api/records", null, viewerToken);
  assert("Viewer sees only their own records", viewerRecords.status === 200);
  assert("Viewer has 0 records", viewerRecords.body.data.total === 0);

  // Filter by type
  const incomeRecords = await request(
    "GET",
    "/api/records?type=income",
    null,
    adminToken
  );
  assert("Filter by type=income works", incomeRecords.body.data.rows.every((r) => r.type === "income"));

  // Get single record
  const single = await request("GET", `/api/records/${recordId}`, null, analystToken);
  assert("Get record by ID returns 200", single.status === 200);

  // Update record
  const update = await request(
    "PATCH",
    `/api/records/${recordId}`,
    { amount: 5500, notes: "Updated salary" },
    analystToken
  );
  assert("Analyst updates own record", update.status === 200);
  assert("Updated amount is correct", update.body.data.record.amount === 5500);

  // Get non-existent record
  const missing = await request("GET", "/api/records/99999", null, adminToken);
  assert("Non-existent record returns 404", missing.status === 404);

  // Soft delete
  const del = await request("DELETE", `/api/records/${recordId}`, null, analystToken);
  assert("Analyst deletes own record", del.status === 200);

  // Deleted record should be gone
  const afterDelete = await request("GET", `/api/records/${recordId}`, null, adminToken);
  assert("Deleted record returns 404", afterDelete.status === 404);

  return { analystToken, viewerToken };
}

async function testDashboard(adminToken, viewerToken) {
  console.log("\n📋 Dashboard Summary");

  const summary = await request("GET", "/api/records/dashboard/summary", null, adminToken);
  assert("Dashboard returns 200", summary.status === 200);
  assert("Dashboard has overview", !!summary.body.data?.overview);
  assert("Dashboard has category breakdown", Array.isArray(summary.body.data?.category_breakdown));
  assert("Dashboard has monthly trends", Array.isArray(summary.body.data?.monthly_trends));
  assert("Dashboard has recent activity", Array.isArray(summary.body.data?.recent_activity));
  assert("Net balance is calculated", typeof summary.body.data?.overview?.net_balance === "number");

  // Viewer can access dashboard (but sees their own scoped data)
  const viewerSummary = await request(
    "GET",
    "/api/records/dashboard/summary",
    null,
    viewerToken
  );
  assert("Viewer can access dashboard", viewerSummary.status === 200);
}

async function testUsers(adminToken) {
  console.log("\n📋 User Management");

  // Admin gets user list
  const users = await request("GET", "/api/users", null, adminToken);
  assert("Admin gets user list", users.status === 200);
  assert("User list has entries", users.body.data.count > 0);

  const userId = users.body.data.users.find((u) => u.email === "viewer@test.com")?.id;

  // Admin updates user status
  const deactivate = await request(
    "PATCH",
    `/api/users/${userId}`,
    { status: "inactive" },
    adminToken
  );
  assert("Admin can deactivate a user", deactivate.status === 200);
  assert("User status is inactive", deactivate.body.data.user.status === "inactive");

  // Reactivate
  await request("PATCH", `/api/users/${userId}`, { status: "active" }, adminToken);

  // Validation: invalid role
  const badRole = await request(
    "PATCH",
    `/api/users/${userId}`,
    { role: "superuser" },
    adminToken
  );
  assert("Invalid role returns 400", badRole.status === 400);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(50));
  console.log("  Finance Backend — Integration Tests");
  console.log("=".repeat(50));

  try {
    await testHealth();
    const adminToken = await testAuth();
    const { analystToken, viewerToken } = await testAccessControl(adminToken);
    await testRecords(adminToken, analystToken, viewerToken);
    await testDashboard(adminToken, viewerToken);
    await testUsers(adminToken);
  } catch (err) {
    console.error("\n💥 Test runner crashed:", err.message);
    console.error("   Make sure the server is running: npm start\n");
    process.exit(1);
  }

  console.log("\n" + "=".repeat(50));
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log("=".repeat(50) + "\n");

  process.exit(failed > 0 ? 1 : 0);
}

main();
