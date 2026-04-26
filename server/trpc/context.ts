import { parseCookieToken, verifyToken } from "../auth";

export async function createContext({ req }: { req: Request }) {
  // CSRF defense-in-depth: reject cross-origin state-changing requests
  const origin = req.headers.get("origin");
  const publicOrigin = process.env.PUBLIC_ORIGIN;
  if (req.method !== "GET" && origin && publicOrigin && origin !== publicOrigin) {
    throw new Error("Forbidden: cross-origin request blocked");
  }

  const cookieHeader = req.headers.get("cookie") ?? "";
  const token = parseCookieToken(cookieHeader);

  let isAdmin = false;
  if (token) {
    try {
      verifyToken(token);
      isAdmin = true;
    } catch {
      // invalid or expired token
    }
  }

  return { isAdmin, req };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
