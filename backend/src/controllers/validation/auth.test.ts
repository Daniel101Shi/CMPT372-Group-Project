import { describe, expect, it } from "vitest";

import { authValidation } from "./auth.js";

// the limits mirror column widths in schema.sql, so only the edges are worth testing.
// one under, exactly on, one over.
describe("authValidation", () => {
  it("accepts usernames from 3 to 50 characters and rejects either side", () => {
    expect(authValidation.validateUsername("abc")).toBeNull();
    expect(authValidation.validateUsername("a".repeat(50))).toBeNull();
    expect(authValidation.validateUsername("ab")).not.toBeNull();
    expect(authValidation.validateUsername("a".repeat(51))).not.toBeNull();
  });

  it("measures the username after trimming", () => {
    expect(authValidation.validateUsername("  daniel  ")).toBeNull();
    expect(authValidation.validateUsername("  ab  ")).not.toBeNull();
    expect(authValidation.validateUsername("   ")).not.toBeNull();
  });

  it("keeps usernames to letters, numbers and . _ -", () => {
    expect(authValidation.validateUsername("daniel.shi_1-2")).toBeNull();
    expect(authValidation.validateUsername("daniel shi")).not.toBeNull();
    expect(authValidation.validateUsername("daniel@sfu.ca")).not.toBeNull();
  });

  it("names the field it rejected so the form can highlight it", () => {
    expect(authValidation.validateUsername("ab")?.field).toBe("username");
    expect(authValidation.validatePassword("short")?.field).toBe("password");
  });

  it("accepts passwords from 8 to 72 bytes and rejects either side", () => {
    expect(authValidation.validatePassword("a".repeat(8))).toBeNull();
    expect(authValidation.validatePassword("a".repeat(72))).toBeNull();
    expect(authValidation.validatePassword("a".repeat(7))).not.toBeNull();
    expect(authValidation.validatePassword("a".repeat(73))).not.toBeNull();
  });

  it("counts password bytes rather than characters, because bcrypt does", () => {
    // 24 four-byte emoji: 24 characters but 96 bytes. bcrypt silently truncates past 72,
    // so measuring with .length would let this through and quietly ignore the tail.
    const emoji = "🔑".repeat(24);
    expect(emoji.length).toBeLessThan(72);
    expect(authValidation.validatePassword(emoji)).not.toBeNull();
  });

  it("treats contact info as optional but capped at 100 characters", () => {
    expect(authValidation.validateContactInfo(undefined)).toBeNull();
    expect(authValidation.validateContactInfo("a".repeat(100))).toBeNull();
    expect(authValidation.validateContactInfo("a".repeat(101))).not.toBeNull();
  });

  it("only treats a plain object as a usable request body", () => {
    expect(authValidation.isObjectBody({ username: "x" })).toBe(true);
    // undefined is what express.json() leaves when content-type isn't json
    expect(authValidation.isObjectBody(undefined)).toBe(false);
    // typeof null === "object" in javascript, and arrays are objects too
    expect(authValidation.isObjectBody(null)).toBe(false);
    expect(authValidation.isObjectBody([1, 2])).toBe(false);
  });

  it("rejects fields the client shouldn't be able to set", () => {
    const allowed = ["username", "password", "contactInfo"];
    expect(authValidation.rejectUnknownKeys({ username: "d" }, allowed)).toBeNull();

    const failure = authValidation.rejectUnknownKeys({ role: "admin", user_id: 1 }, allowed);
    expect(failure?.field).toBe("role");
    expect(failure?.message).toContain("user_id");
  });
});
