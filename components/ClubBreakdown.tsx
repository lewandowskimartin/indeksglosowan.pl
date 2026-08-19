import Link from "next/link";
import ResultBar from "@/components/ResultBar";
import VoteChip from "@/components/VoteChip";
import { partyMeta } from "@/lib/party-colors";
import { getVotingMPVotes, type ClubBreakdownRow } from "@/lib/queries";

/**
 * Sejm360 — how every club voted on one bill, expandable to individual MPs.
 * Uses native <details> so it works with zero client JS.
 */
export default async function ClubBreakdown({
  votingId,
  rows,
}: {
  votingId: string;
  rows: ClubBreakdownRow[];
}) {
  const allVotes = await getVotingMPVotes(votingId);
  const byClub = new Map<string, typeof allVotes>();
  for (const v of allVotes) {
    const key = v.club ?? "—";
    if (!byClub.has(key)) byClub.set(key, []);
    byClub.get(key)!.push(v);
  }

  return (
    <div className="divide-y divide-zinc-100 dark:divide-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {rows.map((r) => {
        const meta = partyMeta(r.club);
        const mps = byClub.get(r.club) ?? [];
        return (
          <details key={r.club} className="group">
            <summary className="list-none cursor-pointer px-4 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: meta.cssVar }}
                />
                <Link
                  href={`/partia/${encodeURIComponent(r.club)}`}
                  className="text-sm font-bold text-zinc-900 dark:text-zinc-100 hover:underline"
                >
                  {r.club}
                </Link>
                <span className="text-[11px] text-zinc-400">{meta.name}</span>
                <span className="ml-auto flex items-center gap-2">
                  <VoteChip vote={r.majority_vote} small />
                  <span className="text-xs text-zinc-400 group-open:rotate-180 transition-transform">▾</span>
                </span>
              </div>
              <ResultBar
                yes={r.club_yes}
                no={r.club_no}
                abstain={r.club_abstain}
                absent={r.club_absent}
                height="h-1.5"
              />
              <div className="mt-1.5 text-[11px] text-zinc-500">
                Za {r.club_yes} · Przeciw {r.club_no} · Wstrz. {r.club_abstain} · Nieob. {r.club_absent} ·{" "}
                {r.club_total} posłów
              </div>
            </summary>

            <div className="px-4 pb-4 pt-1 bg-zinc-50/60 dark:bg-zinc-900/40">
              <ul className="grid sm:grid-cols-2 gap-x-4">
                {mps.map((mp) => (
                  <li
                    key={mp.politician_id}
                    className="flex items-center justify-between gap-2 py-1.5 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0"
                  >
                    <Link
                      href={`/posel/${mp.politician_id}`}
                      className="text-xs text-zinc-700 dark:text-zinc-300 hover:underline truncate"
                    >
                      {mp.first_name} {mp.last_name}
                    </Link>
                    <VoteChip vote={mp.vote} small />
                  </li>
                ))}
              </ul>
            </div>
          </details>
        );
      })}
    </div>
  );
}
