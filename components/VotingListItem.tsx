import Link from "next/link";
import ResultBar from "@/components/ResultBar";
import { passed, votingTitle, type VotingRow } from "@/lib/queries";

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("pl-PL", { day: "2-digit", month: "short", year: "numeric" }) : "";

export default function VotingListItem({ v }: { v: VotingRow }) {
  const ok = passed(v);
  return (
    <Link
      href={`/glosowanie/${v.id}`}
      className="block px-4 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2">
          {votingTitle(v)}
        </h3>
        <span
          className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
            ok
              ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"
              : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
          }`}
        >
          {ok ? "Przyjęto" : "Odrzucono"}
        </span>
      </div>

      <ResultBar
        yes={v.yes_votes ?? 0}
        no={v.no_votes ?? 0}
        abstain={v.abstain_votes ?? 0}
        absent={v.not_participating ?? 0}
      />

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-500">
        <span>{fmtDate(v.vote_date)}</span>
        <span className="text-green-600 dark:text-green-500 font-semibold">Za {v.yes_votes ?? 0}</span>
        <span className="text-red-600 dark:text-red-500 font-semibold">Przeciw {v.no_votes ?? 0}</span>
        <span>Wstrz. {v.abstain_votes ?? 0}</span>
        <span>Nieob. {v.not_participating ?? 0}</span>
        {v.druk_number && <span>Druk nr {v.druk_number}</span>}
      </div>
    </Link>
  );
}
