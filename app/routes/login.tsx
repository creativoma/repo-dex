import { redirect } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { signToken, verifyAdminCredentials } from "../../server/auth";

export async function loader(_args: LoaderFunctionArgs) {
  return redirect("/");
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const username = String(form.get("username") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const redirectToRaw = String(form.get("redirectTo") ?? "/");
  const redirectTo = redirectToRaw.startsWith("/") ? redirectToRaw : "/";

  const verificationResult = await verifyAdminCredentials(username, password);
  if (verificationResult === "misconfigured") {
    return { error: "Server misconfiguration" };
  }

  if (verificationResult !== "valid") {
    return { error: "Invalid credentials" };
  }

  const adminUser = ((process.env.ADMIN_USER ?? "").trim() || "admin").trim();
  const token = signToken(adminUser);
  const isProd = process.env.NODE_ENV === "production";
  const cookie = `auth_token=${token}; HttpOnly; ${isProd ? "Secure; " : ""}SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`;

  return redirect(redirectTo, { headers: { "Set-Cookie": cookie } });
}

export default function Login() {
  return null;
}
