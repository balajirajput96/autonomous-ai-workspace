import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { ENV } from "./_core/env";
import type { TrpcContext } from "./_core/context";

function context(openId: string): TrpcContext {
  const now = new Date();
  return {
    user: {
      id: 1,
      openId,
      name: "Workspace User",
      email: null,
      loginMethod: "manus",
      role: "user",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    },
    req: { headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("auth.me owner identity", () => {
  it("marks the configured OWNER_OPEN_ID as the owner", async () => {
    const result = await appRouter.createCaller(context(ENV.ownerOpenId)).auth.me();
    expect(result?.isOwner).toBe(true);
  });

  it("does not mark another OAuth identity as the owner", async () => {
    const result = await appRouter.createCaller(context("different-open-id")).auth.me();
    expect(result?.isOwner).toBe(false);
  });
});

// Keep this test deterministic when the local environment omits OWNER_OPEN_ID.
if (!ENV.ownerOpenId) {
  throw new Error("OWNER_OPEN_ID must be configured for owner identity tests");
}
