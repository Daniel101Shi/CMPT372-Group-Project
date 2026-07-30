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

import {
  acceptFriendRequest,
  deleteFriendship,
  sendFriendRequest,
} from "./friendshipController.js";

function createMockResponse() {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function createMockRequest(body: Record<string, unknown>) {
  return {
    body,
    session: {},
  } as Request;
}

describe("friendshipController", () => {
  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  beforeEach(() => {
    queryMock.mockReset();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("sendFriendRequest returns 201 when a new invite is created", async () => {
    const req = createMockRequest({ requesterId: 7, recipientId: 12 });
    const res = createMockResponse();
    const friendship = { user_id_1: 7, user_id_2: 12, pending: true };

    queryMock.mockResolvedValueOnce({
      rowCount: 2,
      rows: [{ user_id: 7 }, { user_id: 12 }],
    });
    queryMock.mockResolvedValueOnce({
      rowCount: 0,
      rows: [],
    });
    queryMock.mockResolvedValueOnce({
      rowCount: 1,
      rows: [friendship],
    });

    await sendFriendRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Friendship request created successfully.",
      friendship,
    });
    expect(queryMock).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("INSERT INTO friendships"),
      [7, 12],
    );
  });

  it("acceptFriendRequest returns 200 when a pending invite is accepted", async () => {
    const req = createMockRequest({ requesterId: 7, recipientId: 12 });
    const res = createMockResponse();
    const acceptedFriendship = { user_id_1: 7, user_id_2: 12, pending: false };

    queryMock.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ user_id_1: 7, user_id_2: 12, pending: true }],
    });
    queryMock.mockResolvedValueOnce({
      rowCount: 1,
      rows: [acceptedFriendship],
    });

    await acceptFriendRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Friendship request accepted successfully.",
      friendship: acceptedFriendship,
    });
    expect(queryMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("UPDATE friendships"),
      [7, 12],
    );
  });

  it("deleteFriendship returns 200 when an existing friendship is removed", async () => {
    const req = createMockRequest({ requesterId: 7, recipientId: 12 });
    const res = createMockResponse();
    const deletedFriendship = { user_id_1: 7, user_id_2: 12, pending: false };

    queryMock.mockResolvedValueOnce({
      rowCount: 1,
      rows: [deletedFriendship],
    });
    queryMock.mockResolvedValueOnce({
      rowCount: 1,
      rows: [deletedFriendship],
    });

    await deleteFriendship(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Friendship deleted successfully.",
      friendship: deletedFriendship,
    });
    expect(queryMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("DELETE FROM friendships"),
      [7, 12],
    );
  });
});
