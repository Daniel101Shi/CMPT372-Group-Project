import type { Request, Response } from "express";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}));

vi.mock("../db/db.js", () => ({
  pool: {
    query: queryMock,
  },
}));


import bcrypt from "bcrypt";

import { getCurrentUser, login, logout, register } from "./authController.js";

// captures status/body so assertions can read them back instead of digging through mock.calls
function createMockResponse() {
  const res = {} as Response & { statusCode?: number; body?: any };
  res.status = vi.fn().mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn().mockImplementation((body: unknown) => {
    res.body = body;
    return res;
  });
  res.clearCookie = vi.fn().mockReturnValue(res);
  return res;
}

function createMockRequest(body: unknown, session: Record<string, unknown> = {}) {
  return {
    body,
    session: {
      ...session,
      // real express-session hands the callback an error argument
      destroy: vi.fn((cb?: (err?: unknown) => void) => cb?.(undefined)),
    },
  } as unknown as Request;
}

const VALID = { username: "danielshi", password: "password123" };

describe("authController", () => {
  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  beforeEach(() => {
    queryMock.mockReset();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe("register", () => {
    it("creates the user, logs them in, and returns 201", async () => {
      const req = createMockRequest({ ...VALID, contactInfo: "daniel@sfu.ca" });
      const res = createMockResponse();

      queryMock
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // username free
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ user_id: 7, username: "danielshi", contact_info: "daniel@sfu.ca", role: "user" }],
        });

      await register(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body.user).toMatchObject({ user_id: 7, username: "danielshi", role: "user" });
      // the session is what actually logs them in
      expect(req.session.userId).toBe(7);
      expect(req.session.username).toBe("danielshi");
    });

    it("stores a bcrypt hash, never the plaintext password", async () => {
      const req = createMockRequest(VALID);
      const res = createMockResponse();

      queryMock
        .mockResolvedValueOnce({ rowCount: 0, rows: [] })
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ user_id: 1, username: "danielshi" }] });

      await register(req, res);

      const insertParams = queryMock.mock.calls[1]?.[1] as string[];
      const storedHash = insertParams[1] as string;

      expect(storedHash).not.toBe(VALID.password);
      expect(storedHash.startsWith("$2b$")).toBe(true);
      // and it is a hash OF that password, not of something else
      await expect(bcrypt.compare(VALID.password, storedHash)).resolves.toBe(true);
    });

    it("trims the username and stores a blank contactInfo as null", async () => {
      const req = createMockRequest({ ...VALID, username: "  spaced  ", contactInfo: "   " });
      const res = createMockResponse();

      queryMock
        .mockResolvedValueOnce({ rowCount: 0, rows: [] })
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ user_id: 2, username: "spaced" }] });

      await register(req, res);

      const insertParams = queryMock.mock.calls[1]?.[1] as unknown[];
      expect(insertParams[0]).toBe("spaced");
      expect(insertParams[2]).toBeNull();
    });

    it("returns 409 when the username is already taken", async () => {
      const req = createMockRequest(VALID);
      const res = createMockResponse();

      queryMock.mockResolvedValueOnce({ rowCount: 1, rows: [{ user_id: 3 }] });

      await register(req, res);

      expect(res.statusCode).toBe(409);
      expect(res.body.error.code).toBe("USERNAME_TAKEN");
      // never reached the insert
      expect(queryMock).toHaveBeenCalledTimes(1);
    });

    it("returns 409 when postgres rejects a duplicate that slipped past the check", async () => {
      // two signups racing: both pass the SELECT, the UNIQUE constraint catches the loser
      const req = createMockRequest(VALID);
      const res = createMockResponse();

      queryMock
        .mockResolvedValueOnce({ rowCount: 0, rows: [] })
        .mockRejectedValueOnce(Object.assign(new Error("duplicate key"), { code: "23505" }));

      await register(req, res);

      expect(res.statusCode).toBe(409);
      expect(res.body.error.code).toBe("USERNAME_TAKEN");
    });

    it("returns 500 on an unexpected database error", async () => {
      const req = createMockRequest(VALID);
      const res = createMockResponse();

      queryMock.mockRejectedValueOnce(new Error("connection lost"));

      await register(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.error.code).toBe("INTERNAL_ERROR");
    });

    it("rejects a body that isn't an object", async () => {
      // express.json() leaves req.body undefined when content-type isn't json
      const res = createMockResponse();
      await register(createMockRequest(undefined), res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe("MALFORMED_BODY");
      expect(queryMock).not.toHaveBeenCalled();
    });

    it("rejects unexpected fields so nobody can smuggle in a role", async () => {
      const res = createMockResponse();
      await register(createMockRequest({ ...VALID, role: "admin" }), res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.field).toBe("role");
      expect(queryMock).not.toHaveBeenCalled();
    });

    it.each([
      ["missing username", { password: "password123" }, "username"],
      ["blank username", { username: "   ", password: "password123" }, "username"],
      ["username under 3 chars", { username: "ab", password: "password123" }, "username"],
      ["username over 50 chars", { username: "a".repeat(51), password: "password123" }, "username"],
      ["username with a space", { username: "has space", password: "password123" }, "username"],
      ["missing password", { username: "danielshi" }, "password"],
      ["password under 8 chars", { username: "danielshi", password: "short" }, "password"],
      ["password over 72 bytes", { username: "danielshi", password: "a".repeat(73) }, "password"],
      [
        "contactInfo over 100 chars",
        { ...VALID, contactInfo: "a".repeat(101) },
        "contactInfo",
      ],
    ])("rejects %s with a 400 naming the field", async (_label, body, field) => {
      const res = createMockResponse();
      await register(createMockRequest(body), res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe("INVALID_INPUT");
      expect(res.body.error.field).toBe(field);
      // nothing should reach the database
      expect(queryMock).not.toHaveBeenCalled();
    });

    it("counts the password limit in bytes, not characters", async () => {
      // 24 four-byte emoji = 96 bytes but only 48 characters
      const res = createMockResponse();
      await register(createMockRequest({ username: "danielshi", password: "🔑".repeat(24) }), res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.field).toBe("password");
    });
  });

  describe("login", () => {
    let hash: string;

    beforeAll(async () => {
      hash = await bcrypt.hash(VALID.password, 10);
    });

    it("logs the user in and never returns the password hash", async () => {
      const req = createMockRequest(VALID);
      const res = createMockResponse();

      queryMock.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ user_id: 7, username: "danielshi", password_hash: hash, role: "user" }],
      });

      await login(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.user).toMatchObject({ user_id: 7, role: "user" });
      expect(res.body.user).not.toHaveProperty("password_hash");
      expect(req.session.userId).toBe(7);
    });

    it("returns 401 for an unknown username", async () => {
      const res = createMockResponse();
      queryMock.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      await login(createMockRequest(VALID), res);

      expect(res.statusCode).toBe(401);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("returns 401 for a wrong password", async () => {
      const res = createMockResponse();
      queryMock.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ user_id: 7, username: "danielshi", password_hash: hash }],
      });

      await login(createMockRequest({ ...VALID, password: "wrongpassword" }), res);

      expect(res.statusCode).toBe(401);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("gives byte-identical answers for unknown user and wrong password", async () => {
      // if these differed, an attacker could enumerate which usernames exist
      const unknownRes = createMockResponse();
      queryMock.mockResolvedValueOnce({ rowCount: 0, rows: [] });
      await login(createMockRequest(VALID), unknownRes);

      const wrongPassRes = createMockResponse();
      queryMock.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ user_id: 7, username: "danielshi", password_hash: hash }],
      });
      await login(createMockRequest({ ...VALID, password: "wrongpassword" }), wrongPassRes);

      expect(unknownRes.statusCode).toBe(wrongPassRes.statusCode);
      expect(JSON.stringify(unknownRes.body)).toBe(JSON.stringify(wrongPassRes.body));
    });

    it("does not leak whether a username exists via the session", async () => {
      const req = createMockRequest({ ...VALID, password: "wrongpassword" });
      const res = createMockResponse();
      queryMock.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ user_id: 7, username: "danielshi", password_hash: hash }],
      });

      await login(req, res);

      expect(req.session.userId).toBeUndefined();
    });

    it("still accepts a password that predates the current minimum length", async () => {
      // registration now requires 8 characters. accounts made under the old rule of 4 must
      // keep working, so login deliberately doesn't run the registration validators.
      const legacyHash = await bcrypt.hash("1234", 10);
      const res = createMockResponse();
      queryMock.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ user_id: 9, username: "oldtimer", password_hash: legacyHash }],
      });

      await login(createMockRequest({ username: "oldtimer", password: "1234" }), res);

      expect(res.statusCode).toBe(200);
    });

    it.each([
      ["a non-object body", undefined, 400, "MALFORMED_BODY"],
      ["a missing password", { username: "danielshi" }, 401, "INVALID_CREDENTIALS"],
      ["a blank username", { username: "   ", password: "password123" }, 401, "INVALID_CREDENTIALS"],
    ])("rejects %s without touching the database", async (_label, body, status, code) => {
      const res = createMockResponse();
      await login(createMockRequest(body), res);

      expect(res.statusCode).toBe(status);
      expect(res.body.error.code).toBe(code);
      expect(queryMock).not.toHaveBeenCalled();
    });

    it("returns 500 on a database error", async () => {
      const res = createMockResponse();
      queryMock.mockRejectedValueOnce(new Error("connection lost"));

      await login(createMockRequest(VALID), res);

      expect(res.statusCode).toBe(500);
      expect(res.body.error.code).toBe("INTERNAL_ERROR");
    });
  });

  describe("logout", () => {
    it("destroys the session and clears the cookie", async () => {
      const req = createMockRequest({}, { userId: 7 });
      const res = createMockResponse();

      await logout(req, res);

      expect(req.session.destroy).toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledWith("connect.sid");
      expect(res.statusCode).toBe(200);
    });

    it("returns 500 and does not clear the cookie when destroy fails", async () => {
      const req = createMockRequest({}, { userId: 7 });
      // a failed destroy means the session may still be live, so the cookie must stay
      req.session.destroy = vi.fn((cb: (err?: unknown) => void) => cb(new Error("store down")));
      const res = createMockResponse();

      await logout(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.error.code).toBe("FAILED_LOGOUT");
      expect(res.clearCookie).not.toHaveBeenCalled();
    });
  });

  describe("getCurrentUser", () => {
    it("returns the user for a live session", async () => {
      const res = createMockResponse();
      queryMock.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ user_id: 7, username: "danielshi", role: "admin" }],
      });

      await getCurrentUser(createMockRequest({}, { userId: 7 }), res);

      expect(res.statusCode).toBe(200);
      expect(res.body.user).toMatchObject({ user_id: 7, role: "admin" });
    });

    it("returns 200 with a null user when logged out, not 401", async () => {
      // the frontend calls this on every page load; being logged out is a normal answer
      const res = createMockResponse();

      await getCurrentUser(createMockRequest({}), res);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ user: null });
      expect(queryMock).not.toHaveBeenCalled();
    });

    it("destroys a session that points at a deleted account", async () => {
      const req = createMockRequest({}, { userId: 99 });
      const res = createMockResponse();
      queryMock.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      await getCurrentUser(req, res);

      expect(req.session.destroy).toHaveBeenCalled();
      expect(res.body).toEqual({ user: null });
    });

    it("returns 500 on a database error", async () => {
      const res = createMockResponse();
      queryMock.mockRejectedValueOnce(new Error("connection lost"));

      await getCurrentUser(createMockRequest({}, { userId: 7 }), res);

      expect(res.statusCode).toBe(500);
      expect(res.body.error.code).toBe("INTERNAL_ERROR");
    });
  });
});
