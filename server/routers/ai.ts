import { z } from "zod";
import * as db from "../db";
import { ownerProcedure } from "../owner";
import { router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { generateImage } from "../_core/imageGeneration";
import { storagePut } from "../storage";

function outputText(content: string | Array<{ type: "text"; text: string } | unknown>) {
  if (typeof content === "string") return content;
  return content.filter((item): item is { type: "text"; text: string } => Boolean(item && typeof item === "object" && "type" in item && (item as { type?: string }).type === "text" && "text" in item)).map(item => item.text).join("\n");
}

export const aiRouter = router({
  chat: router({
    conversations: ownerProcedure.query(({ ctx }) => db.listConversations(ctx.user.openId)),
    createConversation: ownerProcedure.input(z.object({ title: z.string().min(1).max(160) })).mutation(({ ctx, input }) => db.createConversation(ctx.user.openId, input.title)),
    messages: ownerProcedure.input(z.object({ conversationId: z.number().int().positive() })).query(({ ctx, input }) => db.getConversationMessages(ctx.user.openId, input.conversationId)),
  }),
  images: router({
    list: ownerProcedure.query(({ ctx }) => db.listImages(ctx.user.openId)),
    generate: ownerProcedure.input(z.object({ prompt: z.string().min(5).max(1600) })).mutation(async ({ ctx, input }) => {
      await db.addActivity(ctx.user.openId, "image", "Started image generation", "started");
      try {
        const generated = await generateImage({ prompt: input.prompt });
        if (!generated.url) throw new Error("Image service did not return a usable image URL");
        const source = await fetch(generated.url);
        if (!source.ok) throw new Error("Generated image could not be saved to private storage");
        const mimeType = source.headers.get("content-type") || "image/png";
        const extension = mimeType.includes("jpeg") ? "jpg" : mimeType.includes("webp") ? "webp" : "png";
        const stored = await storagePut(`private-images/${ctx.user.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`, Buffer.from(await source.arrayBuffer()), mimeType);
        const image = await db.addImageGeneration({ ownerOpenId: ctx.user.openId, prompt: input.prompt, imageKey: stored.key, imageUrl: stored.url });
        await db.addActivity(ctx.user.openId, "image", "Completed image generation", "succeeded");
        return image;
      } catch (error) {
        await db.addActivity(ctx.user.openId, "image", "Image generation failed", "failed");
        throw error;
      }
    }),
  }),
  code: router({
    run: ownerProcedure.input(z.object({
      mode: z.enum(["generate", "explain", "debug"]),
      code: z.string().max(20000),
      request: z.string().min(3).max(3000),
    })).mutation(async ({ ctx, input }) => {
      await db.addActivity(ctx.user.openId, "code", `Started code ${input.mode}`, "started");
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a senior software engineer. Return clear Markdown. Include fenced, correctly labelled code blocks where useful. Do not claim to have run code unless output proves it." },
            { role: "user", content: `Task: ${input.mode}\nRequest: ${input.request}\n\nCode context:\n\`\`\`\n${input.code || "(none)"}\n\`\`\`` },
          ],
          maxTokens: 1800,
        });
        const output = outputText(response.choices[0]?.message.content ?? "");
        await db.addActivity(ctx.user.openId, "code", `Completed code ${input.mode}`, "succeeded");
        return { output };
      } catch (error) {
        await db.addActivity(ctx.user.openId, "code", `Code ${input.mode} failed`, "failed");
        throw error;
      }
    }),
  }),
});
