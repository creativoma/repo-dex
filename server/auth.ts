import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const DUMMY_BCRYPT_HASH = "$2b$12$" + "a".repeat(53);

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET env var is required");
  if (secret.length < 32) throw new Error("JWT_SECRET must be at least 32 characters");
  return secret;
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<"valid" | "invalid" | "misconfigured"> {
  const isProd = process.env.NODE_ENV === "production";
  const configuredUser = (process.env.ADMIN_USER ?? "").trim();
  const configuredHash = (process.env.ADMIN_PASSWORD_HASH ?? "").trim();
  const adminUser = configuredUser || "admin";
  const normalizedUsername = username.trim();

  if (!configuredHash) {
    // Keep timing similar to configured path even in fallback mode.
    await verifyPassword(password, DUMMY_BCRYPT_HASH);

    if (isProd) return "misconfigured";
    return normalizedUsername === adminUser && password === "admin" ? "valid" : "invalid";
  }

  const usernameMatch = normalizedUsername === adminUser;
  const passwordValid = await verifyPassword(
    password,
    usernameMatch ? configuredHash : DUMMY_BCRYPT_HASH
  );

  return usernameMatch && passwordValid ? "valid" : "invalid";
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, getSecret(), { algorithm: "HS256", expiresIn: "7d" });
}

export function verifyToken(token: string): { sub: string } {
  return jwt.verify(token, getSecret(), { algorithms: ["HS256"] }) as { sub: string };
}

export function parseCookieToken(cookieHeader: string): string | null {
  const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]+)/);
  return match ? match[1] : null;
}
