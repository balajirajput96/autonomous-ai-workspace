import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Download, ImagePlus, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Images() {
  const utils = trpc.useUtils();
  const images = trpc.ai.images.list.useQuery();
  const [prompt, setPrompt] = useState("");
  const generate = trpc.ai.images.generate.useMutation({
    onSuccess: async () => {
      setPrompt("");
      await Promise.all([
        utils.ai.images.list.invalidate(),
        utils.workspace.summary.invalidate(),
      ]);
      toast.success("Image saved to your private gallery.");
    },
    onError: error => toast.error(error.message),
  });
  return (
    <div className="mx-auto max-w-7xl space-y-7 px-1 pb-10 pt-2 sm:px-4">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.17em] text-fuchsia-300">
          Image Studio
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          Create visual directions with AI.
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
          Generated images are copied into private storage and kept in your
          gallery.
        </p>
      </header>
      <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-2xl border border-white/10 bg-[#101226] p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-fuchsia-400/10 text-fuchsia-200">
              <ImagePlus className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">New image</h2>
              <p className="text-xs text-slate-500">
                Describe subject, style, lighting, and framing.
              </p>
            </div>
          </div>
          <Textarea
            value={prompt}
            onChange={event => setPrompt(event.target.value)}
            placeholder="A thoughtful prompt for your next image…"
            className="min-h-44 resize-none border-white/10 bg-white/5 text-white placeholder:text-slate-500"
          />
          <Button
            onClick={() => generate.mutate({ prompt })}
            disabled={prompt.trim().length < 5 || generate.isPending}
            className="mt-4 w-full bg-fuchsia-500 text-white hover:bg-fuchsia-400"
          >
            {generate.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Creating image…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 size-4" />
                Generate & save
              </>
            )}
          </Button>
        </div>
        <div className="relative min-h-60 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-fuchsia-500/10 via-[#101226] to-cyan-400/10 p-6">
          <div className="absolute -right-12 -top-12 size-48 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="relative max-w-md">
            <p className="text-sm font-semibold text-white">
              A tidy visual history
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Every successful generation is recorded with its original prompt,
              then displayed in an owner-only gallery for reuse and review.
            </p>
            <div className="mt-8 flex items-center gap-3 text-xs text-slate-400">
              <span className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/5">
                01
              </span>{" "}
              Write a focused prompt <span className="text-slate-600">→</span>
              <span className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/5">
                02
              </span>{" "}
              Generate & store
            </div>
          </div>
        </div>
      </section>
      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-white">Private gallery</h2>
          <span className="text-xs text-slate-500">
            {images.data?.length ?? 0} assets
          </span>
        </div>
        {images.isLoading ? (
          <div className="flex h-52 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-slate-500" />
          </div>
        ) : images.data?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.data.map(asset => (
              <article
                key={asset.id}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-[#101226]"
              >
                <img
                  src={asset.imageUrl}
                  alt={asset.prompt}
                  className="aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
                <div className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm leading-5 text-slate-200">
                      {asset.prompt}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {new Date(asset.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <a
                    href={asset.imageUrl}
                    download
                    className="rounded-lg border border-white/10 p-2 text-slate-400 hover:bg-white/5 hover:text-white"
                    aria-label="Download image"
                  >
                    <Download className="size-4" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 px-5 py-14 text-center">
            <ImagePlus className="mx-auto size-8 text-slate-600" />
            <p className="mt-3 text-sm text-slate-400">
              Your private gallery is ready for its first image.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
