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

import { deleteUser, listUsers, updateUserRole } from "./adminController.js";

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
  return res;
}

function createMockRequest(
  params: Record<string, string> = {},
  body: unknown = {},
  session: Record<string, unknown> = { userId: 1 },
) {
  return { params, body, session } as unknown as Request;
}

const targetIs = (role: string) =>
  queryMock.mockResolvedValueOnce({ rowCount: 1, rows: [{ user_id: 5, role }] });
const adminCountIs = (n: number) =>
  queryMock.mockResolvedValueOnce({ rowCount: 1, rows: [{ admin_count: n }] });

describe("adminController", () => {
  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  beforeEach(() => {
    queryMock.mockReset();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe("listUsers", () => {
    it("returns every user with their role and counts", async () => {
      const res = createMockResponse();
      queryMock.mockResolvedValueOnce({
        rowCount: 2,
        rows: [
          { user_id: 1, username: "admin", role: "admin", pack_count: 0, friend_count: 2 },
          { user_id: 2, username: "daniel", role: "user", pack_count: 1, friend_count: 3 },
        ],
      });

      await listUsers(createMockRequest(), res);

      expect(res.statusCode).toBe(200);
      expect(res.body.users).toHaveLength(2);
      expect(res.body.users[0].role).toBe("admin");
    });

    it("never selects password_hash", async () => {
      const res = createMockResponse();
      queryMock.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      await listUsers(createMockRequest(), res);

      expect(queryMock.mock.calls[0]?.[0]).not.toContain("password_hash");
    });

    it("returns 500 on a database error", async () => {
      const res = createMockResponse();
      queryMock.mockRejectedValueOnce(new Error("connection lost"));

      await listUsers(createMockRequest(), res);

      expect(res.statusCode).toBe(500);
      expect(res.body.error.code).toBe("FAILED_LIST_USERS");
    });
  });

  describe("updateUserRole", () => {
    it("promotes a user to admin", async () => {
      const res = createMockResponse();
      targetIs("user");
      queryMock.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ user_id: 5, username: "daniel", role: "admin" }],
      });

      await updateUserRole(createMockRequest({ userId: "5" }, { role: "admin" }), res);

      expect(res.statusCode).toBe(200);
      expect(res.body.user.role).toBe("admin");
    });

    it("demotes an admin while another admin remains", async () => {
      const res = createMockResponse();
      targetIs("admin");
      adminCountIs(2);
      queryMock.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ user_id: 5, username: "daniel", role: "user" }],
      });

      await updateUserRole(createMockRequest({ userId: "5" }, { role: "user" }), res);

      expect(res.statusCode).toBe(200);
      expect(res.body.user.role).toBe("user");
    });

    it("refuses to demote the last remaining admin", async () => {
      // there is no endpoint to promote someone back, so this would lock everyone out
      const res = createMockResponse();
      targetIs("admin");
      adminCountIs(1);

      await updateUserRole(createMockRequest({ userId: "5" }, { role: "user" }), res);

      expect(res.statusCode).toBe(409);
      expect(res.body.error.code).toBe("LAST_ADMIN");
      // and it never ran the update
      expect(queryMock).toHaveBeenCalledTimes(2);
    });

    it("returns 404 for a user that does not exist", async () => {
      const res = createMockResponse();
      queryMock.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      await updateUserRole(createMockRequest({ userId: "999" }, { role: "admin" }), res);

      expect(res.statusCode).toBe(404);
      expect(res.body.error.code).toBe("USER_NOT_FOUND");
    });

    it.each(["abc", "0", "-3"])("rejects userId %s without querying", async (userId) => {
      const res = createMockResponse();

      await updateUserRole(createMockRequest({ userId }, { role: "admin" }), res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe("INVALID_USER_ID");
      expect(queryMock).not.toHaveBeenCalled();
    });

    it("rejects a role outside the allowed set", async () => {
      const res = createMockResponse();

      await updateUserRole(createMockRequest({ userId: "5" }, { role: "superuser" }), res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe("INVALID_ROLE");
      expect(queryMock).not.toHaveBeenCalled();
    });

    it("rejects a body that isn't an object", async () => {
      // built by hand rather than via createMockRequest, whose default parameter would
      // quietly turn an explicit undefined back into {}
      const req = {
        params: { userId: "5" },
        body: undefined,
        session: { userId: 1 },
      } as unknown as Request;
      const res = createMockResponse();

      await updateUserRole(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe("MALFORMED_BODY");
      expect(queryMock).not.toHaveBeenCalled();
    });

    it("rejects unexpected body fields", async () => {
      const res = createMockResponse();

      await updateUserRole(
        createMockRequest({ userId: "5" }, { role: "admin", username: "hacked" }),
        res,
      );

      expect(res.statusCode).toBe(400);
      expect(res.body.error.field).toBe("username");
    });

    it("returns 500 on a database error", async () => {
      const res = createMockResponse();
      queryMock.mockRejectedValueOnce(new Error("connection lost"));

      await updateUserRole(createMockRequest({ userId: "5" }, { role: "admin" }), res);

      expect(res.statusCode).toBe(500);
      expect(res.body.error.code).toBe("FAILED_UPDATE_ROLE");
    });
  });

  describe("deleteUser", () => {
    it("deletes another user", async () => {
      const res = createMockResponse();
      targetIs("user");
      queryMock.mockResolvedValueOnce({ rowCount: 1, rows: [] });

      await deleteUser(createMockRequest({ userId: "5" }, {}, { userId: 1 }), res);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/deleted/i);
    });

    it("refuses to let an admin delete their own account", async () => {
      // this would destroy the session mid request and is never what you meant
      const res = createMockResponse();

      await deleteUser(createMockRequest({ userId: "1" }, {}, { userId: 1 }), res);

      expect(res.statusCode).toBe(409);
      expect(res.body.error.code).toBe("CANNOT_DELETE_SELF");
      expect(queryMock).not.toHaveBeenCalled();
    });

    it("returns 404 for a user that does not exist", async () => {
      const res = createMockResponse();
      queryMock.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      await deleteUser(createMockRequest({ userId: "999" }), res);

      expect(res.statusCode).toBe(404);
      expect(res.body.error.code).toBe("USER_NOT_FOUND");
    });

    it("rejects a non-numeric userId without querying", async () => {
      const res = createMockResponse();

      await deleteUser(createMockRequest({ userId: "abc" }), res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe("INVALID_USER_ID");
      expect(queryMock).not.toHaveBeenCalled();
    });

    it("returns 500 on a database error", async () => {
      const res = createMockResponse();
      queryMock.mockRejectedValueOnce(new Error("connection lost"));

      await deleteUser(createMockRequest({ userId: "5" }), res);

      expect(res.statusCode).toBe(500);
      expect(res.body.error.code).toBe("FAILED_DELETE_USER");
    });
  });
});
