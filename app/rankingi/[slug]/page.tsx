import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getRanking } from "@/lib/queries";
import { RANKINGS, RANKING_SLUGS, type RankingSlug } from "@/lib/rankings";

export const revalidate = 86400;

export function generateStaticParams() {
  return RANKING_SLUGS.map((slug) => ({ slug }));
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const r = RANKINGS[slug as RankingSlug];
  if (!r) return { title: "Ranking" };
  return { title: r.title, description: r.description };
}

async function RankingTable({ params }: { params: Params }) {
  const { slug } = await params;
  const cfg = RANKINGS[slug as RankingSlug];
  if (!cfg) notFound();

  const rows = await getRanking(slug as RankingSlug, 50);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">{cfg.title}</h1>
        <p className="text-sm text-zinc-500">{cfg.description}</p>
      </header>

      <ol className="rounded-2xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-900 overflow-hidden">
        {rows.map((r) => (
          <li key={`${r.rank}-${r.entity_id}`}>
            <Link
              href={cfg.entity === "posel" ? `/posel/${r.entity_id}` : `/glosowanie/${r.entity_id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors"
            >
              <span className="w-7 text-xs font-black text-zinc-300 dark:text-zinc-600 shrink-0 tabular-nums">
                {r.rank}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{r.label}</p>
                {r.sublabel && <p className="text-[11px] text-zinc-400 truncate">{r.sublabel}</p>}
              </div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0 text-right">
                {r.value_label}
              </span>
            </Link>
          </li>
        ))}
      </ol>

      {rows.length === 0 && (
        <p className="text-sm text-zinc-500">Brak danych — uruchom synchronizację, żeby zbudować ranking.</p>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        {RANKING_SLUGS.filter((s) => s !== slug).map((s) => (
          <Link
            key={s}
            href={`/rankingi/${s}`}
            className="px-3 py-1.5 rounded-full text-[11px] font-semibold border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 transition-colors"
          >
            {RANKINGS[s].title}
          </Link>
        ))}
      </div>

      <p className="text-[11px] text-zinc-400 max-w-prose">
        Ranking obejmuje posłów z co najmniej 50 zarejestrowanymi głosowaniami, żeby uniknąć zniekształceń przy
        krótkim stażu. Dane pochodzą z oficjalnego API Sejmu RP.
      </p>
    </div>
  );
}

export default function RankingPage({ params }: { params: Params }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Suspense fallback={<div className="h-96 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />}>
        <RankingTable params={params} />
      </Suspense>
    </div>
  );
}
