import type { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { queryMock, fetchMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
  fetchMock: vi.fn(),
}));

vi.mock("../db/db.js", () => ({
  pool: {
    query: queryMock,
  },
}));

vi.stubGlobal("fetch", fetchMock);

import {
  CURRENT_YEAR,
  fetchCoursesForUser,
  getSessionUserId,
  getUserCourse,
  isTerm,
  parseTermParam,
} from "./getUserCourseController.js";

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

function mockOutlineResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  };
}

describe("getUserCourseController", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    queryMock.mockReset();
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("isTerm", () => {
    it("returns true for a valid term", () => {
      expect(isTerm("fall")).toBe(true);
    });

    it("returns false for an invalid term", () => {
      expect(isTerm("winter")).toBe(false);
    });
  });

  describe("parseTermParam", () => {
    it("returns the term when it's a plain string", () => {
      const req = createMockRequest({ term: "fall" });
      expect(parseTermParam(req)).toBe("fall");
    });

    it("returns an empty string when term is missing", () => {
      const req = createMockRequest({});
      expect(parseTermParam(req)).toBe("");
    });
  });

  describe("getSessionUserId", () => {
    it("returns the userId when the session is authenticated", () => {
      const req = createMockRequest({}, 7);
      const res = createMockResponse();

      expect(getSessionUserId(req, res)).toBe(7);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("responds 401 and returns null when the session has no userId", () => {
      const req = createMockRequest({});
      const res = createMockResponse();

      expect(getSessionUserId(req, res)).toBeNull();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: "UNAUTHENTICATED",
          message: "You must be logged in to view courses.",
        },
      });
    });
  });

  describe("fetchCoursesForUser", () => {
    it("queries saved courses for the user/term/current year, enriched with the SFU outline", async () => {
      queryMock.mockResolvedValueOnce({
        rows: [{ department: "CMPT", course_number: "372", section: "D100" }],
      });
      fetchMock.mockResolvedValueOnce(
        mockOutlineResponse({
          info: { name: "CMPT 372 D100", title: "Software Engineering" },
          courseSchedule: [
            {
              startTime: "10:30",
              endTime: "12:20",
              days: "Mo, We",
              sectionCode: "LEC",
              campus: "Burnaby",
            },
          ],
        }),
      );

      const courses = await fetchCoursesForUser(7, "fall");

      expect(queryMock).toHaveBeenCalledWith(
        expect.stringContaining("FROM course_collection_items"),
        [7, "fall", Number(CURRENT_YEAR)],
      );
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(`${CURRENT_YEAR}/fall/cmpt/372/d100`),
      );
      expect(courses).toEqual([
        {
          department: "CMPT",
          courseNumber: "372",
          section: "D100",
          title: "Software Engineering",
          schedule: [
            {
              startTime: "10:30",
              endTime: "12:20",
              days: "Mo, We",
              sectionCode: "LEC",
              campus: "Burnaby",
            },
          ],
        },
      ]);
    });

    it("falls back to a null title and empty schedule when the outline is not found (404)", async () => {
      queryMock.mockResolvedValueOnce({
        rows: [{ department: "CMPT", course_number: "999", section: "Z999" }],
      });
      fetchMock.mockResolvedValueOnce({ ok: false, status: 404 });

      const courses = await fetchCoursesForUser(7, "fall");

      expect(courses).toEqual([
        {
          department: "CMPT",
          courseNumber: "999",
          section: "Z999",
          title: null,
          schedule: [],
        },
      ]);
    });

  });

  describe("getUserCourse (GET /api/getcourse/:term)", () => {
    it("returns 401 when there is no authenticated session", async () => {
      const req = createMockRequest({ term: "fall" });
      const res = createMockResponse();

      await getUserCourse(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(queryMock).not.toHaveBeenCalled();
    });

    it("returns 200 with the enriched course list on success", async () => {
      const req = createMockRequest({ term: "fall" }, 7);
      const res = createMockResponse();

      queryMock.mockResolvedValueOnce({
        rows: [{ department: "CMPT", course_number: "372", section: "D100" }],
      });
      fetchMock.mockResolvedValueOnce(
        mockOutlineResponse({
          info: { name: "CMPT 372 D100", title: "Software Engineering" },
          courseSchedule: [],
        }),
      );

      await getUserCourse(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        courses: [
          {
            department: "CMPT",
            courseNumber: "372",
            section: "D100",
            title: "Software Engineering",
            schedule: [],
          },
        ],
      });
    });

    it("returns 500 when the database query fails", async () => {
      const req = createMockRequest({ term: "fall" }, 7);
      const res = createMockResponse();

      queryMock.mockRejectedValueOnce(new Error("connection lost"));

      await getUserCourse(req, res);

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