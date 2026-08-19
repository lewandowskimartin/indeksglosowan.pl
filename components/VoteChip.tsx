import type { VoteValue } from "@/lib/queries";

const MAP: Record<string, { label: string; cls: string }> = {
  YES: { label: "Za", cls: "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300" },
  NO: { label: "Przeciw", cls: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300" },
  ABSTAIN: { label: "Wstrzymał się", cls: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300" },
  ABSENT: { label: "Nieobecny", cls: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
  VOTE_VALID: { label: "Głos ważny", cls: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
  SPLIT: { label: "Podzieleni", cls: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
};

export default function VoteChip({ vote, small }: { vote: VoteValue | string; small?: boolean }) {
  const m = MAP[vote] ?? MAP.ABSENT;
  return (
    <span
      className={`inline-flex items-center rounded-full font-bold ${m.cls} ${
        small ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      }`}
    >
      {m.label}
    </span>
  );
}
