import { describe, expect, it } from "vitest";
import { ENV } from "./_core/env";
import type { TrpcContext } from "./_core/context";
import { aiRouter } from "./routers/ai";

function ownerContext(): TrpcContext {
  const now = new Date();
  return {
    user: { id: 1, openId: ENV.ownerOpenId, name: "Owner", email: "owner@example.com", loginMethod: "manus", role: "admin", createdAt: now, updatedAt: now, lastSignedIn: now },
    req: { headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("AI procedure input validation", () => {
  it("rejects a too-short image prompt before reaching the generation service", async () => {
    const caller = aiRouter.createCaller(ownerContext());
    await expect(caller.images.generate({ prompt: "tiny" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects a too-short code request before reaching the LLM service", async () => {
    const caller = aiRouter.createCaller(ownerContext());
    await expect(caller.code.run({ mode: "generate", request: "x", code: "" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
