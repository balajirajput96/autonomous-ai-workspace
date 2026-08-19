import type { Express, Request, Response } from "express";
import * as db from "./db";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";

type StreamPayload = { conversationId?: number; content?: string };

function messageText(content: unknown) {
  return typeof content === "string" ? content : "";
}

export function registerChatStreamRoute(app: Express) {
  app.post("/api/chat/stream", async (req: Request, res: Response) => {
    const body = req.body as StreamPayload;
    try {
      const user = await sdk.authenticateRequest(req);
      if (user.openId !== ENV.ownerOpenId)
        return res.status(403).json({ error: "owner-only" });
      const conversationId = Number(body.conversationId);
      const content = body.content?.trim();
      if (!Number.isInteger(conversationId) || !content)
        return res
          .status(400)
          .json({ error: "conversationId and content are required" });
      const conversation = await db.getConversation(
        user.openId,
        conversationId
      );
      if (!conversation)
        return res.status(404).json({ error: "Conversation not found" });

      await db.addChatMessage(conversationId, "user", content);
      await db.addActivity(
        user.openId,
        "chat",
        `Sent a message in “${conversation.title}”`,
        "started"
      );
      const history = await db.getConversationMessages(
        user.openId,
        conversationId
      );
      const apiBase =
        ENV.forgeApiUrl?.replace(/\/$/, "") || "https://forge.manus.im";
      const upstream = await fetch(`${apiBase}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${ENV.forgeApiKey}`,
        },
        body: JSON.stringify({
          stream: true,
          messages: [
            {
              role: "system",
              content:
                "You are the private AI Workspace assistant. Give accurate, practical answers in Markdown.",
            },
            ...history.map(item => ({
              role: item.role,
              content: item.content,
            })),
          ],
        }),
      });
      if (!upstream.ok || !upstream.body)
        throw new Error(`Chat upstream failed (${upstream.status})`);

      res.status(200).set({
        "content-type": "text/event-stream",
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
      });
      res.flushHeaders();
      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let complete = "";
      let closed = false;
      res.on("close", () => {
        closed = true;
      });

      while (!closed) {
        const part = await reader.read();
        if (part.done) break;
        buffer += decoder.decode(part.value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const event of events) {
          const line = event
            .split("\n")
            .find(value => value.startsWith("data: "));
          const value = line?.slice(6);
          if (!value || value === "[DONE]") continue;
          try {
            const parsed = JSON.parse(value) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const delta = parsed.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              complete += delta;
              res.write(`data: ${JSON.stringify({ delta })}\n\n`);
            }
          } catch {
            // Ignore non-content SSE frames such as keepalives.
          }
        }
      }
      if (closed) {
        await reader.cancel();
        return;
      }
      await db.addChatMessage(
        conversationId,
        "assistant",
        complete || "I could not produce a response."
      );
      await db.addActivity(
        user.openId,
        "chat",
        `Completed a response in “${conversation.title}”`,
        "succeeded"
      );
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Chat request failed";
      if (!res.headersSent) return res.status(500).json({ error: message });
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      res.end();
    }
  });
}
