import { afterEach, describe, expect, it, vi } from "vitest";
import * as authModule from "../auth";
import { authRouter } from "./auth";

const makeCtx = (isAdmin = false) => ({
  isAdmin,
  req: new Request("http://localhost/"),
});

describe("authRouter.login", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a token when credentials are valid", async () => {
    vi.spyOn(authModule, "verifyAdminCredentials").mockResolvedValue("valid");
    vi.spyOn(authModule, "signToken").mockReturnValue("signed-token");
    process.env.ADMIN_USER = "admin";

    const caller = authRouter.createCaller(makeCtx());
    const result = await caller.login({ username: "admin", password: "secret" });

    expect(result.token).toBe("signed-token");
  });

  it("throws UNAUTHORIZED when credentials are invalid", async () => {
    vi.spyOn(authModule, "verifyAdminCredentials").mockResolvedValue("invalid");

    const caller = authRouter.createCaller(makeCtx());
    await expect(caller.login({ username: "admin", password: "wrong" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("throws INTERNAL_SERVER_ERROR when admin env is misconfigured", async () => {
    vi.spyOn(authModule, "verifyAdminCredentials").mockResolvedValue("misconfigured");

    const caller = authRouter.createCaller(makeCtx());
    await expect(caller.login({ username: "admin", password: "admin" })).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
  });
});

describe("authRouter.me", () => {
  it("returns isAdmin: true for an authenticated admin", async () => {
    const caller = authRouter.createCaller(makeCtx(true));
    expect(await caller.me()).toEqual({ isAdmin: true });
  });

  it("returns isAdmin: false for an unauthenticated user", async () => {
    const caller = authRouter.createCaller(makeCtx(false));
    expect(await caller.me()).toEqual({ isAdmin: false });
  });
});
