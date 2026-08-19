import { StatusPill } from "@/components/StatusPill";
import { trpc } from "@/lib/trpc";
import {
  Activity as ActivityIcon,
  Bot,
  Image,
  Loader2,
  Workflow,
} from "lucide-react";

const iconFor = (type: string) =>
  type === "image" ? Image : type === "workflow" ? Workflow : Bot;
export default function Activity() {
  const activity = trpc.workspace.activity.useQuery();
  return (
    <div className="mx-auto max-w-5xl space-y-7 px-1 pb-10 pt-2 sm:px-4">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.17em] text-sky-300">
          Activity Log
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          A clear history of workspace work.
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Every AI action and scheduled automation run is recorded here with its
          outcome.
        </p>
      </header>
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#101226]">
        {activity.isLoading ? (
          <div className="flex h-60 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-slate-500" />
          </div>
        ) : activity.data?.length ? (
          <div className="divide-y divide-white/5">
            {activity.data.map(event => {
              const Icon = iconFor(event.type);
              return (
                <article
                  key={event.id}
                  className="flex gap-4 px-5 py-4 transition hover:bg-white/[0.025]"
                >
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/5">
                    <Icon className="size-4 text-sky-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-slate-200">{event.detail}</p>
                      <StatusPill status={event.status} />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">
                      {event.type} ·{" "}
                      {new Date(event.createdAt).toLocaleString()}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex h-60 flex-col items-center justify-center text-center">
            <ActivityIcon className="size-8 text-slate-600" />
            <p className="mt-3 text-sm text-slate-400">
              No activity recorded yet.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
