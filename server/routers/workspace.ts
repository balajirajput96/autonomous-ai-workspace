import { z } from "zod";
import * as db from "../db";
import { ownerProcedure } from "../owner";
import { router } from "../_core/trpc";

export const workspaceRouter = router({
  summary: ownerProcedure.query(({ ctx }) =>
    db.getDashboardSummary(ctx.user.openId)
  ),
  activity: ownerProcedure.query(({ ctx }) =>
    db.listActivities(ctx.user.openId)
  ),
});
