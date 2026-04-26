import { router } from "./trpc";
import { analyzeRouter } from "./analyze";
import { resourcesRouter } from "./resources";
import { authRouter } from "./auth";

export const appRouter = router({
  analyze: analyzeRouter,
  resources: resourcesRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
