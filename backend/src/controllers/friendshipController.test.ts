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

  it("sendFriendRequest returns 400 when either user id is not an integer", async () => {
    const req = createMockRequest({ requesterId: "7", recipientId: 12 });
    const res = createMockResponse();

    await sendFriendRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "requesterId and recipientId must both be integers.",
    });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("sendFriendRequest returns 400 when both ids are the same user", async () => {
    const req = createMockRequest({ requesterId: 7, recipientId: 7 });
    const res = createMockResponse();

    await sendFriendRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "requesterId and recipientId must be different users.",
    });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("sendFriendRequest returns 404 when one or both users do not exist", async () => {
    const req = createMockRequest({ requesterId: 7, recipientId: 12 });
    const res = createMockResponse();

    queryMock.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ user_id: 7 }],
    });

    await sendFriendRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "One or both users do not exist.",
    });
    expect(queryMock).toHaveBeenCalledTimes(1);
  });

  it("sendFriendRequest returns 409 when a pending invite already exists", async () => {
    const req = createMockRequest({ requesterId: 7, recipientId: 12 });
    const res = createMockResponse();

    queryMock.mockResolvedValueOnce({
      rowCount: 2,
      rows: [{ user_id: 7 }, { user_id: 12 }],
    });
    queryMock.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ user_id_1: 7, user_id_2: 12, pending: true }],
    });

    await sendFriendRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: "A friendship request already exists between these users.",
    });
  });

  it("sendFriendRequest returns 409 when the users are already friends", async () => {
    const req = createMockRequest({ requesterId: 7, recipientId: 12 });
    const res = createMockResponse();

    queryMock.mockResolvedValueOnce({
      rowCount: 2,
      rows: [{ user_id: 7 }, { user_id: 12 }],
    });
    queryMock.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ user_id_1: 7, user_id_2: 12, pending: false }],
    });

    await sendFriendRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: "These users are already friends.",
    });
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

  it("acceptFriendRequest returns 404 when the invite does not exist", async () => {
    const req = createMockRequest({ requesterId: 7, recipientId: 12 });
    const res = createMockResponse();

    queryMock.mockResolvedValueOnce({
      rowCount: 0,
      rows: [],
    });

    await acceptFriendRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "Friendship request not found.",
    });
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

  it("deleteFriendship returns 404 when no friendship exists", async () => {
    const req = createMockRequest({ requesterId: 7, recipientId: 12 });
    const res = createMockResponse();

    queryMock.mockResolvedValueOnce({
      rowCount: 0,
      rows: [],
    });

    await deleteFriendship(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "Friendship not found.",
    });
  });
});
