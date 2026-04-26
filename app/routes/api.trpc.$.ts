import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../server/trpc/router";
import { createContext } from "../../server/trpc/context";

async function handler(request: Request): Promise<Response> {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: ({ req }) => createContext({ req }),
  });
}

export const loader = ({ request }: { request: Request }) => handler(request);
export const action = ({ request }: { request: Request }) => handler(request);
