import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  activityEvents,
  automationWorkflows,
  chatMessages,
  conversations,
  imageGenerations,
  type User,
  users,
  workflowRuns,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    _db = drizzle(process.env.DATABASE_URL);
  }
  return _db;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db;
}

function insertId(result: unknown) {
  const first = Array.isArray(result) ? result[0] : result;
  return Number((first as { insertId?: number }).insertId);
}

export async function upsertUser(
  user: Partial<User> & Pick<User, "openId">
): Promise<void> {
  const db = await requireDb();
  const values = {
    openId: user.openId,
    name: user.name ?? null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? null,
    role:
      user.openId === ENV.ownerOpenId
        ? ("admin" as const)
        : (user.role ?? "user"),
    lastSignedIn: user.lastSignedIn ?? new Date(),
  };
  await db
    .insert(users)
    .values(values)
    .onDuplicateKeyUpdate({
      set: {
        name: values.name,
        email: values.email,
        loginMethod: values.loginMethod,
        role: values.role,
        lastSignedIn: values.lastSignedIn,
      },
    });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (
    await db.select().from(users).where(eq(users.openId, openId)).limit(1)
  )[0];
}

export async function listConversations(ownerOpenId: string) {
  const db = await requireDb();
  return db
    .select()
    .from(conversations)
    .where(eq(conversations.ownerOpenId, ownerOpenId))
    .orderBy(desc(conversations.updatedAt));
}

export async function createConversation(ownerOpenId: string, title: string) {
  const db = await requireDb();
  const result = await db.insert(conversations).values({ ownerOpenId, title });
  const id = insertId(result);
  return (
    await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id))
      .limit(1)
  )[0]!;
}

export async function getConversation(
  ownerOpenId: string,
  conversationId: number
) {
  const db = await requireDb();
  return (
    await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.ownerOpenId, ownerOpenId)
        )
      )
      .limit(1)
  )[0];
}

export async function getConversationMessages(
  ownerOpenId: string,
  conversationId: number
) {
  const conversation = await getConversation(ownerOpenId, conversationId);
  if (!conversation) return [];
  const db = await requireDb();
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId))
    .orderBy(chatMessages.createdAt);
}

export async function addChatMessage(
  conversationId: number,
  role: "user" | "assistant",
  content: string
) {
  const db = await requireDb();
  const result = await db
    .insert(chatMessages)
    .values({ conversationId, role, content });
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));
  const id = insertId(result);
  return (
    await db.select().from(chatMessages).where(eq(chatMessages.id, id)).limit(1)
  )[0]!;
}

export async function listImages(ownerOpenId: string) {
  const db = await requireDb();
  return db
    .select()
    .from(imageGenerations)
    .where(eq(imageGenerations.ownerOpenId, ownerOpenId))
    .orderBy(desc(imageGenerations.createdAt));
}

export async function addImageGeneration(data: {
  ownerOpenId: string;
  prompt: string;
  imageKey: string;
  imageUrl: string;
}) {
  const db = await requireDb();
  const result = await db.insert(imageGenerations).values(data);
  const id = insertId(result);
  return (
    await db
      .select()
      .from(imageGenerations)
      .where(eq(imageGenerations.id, id))
      .limit(1)
  )[0]!;
}

export async function listWorkflows(ownerOpenId: string) {
  const db = await requireDb();
  return db
    .select()
    .from(automationWorkflows)
    .where(eq(automationWorkflows.ownerOpenId, ownerOpenId))
    .orderBy(desc(automationWorkflows.updatedAt));
}

export async function createWorkflow(data: {
  ownerOpenId: string;
  name: string;
  trigger: string;
  action: string;
  cronExpression: string;
}) {
  const db = await requireDb();
  const result = await db
    .insert(automationWorkflows)
    .values({ ...data, enabled: false });
  const id = insertId(result);
  return (
    await db
      .select()
      .from(automationWorkflows)
      .where(eq(automationWorkflows.id, id))
      .limit(1)
  )[0]!;
}

export async function getWorkflow(ownerOpenId: string, workflowId: number) {
  const db = await requireDb();
  return (
    await db
      .select()
      .from(automationWorkflows)
      .where(
        and(
          eq(automationWorkflows.id, workflowId),
          eq(automationWorkflows.ownerOpenId, ownerOpenId)
        )
      )
      .limit(1)
  )[0];
}

export async function getWorkflowById(workflowId: number) {
  const db = await requireDb();
  return (
    await db
      .select()
      .from(automationWorkflows)
      .where(eq(automationWorkflows.id, workflowId))
      .limit(1)
  )[0];
}

export async function getWorkflowByTaskUid(taskUid: string) {
  const db = await requireDb();
  return (
    await db
      .select()
      .from(automationWorkflows)
      .where(eq(automationWorkflows.scheduleCronTaskUid, taskUid))
      .limit(1)
  )[0];
}

export async function updateWorkflow(
  workflowId: number,
  values: Partial<typeof automationWorkflows.$inferInsert>
) {
  const db = await requireDb();
  await db
    .update(automationWorkflows)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(automationWorkflows.id, workflowId));
}

export async function deleteWorkflow(workflowId: number) {
  const db = await requireDb();
  await db
    .delete(automationWorkflows)
    .where(eq(automationWorkflows.id, workflowId));
}

export async function createWorkflowRun(workflowId: number) {
  const db = await requireDb();
  const result = await db
    .insert(workflowRuns)
    .values({ workflowId, status: "running" });
  return insertId(result);
}

export async function finishWorkflowRun(
  runId: number,
  status: "succeeded" | "failed",
  data: { output?: string; error?: string }
) {
  const db = await requireDb();
  await db
    .update(workflowRuns)
    .set({ status, ...data, completedAt: new Date() })
    .where(eq(workflowRuns.id, runId));
}

export async function addActivity(
  ownerOpenId: string,
  type: string,
  detail: string,
  status: "started" | "succeeded" | "failed" | "info"
) {
  const db = await requireDb();
  await db.insert(activityEvents).values({ ownerOpenId, type, detail, status });
}

export async function listActivities(ownerOpenId: string) {
  const db = await requireDb();
  return db
    .select()
    .from(activityEvents)
    .where(eq(activityEvents.ownerOpenId, ownerOpenId))
    .orderBy(desc(activityEvents.createdAt))
    .limit(100);
}

export async function getDashboardSummary(ownerOpenId: string) {
  const [conversationRows, imageRows, workflowRows, activities] =
    await Promise.all([
      listConversations(ownerOpenId),
      listImages(ownerOpenId),
      listWorkflows(ownerOpenId),
      listActivities(ownerOpenId),
    ]);
  return {
    conversations: conversationRows.length,
    images: imageRows.length,
    workflows: workflowRows.length,
    activeWorkflows: workflowRows.filter(item => item.enabled).length,
    latestActivity: activities.slice(0, 5),
  };
}
