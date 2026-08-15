import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";
import { aiRouter } from "./routers/ai";
import { workflowsRouter } from "./routers/workflows";
import { workspaceRouter } from "./routers/workspace";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user ? { ...ctx.user, isOwner: ctx.user.openId === ENV.ownerOpenId } : null),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  workspace: workspaceRouter,
  ai: aiRouter,
  workflows: workflowsRouter,
});

export type AppRouter = typeof appRouter;
