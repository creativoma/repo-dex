import { afterEach, beforeEach, describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { parseCookieToken, signToken, verifyAdminCredentials, verifyToken } from "./auth";

describe("parseCookieToken", () => {
  it("extracts the token when it is the only cookie", () => {
    expect(parseCookieToken("auth_token=abc123")).toBe("abc123");
  });

  it("extracts the token when it appears after other cookies", () => {
    expect(parseCookieToken("session=xyz; auth_token=tok456; theme=dark")).toBe("tok456");
  });

  it("extracts the token when it appears before other cookies", () => {
    expect(parseCookieToken("auth_token=tok789; other=val")).toBe("tok789");
  });

  it("returns null when auth_token is absent", () => {
    expect(parseCookieToken("session=xyz; theme=dark")).toBeNull();
  });

  it("returns null for an empty cookie header", () => {
    expect(parseCookieToken("")).toBeNull();
  });

  it("does not match a cookie whose name ends with auth_token", () => {
    expect(parseCookieToken("not_auth_token=tricky")).toBeNull();
  });
});

describe("signToken / verifyToken", () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret-32-chars-long-enough!";
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  it("signs a token and verifies the sub claim", () => {
    const token = signToken("user-42");
    const payload = verifyToken(token);
    expect(payload.sub).toBe("user-42");
  });

  it("throws when verifying a tampered token", () => {
    const token = signToken("user-42");
    expect(() => verifyToken(token + "tampered")).toThrow();
  });

  it("throws signToken when JWT_SECRET is missing", () => {
    delete process.env.JWT_SECRET;
    expect(() => signToken("user-1")).toThrow("JWT_SECRET env var is required");
  });
});

describe("verifyAdminCredentials", () => {
  const originalEnv = {
    NODE_ENV: process.env.NODE_ENV,
    ADMIN_USER: process.env.ADMIN_USER,
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
  };

  afterEach(() => {
    process.env.NODE_ENV = originalEnv.NODE_ENV;
    process.env.ADMIN_USER = originalEnv.ADMIN_USER;
    process.env.ADMIN_PASSWORD_HASH = originalEnv.ADMIN_PASSWORD_HASH;
  });

  it("allows admin/admin in development when hash is missing", async () => {
    process.env.NODE_ENV = "development";
    process.env.ADMIN_USER = "admin";
    delete process.env.ADMIN_PASSWORD_HASH;

    await expect(verifyAdminCredentials("admin", "admin")).resolves.toBe("valid");
    await expect(verifyAdminCredentials("admin", "wrong")).resolves.toBe("invalid");
  });

  it("returns misconfigured in production when hash is missing", async () => {
    process.env.NODE_ENV = "production";
    process.env.ADMIN_USER = "admin";
    delete process.env.ADMIN_PASSWORD_HASH;

    await expect(verifyAdminCredentials("admin", "admin")).resolves.toBe("misconfigured");
  });

  it("validates against configured hash when present", async () => {
    process.env.NODE_ENV = "development";
    process.env.ADMIN_USER = "admin";
    process.env.ADMIN_PASSWORD_HASH = await bcrypt.hash("admin", 4);

    await expect(verifyAdminCredentials("admin", "admin")).resolves.toBe("valid");
    await expect(verifyAdminCredentials("admin", "other")).resolves.toBe("invalid");
    await expect(verifyAdminCredentials("other", "admin")).resolves.toBe("invalid");
  });
});
