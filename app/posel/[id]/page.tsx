import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import VoteChip from "@/components/VoteChip";
import { partyMeta } from "@/lib/party-colors";
import { getPolitician, getPoliticianStats, getPoliticianVotes } from "@/lib/queries";
import { sejmMpUrl } from "@/lib/site";

export const revalidate = 86400;

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const p = await getPolitician(id);
  if (!p) return { title: "Poseł" };
  const name = `${p.first_name} ${p.last_name}`;
  return {
    title: `${name} — jak głosował w Sejmie`,
    description: `Pełna historia głosowań posła ${name} (${p.club ?? "brak klubu"}): frekwencja, głosy za i przeciw, głosowania wbrew własnemu klubowi.`,
  };
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" });

async function Profile({ params }: { params: Params }) {
  const { id } = await params;
  const p = await getPolitician(id);
  if (!p) notFound();

  const [stats, history] = await Promise.all([getPoliticianStats(id), getPoliticianVotes(id, 60)]);
  const meta = partyMeta(p.club);
  const name = `${p.first_name} ${p.last_name}`;

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-black shrink-0"
          style={{ background: meta.cssVar, color: "var(--party-on-color)" }}
        >
          {p.first_name[0]}
          {p.last_name[0]}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white truncate">{name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Link
              href={`/partia/${encodeURIComponent(p.club ?? "")}`}
              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
              style={{ background: meta.cssVar, color: "var(--party-on-color)" }}
            >
              {p.club ?? "brak klubu"}
            </Link>
            {!p.active && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                Nieaktywny
              </span>
            )}
          </div>
        </div>
      </header>

      {stats && (
        <section className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { l: "Za", n: stats.yes_count, c: "text-green-600 dark:text-green-400" },
              { l: "Przeciw", n: stats.no_count, c: "text-red-600 dark:text-red-400" },
              { l: "Wstrzymał się", n: stats.abstain_count, c: "text-amber-600 dark:text-amber-400" },
              { l: "Nieobecny", n: stats.absent_count, c: "text-zinc-500" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl border border-zinc-200 dark:border-zinc-800 py-3 text-center">
                <div className={`text-xl font-black ${s.c}`}>{Number(s.n).toLocaleString("pl")}</div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-2">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500 font-semibold">Frekwencja</span>
                <span className="font-black text-zinc-800 dark:text-zinc-200">{stats.attendance_pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${stats.attendance_pct}%` }} />
              </div>
              <p className="text-[10px] text-zinc-400">
                Udział w {Number(stats.total_count).toLocaleString("pl")} głosowaniach tej kadencji.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
              <div className="text-xs text-zinc-500 font-semibold">Głosy wbrew własnemu klubowi</div>
              <div className="text-2xl font-black text-zinc-900 dark:text-white mt-1">
                {Number(stats.rebellion_count).toLocaleString("pl")}
              </div>
              <p className="text-[10px] text-zinc-400 mt-1">
                Liczba głosowań, w których poseł zagłosował inaczej niż większość jego klubu.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Ostatnie głosowania</h2>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-900 overflow-hidden">
          {history.map((h) => (
            <Link
              key={h.voting_id}
              href={`/glosowanie/${h.voting_id}`}
              className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 line-clamp-2 leading-snug">
                  {h.display_title?.trim() || h.title}
                </p>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-zinc-400">
                  <span>{fmtDate(h.vote_date)}</span>
                  {h.against_club && (
                    <span className="font-bold text-amber-600 dark:text-amber-400">wbrew klubowi</span>
                  )}
                </div>
              </div>
              <VoteChip vote={h.vote} small />
            </Link>
          ))}
        </div>
      </section>

      <section className="text-xs">
        <a
          href={sejmMpUrl(p.sejm_id)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Oficjalny profil na sejm.gov.pl →
        </a>
      </section>
    </div>
  );
}

export default function PoliticianPage({ params }: { params: Params }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Suspense fallback={<div className="h-[600px] rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />}>
        <Profile params={params} />
      </Suspense>
    </div>
  );
}
