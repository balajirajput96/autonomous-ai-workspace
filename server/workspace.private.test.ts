import { describe, expect, it } from "vitest";
import { ENV } from "./_core/env";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import { cronExpressionSchema } from "./routers/workflows";

function contextFor(openId: string): TrpcContext {
  const now = new Date();
  return {
    user: {
      id: 12,
      openId,
      name: "Test user",
      email: "test@example.com",
      loginMethod: "manus",
      role: openId === ENV.ownerOpenId ? "admin" : "user",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    },
    req: { headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("private workspace controls", () => {
  it("rejects workspace data access from a signed-in non-owner", async () => {
    const caller = appRouter.createCaller(contextFor("another-authenticated-user"));
    await expect(caller.workspace.summary()).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "This private workspace is available to its owner only.",
    });
  });

  it("accepts six-field UTC expressions and rejects five-field cron input", () => {
    expect(cronExpressionSchema.safeParse("0 0 9 * * *").success).toBe(true);
    expect(cronExpressionSchema.safeParse("0 9 * * *").success).toBe(false);
  });
});
