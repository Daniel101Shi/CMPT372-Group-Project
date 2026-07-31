import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { requireAuth } from "./requireAuth.js";

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
  return { session } as unknown as Request;
}

describe("requireAuth", () => {
  it("passes the request along when a session exists", () => {
    const next = vi.fn() as unknown as NextFunction;
    const res = createMockResponse();

    requireAuth(createMockRequest({ userId: 7 }), res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 401 when there is no session", () => {
    const next = vi.fn() as unknown as NextFunction;
    const res = createMockResponse();

    requireAuth(createMockRequest(), res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("does not call next after rejecting", () => {
    // forgetting the early return here would run the controller anyway, after the 401
    const next = vi.fn() as unknown as NextFunction;

    requireAuth(createMockRequest(), createMockResponse(), next);

    expect(next).not.toHaveBeenCalled();
  });

  it("treats user_id 0 as unauthenticated rather than falsy-passing", () => {
    // postgres SERIAL starts at 1, so 0 should never appear, but !0 is true either way
    const next = vi.fn() as unknown as NextFunction;
    const res = createMockResponse();

    requireAuth(createMockRequest({ userId: 0 }), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });
});
