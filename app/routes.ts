import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  route("api/trpc/*", "routes/api.trpc.$.ts"),
  route("/.well-known/appspecific/com.chrome.devtools.json", "routes/well-known.devtools.ts"),
] satisfies RouteConfig;
