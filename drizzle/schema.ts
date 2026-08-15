import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("conversations_owner_updated_idx").on(table.ownerOpenId, table.updatedAt)]);

export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("chat_messages_conversation_idx").on(table.conversationId, table.createdAt)]);

export const imageGenerations = mysqlTable("imageGenerations", {
  id: int("id").autoincrement().primaryKey(),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull(),
  prompt: text("prompt").notNull(),
  imageKey: varchar("imageKey", { length: 512 }).notNull(),
  imageUrl: text("imageUrl").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("image_generations_owner_created_idx").on(table.ownerOpenId, table.createdAt)]);

export const automationWorkflows = mysqlTable("automationWorkflows", {
  id: int("id").autoincrement().primaryKey(),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  trigger: varchar("trigger", { length: 80 }).notNull(),
  action: text("action").notNull(),
  cronExpression: varchar("cronExpression", { length: 64 }).notNull(),
  enabled: boolean("enabled").default(false).notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("workflows_owner_updated_idx").on(table.ownerOpenId, table.updatedAt),
  index("workflows_cron_task_idx").on(table.scheduleCronTaskUid),
]);

export const workflowRuns = mysqlTable("workflowRuns", {
  id: int("id").autoincrement().primaryKey(),
  workflowId: int("workflowId").notNull(),
  status: mysqlEnum("status", ["running", "succeeded", "failed"]).notNull(),
  output: text("output"),
  error: text("error"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, table => [index("workflow_runs_workflow_started_idx").on(table.workflowId, table.startedAt)]);

export const activityEvents = mysqlTable("activityEvents", {
  id: int("id").autoincrement().primaryKey(),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull(),
  type: varchar("type", { length: 80 }).notNull(),
  detail: text("detail").notNull(),
  status: mysqlEnum("status", ["started", "succeeded", "failed", "info"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("activity_events_owner_created_idx").on(table.ownerOpenId, table.createdAt)]);

export type User = typeof users.$inferSelect;
