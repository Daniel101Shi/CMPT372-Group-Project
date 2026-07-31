// Unlike the other test files, this drives the real express app over HTTP with supertest.
// The controller tests call handlers directly, which skips the routing and middleware, so
// nothing else would notice if adminRoutes were mounted without requireRole. This does.
import session from "express-session";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}));

vi.mock("../db/db.js", () => ({
  pool: { query: queryMock },
}));

// swap the postgres session store for the in-memory one, so sessions work without a database
vi.mock("connect-pg-simple", () => ({
  default: () => session.MemoryStore,
}));

import { app } from "../app.js";

const PASSWORD = "password123";

// register returns a session cookie, which supertest's agent then reuses automatically
async function signUpAs(role: "user" | "admin") {
  const agent = request.agent(app);

  queryMock
    .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // username is free
    .mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ user_id: 7, username: "danielshi", role }],
    });

  await agent.post("/api/auth/register").send({ username: "danielshi", password: PASSWORD });
  return agent;
}

// what requireRole looks up on every request
const roleLookupReturns = (role: string) =>
  queryMock.mockResolvedValueOnce({ rowCount: 1, rows: [{ role }] });

describe("admin routes (integration)", () => {
  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  beforeEach(() => {
    queryMock.mockReset();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 when nobody is logged in", async () => {
    const res = await request(app).get("/api/admin/users");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 403 for a logged in user who is not an admin", async () => {
    const agent = await signUpAs("user");
    roleLookupReturns("user");

    const res = await agent.get("/api/admin/users");

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("returns the user list for an admin", async () => {
    const agent = await signUpAs("admin");
    roleLookupReturns("admin");
    queryMock.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ user_id: 7, username: "danielshi", role: "admin", pack_count: 0, friend_count: 0 }],
    });

    const res = await agent.get("/api/admin/users");

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(1);
  });

  it("keeps the session across requests via the cookie", async () => {
    const agent = await signUpAs("user");

    roleLookupReturns("user");
    expect((await agent.get("/api/admin/users")).status).toBe(403);

    // 403 not 401 the second time means the cookie was sent back and recognised
    roleLookupReturns("user");
    expect((await agent.get("/api/admin/users")).status).toBe(403);
  });

  it("leaves /health open to anonymous requests", async () => {
    // proves the admin router's bare router.use() is scoped to /api/admin. an earlier version
    // mounted it at /api, which put an admin check in front of the entire api including login.
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("leaves login reachable without a session", async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const res = await request(app).post("/api/auth/login").send({ username: "nobody", password: PASSWORD });

    // 401 for bad credentials, not 401 UNAUTHORIZED from a misplaced auth guard
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });
});
