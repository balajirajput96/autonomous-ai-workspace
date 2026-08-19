import { parse as parseCookie } from "cookie";
import { z } from "zod";
import { COOKIE_NAME } from "../../shared/const";
import * as db from "../db";
import { ownerProcedure } from "../owner";
import {
  createHeartbeatJob,
  deleteHeartbeatJob,
  updateHeartbeatJob,
} from "../_core/heartbeat";
import { router } from "../_core/trpc";

export const cronExpressionSchema = z
  .string()
  .regex(
    /^\d+\s+\d+\s+\d+\s+\S+\s+\S+\s+\S+$/,
    "Use a six-field UTC cron expression."
  );

const workflowInput = z.object({
  name: z.string().min(3).max(120),
  trigger: z.string().min(3).max(80),
  action: z.string().min(5).max(3000),
  cronExpression: cronExpressionSchema,
});

function sessionFromHeaders(headers: { cookie?: string }) {
  const token = parseCookie(headers.cookie ?? "")[COOKIE_NAME];
  if (!token)
    throw new Error(
      "Your session is unavailable. Please sign in again before managing schedules."
    );
  return token;
}

export const workflowsRouter = router({
  list: ownerProcedure.query(({ ctx }) => db.listWorkflows(ctx.user.openId)),
  create: ownerProcedure
    .input(workflowInput)
    .mutation(async ({ ctx, input }) => {
      const workflow = await db.createWorkflow({
        ownerOpenId: ctx.user.openId,
        ...input,
      });
      await db.addActivity(
        ctx.user.openId,
        "workflow",
        `Created workflow: ${workflow.name}`,
        "info"
      );
      return workflow;
    }),
  setEnabled: ownerProcedure
    .input(
      z.object({
        workflowId: z.number().int().positive(),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const workflow = await db.getWorkflow(ctx.user.openId, input.workflowId);
      if (!workflow) throw new Error("Workflow not found");
      const sessionToken = sessionFromHeaders(ctx.req.headers);
      if (input.enabled && !workflow.scheduleCronTaskUid) {
        const job = await createHeartbeatJob(
          {
            name: `workspace-workflow-${workflow.id}`,
            cron: workflow.cronExpression,
            path: "/api/scheduled/workflow",
            payload: { workflowId: workflow.id },
            description: `Private AI Workspace workflow: ${workflow.name}`,
          },
          sessionToken
        );
        await db.updateWorkflow(workflow.id, {
          enabled: true,
          scheduleCronTaskUid: job.taskUid,
        });
      } else if (workflow.scheduleCronTaskUid) {
        await updateHeartbeatJob(
          workflow.scheduleCronTaskUid,
          { enable: input.enabled },
          sessionToken
        );
        await db.updateWorkflow(workflow.id, { enabled: input.enabled });
      } else {
        await db.updateWorkflow(workflow.id, { enabled: false });
      }
      await db.addActivity(
        ctx.user.openId,
        "workflow",
        `${input.enabled ? "Enabled" : "Paused"} workflow: ${workflow.name}`,
        "info"
      );
      return { success: true };
    }),
  delete: ownerProcedure
    .input(z.object({ workflowId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const workflow = await db.getWorkflow(ctx.user.openId, input.workflowId);
      if (!workflow) throw new Error("Workflow not found");
      if (workflow.scheduleCronTaskUid)
        await deleteHeartbeatJob(
          workflow.scheduleCronTaskUid,
          sessionFromHeaders(ctx.req.headers)
        );
      await db.deleteWorkflow(workflow.id);
      await db.addActivity(
        ctx.user.openId,
        "workflow",
        `Deleted workflow: ${workflow.name}`,
        "info"
      );
      return { success: true };
    }),
});
