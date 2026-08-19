import { TRPCError } from "@trpc/server";
import { ENV } from "./_core/env";
import { protectedProcedure } from "./_core/trpc";

export const ownerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.openId !== ENV.ownerOpenId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This private workspace is available to its owner only.",
    });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
