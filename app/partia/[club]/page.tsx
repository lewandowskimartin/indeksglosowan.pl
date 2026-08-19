import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { partyMeta } from "@/lib/party-colors";
import { getClubStats, listPoliticians } from "@/lib/queries";

export const revalidate = 86400;

type Params = Promise<{ club: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { club } = await params;
  const name = decodeURIComponent(club);
  return {
    title: `${name} — jak głosuje klub`,
    description: `Statystyki głosowań klubu ${name} w Sejmie RP: frekwencja, spójność, lista posłów i pełna historia głosowań.`,
  };
}

async function ClubProfile({ params }: { params: Params }) {
  const { club } = await params;
  const name = decodeURIComponent(club);
  const [stats, mps] = await Promise.all([getClubStats(name), listPoliticians(name)]);
  if (!stats) notFound();

  const meta = partyMeta(name);

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-3">
        <span className="w-4 h-4 rounded-full shrink-0" style={{ background: meta.cssVar }} />
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">{name}</h1>
          <p className="text-xs text-zinc-500">{meta.name}</p>
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { l: "Posłów", n: stats.mp_count },
          { l: "Głosowań", n: stats.votings_count },
          { l: "Frekwencja", n: `${stats.attendance_pct}%` },
          { l: "Spójność", n: `${stats.cohesion_pct ?? "—"}%` },
        ].map((s) => (
          <div key={s.l} className="rounded-xl border border-zinc-200 dark:border-zinc-800 py-3 text-center">
            <div className="text-xl font-black text-zinc-900 dark:text-white">{s.n}</div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 mt-0.5">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { l: "Głosy za", n: stats.yes_count, c: "text-green-600 dark:text-green-400" },
          { l: "Głosy przeciw", n: stats.no_count, c: "text-red-600 dark:text-red-400" },
          { l: "Wstrzymane", n: stats.abstain_count, c: "text-amber-600 dark:text-amber-400" },
        ].map((s) => (
          <div key={s.l} className="rounded-xl border border-zinc-200 dark:border-zinc-800 py-3 text-center">
            <div className={`text-lg font-black ${s.c}`}>{Number(s.n).toLocaleString("pl")}</div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 mt-0.5">{s.l}</div>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Posłowie klubu</h2>
        <ul className="grid sm:grid-cols-2 gap-x-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-2">
          {mps.map((m) => (
            <li key={m.id}>
              <Link
                href={`/posel/${m.id}`}
                className="block px-2 py-2 rounded-lg text-sm text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors truncate"
              >
                {m.last_name} {m.first_name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-[11px] text-zinc-400 max-w-prose">
        Przynależność klubowa liczona jest z zapisu w momencie głosowania, więc posłowie, którzy zmienili klub w
        trakcie kadencji, są przypisani poprawnie do każdego głosowania.
      </p>
    </div>
  );
}

export default function ClubPage({ params }: { params: Params }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Suspense fallback={<div className="h-96 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />}>
        <ClubProfile params={params} />
      </Suspense>
    </div>
  );
}
