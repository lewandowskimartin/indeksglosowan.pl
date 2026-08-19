import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { partyMeta } from "@/lib/party-colors";
import { listClubs } from "@/lib/queries";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Kluby poselskie — statystyki głosowań",
  description:
    "Frekwencja i spójność (dyscyplina) każdego klubu poselskiego w Sejmie RP, liczona na podstawie wszystkich głosowań kadencji.",
};

async function Clubs() {
  const clubs = await listClubs();
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-900 overflow-hidden">
      {clubs.map((c) => {
        const meta = partyMeta(c.club);
        return (
          <Link
            key={c.club}
            href={`/partia/${encodeURIComponent(c.club)}`}
            className="flex items-center gap-3 px-4 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors"
          >
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: meta.cssVar }} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{c.club}</p>
              <p className="text-[11px] text-zinc-400 truncate">{meta.name}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-black text-zinc-800 dark:text-zinc-200">{c.mp_count}</p>
              <p className="text-[10px] text-zinc-400">posłów</p>
            </div>
            <div className="text-right shrink-0 w-16">
              <p className="text-sm font-black text-blue-600 dark:text-blue-400">{c.cohesion_pct ?? "—"}%</p>
              <p className="text-[10px] text-zinc-400">spójność</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function ClubsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">Kluby poselskie</h1>
        <p className="text-xs text-zinc-500 max-w-prose">
          <strong>Spójność</strong> to średni odsetek posłów klubu głosujących zgodnie z większością własnego
          klubu — im wyżej, tym silniejsza dyscyplina.
        </p>
      </div>
      <Suspense fallback={<div className="h-96 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />}>
        <Clubs />
      </Suspense>
    </div>
  );
}
