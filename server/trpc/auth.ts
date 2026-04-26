import { z } from "zod";
import { signToken, verifyAdminCredentials } from "../auth";
import { publicProcedure, router } from "./trpc";
import { TRPCError } from "@trpc/server";

export const authRouter = router({
  login: publicProcedure
    .input(z.object({ username: z.string(), password: z.string() }))
    .mutation(async ({ input }) => {
      const verificationResult = await verifyAdminCredentials(input.username, input.password);

      if (verificationResult === "misconfigured") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Admin credentials not configured",
        });
      }

      if (verificationResult !== "valid") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      const adminUser = ((process.env.ADMIN_USER ?? "").trim() || "admin").trim();
      const token = signToken(adminUser);
      return { token };
    }),

  me: publicProcedure.query(({ ctx }) => {
    return { isAdmin: ctx.isAdmin };
  }),
});
