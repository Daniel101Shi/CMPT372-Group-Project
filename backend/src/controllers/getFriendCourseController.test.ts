import type { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { queryMock, fetchCoursesForUserMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
  fetchCoursesForUserMock: vi.fn(),
}));

vi.mock("../db/db.js", () => ({
  pool: {
    query: queryMock,
  },
}));

// Real isTerm/parseTermParam/getSessionUserId (already unit-tested elsewhere);
// only fetchCoursesForUser is swapped out so this file tests
// getFriendsCourses's own logic, not the SFU enrichment path.
vi.mock("./getUserCourseController.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./getUserCourseController.js")>();
  return {
    ...actual,
    fetchCoursesForUser: fetchCoursesForUserMock,
  };
});

import { getFriendsCourses } from "./getFriendCourseController.js";

function createMockResponse() {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function createMockRequest(params: Record<string, unknown>, userId?: number) {
  return {
    params,
    session: userId === undefined ? {} : { userId },
  } as unknown as Request;
}

describe("getFriendCourseController", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    queryMock.mockReset();
    fetchCoursesForUserMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getFriendsCourses (GET /api/getfriendscourse/:term)", () => {
    it("returns 401 when there is no authenticated session", async () => {
      const req = createMockRequest({ term: "fall" });
      const res = createMockResponse();

      await getFriendsCourses(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(queryMock).not.toHaveBeenCalled();
      expect(fetchCoursesForUserMock).not.toHaveBeenCalled();
    });

    it("returns the session user's own schedule plus every confirmed friend's, self first", async () => {
      const req = createMockRequest({ term: "fall" }, 1);
      const res = createMockResponse();

      // 1st query: confirmed friends
      queryMock.mockResolvedValueOnce({
        rows: [{ user_id: 2, username: "friend-two" }],
      });
      // 2nd query: the session user's own row
      queryMock.mockResolvedValueOnce({
        rows: [{ user_id: 1, username: "self-one" }],
      });

      const selfCourses = [{ department: "CMPT", courseNumber: "372", section: "D100" }];
      const friendCourses = [{ department: "MATH", courseNumber: "151", section: "D200" }];
      fetchCoursesForUserMock.mockImplementation(async (userId: number) =>
        userId === 1 ? selfCourses : friendCourses,
      );

      await getFriendsCourses(req, res);

      expect(queryMock).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("FROM friendships"),
        [1],
      );
      expect(queryMock).toHaveBeenNthCalledWith(2, expect.stringContaining("FROM users"), [1]);

      expect(fetchCoursesForUserMock).toHaveBeenCalledWith(1, "fall");
      expect(fetchCoursesForUserMock).toHaveBeenCalledWith(2, "fall");

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        schedules: [
          { userId: 1, username: "self-one", courses: selfCourses },
          { userId: 2, username: "friend-two", courses: friendCourses },
        ],
      });
    });

    it("returns only the session user's schedule when there are no confirmed friends", async () => {
      const req = createMockRequest({ term: "fall" }, 1);
      const res = createMockResponse();

      queryMock.mockResolvedValueOnce({ rows: [] });
      queryMock.mockResolvedValueOnce({ rows: [{ user_id: 1, username: "self-one" }] });
      fetchCoursesForUserMock.mockResolvedValueOnce([]);

      await getFriendsCourses(req, res);

      expect(fetchCoursesForUserMock).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({
        schedules: [{ userId: 1, username: "self-one", courses: [] }],
      });
    });

    it("returns 500 when a database query fails", async () => {
      const req = createMockRequest({ term: "fall" }, 1);
      const res = createMockResponse();

      queryMock.mockRejectedValueOnce(new Error("connection lost"));

      await getFriendsCourses(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error.",
        },
      });
    });
  });
});