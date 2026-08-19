import { describe, expect, it, beforeEach, vi } from "vitest";
import { ENV } from "./_core/env";
import type { TrpcContext } from "./_core/context";

const { dbMock, heartbeatMock } = vi.hoisted(() => ({
  dbMock: {
    addActivity: vi.fn(),
    createWorkflow: vi.fn(),
    deleteWorkflow: vi.fn(),
    getWorkflow: vi.fn(),
    listWorkflows: vi.fn(),
    updateWorkflow: vi.fn(),
  },
  heartbeatMock: {
    createHeartbeatJob: vi.fn(),
    deleteHeartbeatJob: vi.fn(),
    updateHeartbeatJob: vi.fn(),
  },
}));

vi.mock("./db", () => dbMock);
vi.mock("./_core/heartbeat", () => heartbeatMock);

import { workflowsRouter } from "./routers/workflows";

function ownerContext(): TrpcContext {
  const now = new Date();
  return {
    user: {
      id: 1,
      openId: ENV.ownerOpenId,
      name: "Owner",
      email: "owner@example.com",
      loginMethod: "manus",
      role: "admin",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    },
    req: {
      headers: { cookie: "app_session_id=test-session" },
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const workflow = {
  id: 44,
  ownerOpenId: ENV.ownerOpenId,
  name: "Daily review",
  trigger: "Daily summary",
  action: "Create a concise daily review of today’s project work.",
  cronExpression: "0 0 9 * * *",
  enabled: false,
  scheduleCronTaskUid: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("workflow lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a private workflow and records an activity event", async () => {
    dbMock.createWorkflow.mockResolvedValue(workflow);
    const caller = workflowsRouter.createCaller(ownerContext());

    const result = await caller.create({
      name: workflow.name,
      trigger: workflow.trigger,
      action: workflow.action,
      cronExpression: workflow.cronExpression,
    });

    expect(result).toEqual(workflow);
    expect(dbMock.createWorkflow).toHaveBeenCalledWith({
      ownerOpenId: ENV.ownerOpenId,
      name: workflow.name,
      trigger: workflow.trigger,
      action: workflow.action,
      cronExpression: workflow.cronExpression,
    });
    expect(dbMock.addActivity).toHaveBeenCalledWith(
      ENV.ownerOpenId,
      "workflow",
      "Created workflow: Daily review",
      "info"
    );
  });

  it("creates a Heartbeat job when enabling an unscheduled workflow", async () => {
    dbMock.getWorkflow.mockResolvedValue(workflow);
    heartbeatMock.createHeartbeatJob.mockResolvedValue({
      taskUid: "cron-workflow-44",
    });
    const caller = workflowsRouter.createCaller(ownerContext());

    await caller.setEnabled({ workflowId: workflow.id, enabled: true });

    expect(heartbeatMock.createHeartbeatJob).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "workspace-workflow-44",
        cron: "0 0 9 * * *",
        path: "/api/scheduled/workflow",
      }),
      "test-session"
    );
    expect(dbMock.updateWorkflow).toHaveBeenCalledWith(workflow.id, {
      enabled: true,
      scheduleCronTaskUid: "cron-workflow-44",
    });
  });

  it("removes the external job before deleting a scheduled workflow", async () => {
    dbMock.getWorkflow.mockResolvedValue({
      ...workflow,
      scheduleCronTaskUid: "cron-workflow-44",
      enabled: true,
    });
    const caller = workflowsRouter.createCaller(ownerContext());

    await caller.delete({ workflowId: workflow.id });

    expect(heartbeatMock.deleteHeartbeatJob).toHaveBeenCalledWith(
      "cron-workflow-44",
      "test-session"
    );
    expect(dbMock.deleteWorkflow).toHaveBeenCalledWith(workflow.id);
  });
});
