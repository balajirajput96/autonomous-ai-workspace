import { cn } from "@/lib/utils";

export function StatusPill({
  status,
}: {
  status: "started" | "succeeded" | "failed" | "info" | "running";
}) {
  const styles = {
    started: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    running: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    succeeded: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    failed: "border-rose-400/20 bg-rose-400/10 text-rose-300",
    info: "border-sky-400/20 bg-sky-400/10 text-sky-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize",
        styles[status]
      )}
    >
      {status}
    </span>
  );
}
