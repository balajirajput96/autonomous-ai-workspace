import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  ArrowUpRight,
  Bot,
  Braces,
  Image,
  Play,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Link } from "wouter";

const cards = [
  {
    title: "AI Chat",
    description: "Persistent conversations with streamed Markdown answers.",
    icon: Bot,
    href: "/chat",
    color: "from-violet-400/25 to-indigo-500/5",
  },
  {
    title: "Image Studio",
    description:
      "Turn prompts into images and keep every result in your private gallery.",
    icon: Image,
    href: "/images",
    color: "from-fuchsia-400/20 to-rose-500/5",
  },
  {
    title: "Code Assistant",
    description: "Generate, explain, and debug code with readable output.",
    icon: Braces,
    href: "/code",
    color: "from-cyan-400/20 to-blue-500/5",
  },
  {
    title: "Automations",
    description: "Build recurring AI workflows that notify you after each run.",
    icon: Workflow,
    href: "/workflows",
    color: "from-emerald-400/20 to-teal-500/5",
  },
];

export default function Home() {
  const { data: summary, isLoading } = trpc.workspace.summary.useQuery();
  const metrics = [
    { label: "Conversations", value: summary?.conversations ?? 0, icon: Bot },
    { label: "Image assets", value: summary?.images ?? 0, icon: Image },
    {
      label: "Live workflows",
      value: summary?.activeWorkflows ?? 0,
      icon: Play,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-1 pb-10 pt-2 sm:px-4">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#101226] px-6 py-8 shadow-2xl shadow-black/20 sm:px-9 sm:py-10">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs font-medium text-violet-200">
            <Sparkles className="size-3.5" /> Private AI command center
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
            Build, create, and automate from one focused workspace.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
            Your conversations, creative work, code help, and recurring
            workflows stay organized behind owner-only access.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/chat">
              <Button className="bg-violet-500 text-white shadow-lg shadow-violet-950/40 hover:bg-violet-400">
                Open AI Chat <ArrowUpRight className="ml-2 size-4" />
              </Button>
            </Link>
            <Link href="/workflows">
              <Button
                variant="outline"
                className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                Manage workflows
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {metrics.map(metric => (
          <div
            key={metric.label}
            className="rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-4 transition-transform duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{metric.label}</span>
              <metric.icon className="size-4 text-violet-300" />
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
              {isLoading ? "—" : metric.value}
            </p>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">
              Workspace modules
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Choose a focused tool for your next task.
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {cards.map(card => (
            <Link key={card.title} href={card.href} className="group">
              <article className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-[#111328] p-5 transition duration-200 hover:-translate-y-1 hover:border-white/20 hover:bg-[#171a34]">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-70`}
                />
                <div className="relative">
                  <div className="mb-5 flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                    <card.icon className="size-5 text-white" />
                  </div>
                  <h2 className="text-base font-semibold text-white">
                    {card.title}
                  </h2>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-300">
                    {card.description}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-violet-200">
                    Open module{" "}
                    <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#101226] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-cyan-300" />
            <h2 className="text-sm font-semibold text-white">
              Recent activity
            </h2>
          </div>
          <Link
            href="/activity"
            className="text-xs font-medium text-violet-300 hover:text-violet-200"
          >
            View all
          </Link>
        </div>
        {summary?.latestActivity?.length ? (
          <div className="divide-y divide-white/5">
            {summary.latestActivity.map(event => (
              <div
                key={event.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-200">
                    {event.detail}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(event.createdAt).toLocaleString()}
                  </p>
                </div>
                <StatusPill status={event.status} />
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-white/10 px-4 py-5 text-sm text-slate-400">
            Activity will appear here as you use workspace tools.
          </p>
        )}
      </section>
    </div>
  );
}
