import type { Express, Request, Response } from "express";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { sdk } from "./_core/sdk";

function textFromLLM(
  content: string | Array<{ type: "text"; text: string } | unknown>
) {
  if (typeof content === "string") return content;
  return content
    .filter((item): item is { type: "text"; text: string } =>
      Boolean(
        item &&
          typeof item === "object" &&
          "type" in item &&
          (item as { type?: string }).type === "text" &&
          "text" in item
      )
    )
    .map(item => item.text)
    .join("\n");
}

export async function executeWorkflow(workflowId: number) {
  const workflowRow = await db.getWorkflowById(workflowId);
  if (!workflowRow) throw new Error("Workflow not found");
  const runId = await db.createWorkflowRun(workflowRow.id);
  await db.addActivity(
    workflowRow.ownerOpenId,
    "workflow",
    `Started scheduled workflow: ${workflowRow.name}`,
    "started"
  );
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You execute a private workspace automation. Produce a concise, useful result based only on the requested action. Do not claim you contacted external systems or completed actions you cannot verify.",
        },
        {
          role: "user",
          content: `Workflow name: ${workflowRow.name}\nTrigger: ${workflowRow.trigger}\nRequested action: ${workflowRow.action}`,
        },
      ],
      maxTokens: 900,
    });
    const output = textFromLLM(response.choices[0]?.message.content ?? "");
    await db.finishWorkflowRun(runId, "succeeded", { output });
    await db.addActivity(
      workflowRow.ownerOpenId,
      "workflow",
      `Completed scheduled workflow: ${workflowRow.name}`,
      "succeeded"
    );
    await notifyOwner({
      title: "Automation completed",
      content: `“${workflowRow.name}” completed successfully.`,
    });
    return { output };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown workflow error";
    await db.finishWorkflowRun(runId, "failed", { error: message });
    await db.addActivity(
      workflowRow.ownerOpenId,
      "workflow",
      `Failed scheduled workflow: ${workflowRow.name}`,
      "failed"
    );
    await notifyOwner({
      title: "Automation failed",
      content: `“${workflowRow.name}” failed: ${message.slice(0, 240)}`,
    });
    throw error;
  }
}

export function registerScheduledWorkflowRoute(app: Express) {
  app.post("/api/scheduled/workflow", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid)
        return res.status(403).json({ error: "cron-only" });
      const workflow = await db.getWorkflowByTaskUid(user.taskUid);
      if (!workflow) return res.json({ ok: true, skipped: "orphan" });
      if (!workflow.enabled) return res.json({ ok: true, skipped: "disabled" });
      const result = await executeWorkflow(workflow.id);
      return res.json({ ok: true, output: result.output });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown scheduled workflow error";
      return res.status(500).json({
        error: message,
        timestamp: new Date().toISOString(),
        context: { path: req.path },
      });
    }
  });
}
