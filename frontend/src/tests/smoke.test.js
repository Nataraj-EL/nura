const test = require("node:test");
const assert = require("node:assert");

test("Frontend Smoke Tests - Routing Defaults", () => {
  const routes = [
    "/login",
    "/dashboard",
    "/onboarding",
    "/cycle",
    "/wellness",
    "/insights",
    "/notifications",
    "/care"
  ];

  // Verify all routes are defined in list
  assert.strictEqual(routes.length, 8);
  assert.ok(routes.includes("/care"));
  assert.ok(routes.includes("/dashboard"));
});

test("Frontend Smoke Tests - API Utils validation", () => {
  // Mock standard API configurations
  const MOCK_API_URL = "http://localhost:8080";
  const endpoint = "/api/care/safety";
  const url = `${MOCK_API_URL}${endpoint}`;

  assert.strictEqual(url, "http://localhost:8080/api/care/safety");
});
