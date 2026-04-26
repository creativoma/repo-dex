import { redirect } from "react-router";
import type { ActionFunctionArgs } from "react-router";

export async function action(_args: ActionFunctionArgs) {
  const isProd = process.env.NODE_ENV === "production";
  return redirect("/", {
    headers: {
      "Set-Cookie": `auth_token=; HttpOnly; ${isProd ? "Secure; " : ""}SameSite=Strict; Path=/; Max-Age=0`,
    },
  });
}
