import type { NextFunction, Request, Response } from "express";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}));

vi.mock("../../db/db.js", () => ({
  pool: {
    query: queryMock,
  },
}));

import { requireRole } from "./requireRole.js";

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

function createMockRequest(session: Record<string, unknown> = {}) {
  return {
    session: {
      ...session,
      destroy: vi.fn((cb?: (err?: unknown) => void) => cb?.(undefined)),
    },
  } as unknown as Request;
}

const dbReturns = (role: string) =>
  queryMock.mockResolvedValueOnce({ rowCount: 1, rows: [{ role }] });

describe("requireRole", () => {
  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  beforeEach(() => {
    queryMock.mockReset();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("lets an admin through to the controller", async () => {
    const next = vi.fn() as unknown as NextFunction;
    const res = createMockResponse();
    dbReturns("admin");

    await requireRole("admin")(createMockRequest({ userId: 7 }), res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 403 for a logged in user with the wrong role", async () => {
    const next = vi.fn() as unknown as NextFunction;
    const res = createMockResponse();
    dbReturns("user");

    await requireRole("admin")(createMockRequest({ userId: 7 }), res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401, not 403, when nobody is logged in", async () => {
    // 401 means "i don't know who you are", 403 means "i do, and no". conflating them
    // makes the failure path ambiguous.
    const next = vi.fn() as unknown as NextFunction;
    const res = createMockResponse();

    await requireRole("admin")(createMockRequest(), res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("reads the role from the database, not from the session", async () => {
    // this is the whole reason for the query. a session lasts 7 days, so a demoted admin
    // must lose access on their next request, not at their next login.
    const next = vi.fn() as unknown as NextFunction;
    const res = createMockResponse();
    dbReturns("user"); // the database says they were demoted

    await requireRole("admin")(
      createMockRequest({ userId: 7, role: "admin" }), // a stale session still claiming admin
      res,
      next,
    );

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("destroys the session and returns 401 when the account no longer exists", async () => {
    const req = createMockRequest({ userId: 99 });
    const res = createMockResponse();
    queryMock.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    await requireRole("admin")(req, res, vi.fn() as unknown as NextFunction);

    expect(req.session.destroy).toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it("accepts any of several allowed roles", async () => {
    const next = vi.fn() as unknown as NextFunction;
    dbReturns("user");

    await requireRole("admin", "user")(
      createMockRequest({ userId: 7 }),
      createMockResponse(),
      next,
    );

    expect(next).toHaveBeenCalledOnce();
  });

  it("returns 500 rather than leaking a stack trace when the query fails", async () => {
    const next = vi.fn() as unknown as NextFunction;
    const res = createMockResponse();
    queryMock.mockRejectedValueOnce(new Error("connection lost"));

    await requireRole("admin")(createMockRequest({ userId: 7 }), res, next);

    expect(res.statusCode).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
    expect(next).not.toHaveBeenCalled();
  });

  it("looks up the role for the session's own user id", async () => {
    dbReturns("admin");

    await requireRole("admin")(
      createMockRequest({ userId: 42 }),
      createMockResponse(),
      vi.fn() as unknown as NextFunction,
    );

    expect(queryMock.mock.calls[0]?.[1]).toEqual([42]);
  });
});
