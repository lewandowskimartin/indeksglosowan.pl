import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ResultBar from "@/components/ResultBar";
import ClubBreakdown from "@/components/ClubBreakdown";
import { getVoting, getClubBreakdown, passed, votingTitle } from "@/lib/queries";
import { sejmDrukUrl, sejmVotingUrl } from "@/lib/site";

export const revalidate = 86400;

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const v = await getVoting(id);
  if (!v) return { title: "Głosowanie" };
  const t = votingTitle(v);
  return {
    title: t.slice(0, 110),
    description: `Wynik głosowania: za ${v.yes_votes ?? 0}, przeciw ${v.no_votes ?? 0}, wstrzymało się ${
      v.abstain_votes ?? 0
    }, nieobecnych ${v.not_participating ?? 0}. Zobacz, jak głosował każdy klub i każdy poseł.`,
  };
}

const fmtDateTime = (d: string | null) =>
  d
    ? new Date(d).toLocaleString("pl-PL", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

async function VotingDetail({ params }: { params: Params }) {
  const { id } = await params;
  const v = await getVoting(id);
  if (!v) notFound();

  const clubs = await getClubBreakdown(v.id);
  const ok = passed(v);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <span>{fmtDateTime(v.vote_date)}</span>
          <span>·</span>
          <span>
            Posiedzenie {v.sitting_number}, głosowanie {v.voting_number}
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-white leading-snug">
          {votingTitle(v)}
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wide ${
              ok
                ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
            }`}
          >
            {ok ? "Przyjęto" : "Odrzucono"}
          </span>
          {v.categories?.map((c) => (
            <span
              key={c}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
            >
              {c}
            </span>
          ))}
        </div>

        {v.summary && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-l-2 border-blue-500 pl-3">
            {v.summary}
          </p>
        )}
      </header>

      {/* ── Overall result ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <ResultBar
          yes={v.yes_votes ?? 0}
          no={v.no_votes ?? 0}
          abstain={v.abstain_votes ?? 0}
          absent={v.not_participating ?? 0}
          height="h-3"
        />
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { l: "Za", n: v.yes_votes ?? 0, c: "text-green-600 dark:text-green-400" },
            { l: "Przeciw", n: v.no_votes ?? 0, c: "text-red-600 dark:text-red-400" },
            { l: "Wstrzymało się", n: v.abstain_votes ?? 0, c: "text-amber-600 dark:text-amber-400" },
            { l: "Nieobecnych", n: v.not_participating ?? 0, c: "text-zinc-500" },
          ].map((s) => (
            <div
              key={s.l}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 py-3 px-1"
            >
              <div className={`text-2xl font-black ${s.c}`}>{s.n}</div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Club-by-club ───────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">
          Jak głosowały kluby — rozwiń, by zobaczyć posłów
        </h2>
        <ClubBreakdown votingId={v.id} rows={clubs} />
      </section>

      {/* ── Sources ────────────────────────────────────────────────────── */}
      <section className="space-y-2 text-xs">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Źródła</h2>
        <div className="flex flex-col gap-1.5">
          <a
            href={sejmVotingUrl(v.sitting_number, v.voting_number)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Zapis głosowania na sejm.gov.pl →
          </a>
          {v.druk_number && (
            <a
              href={sejmDrukUrl(v.druk_number)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Druk sejmowy nr {v.druk_number} →
            </a>
          )}
        </div>
        {v.description && v.description !== v.title && (
          <details className="pt-2">
            <summary className="cursor-pointer text-zinc-500 font-semibold">Pełny opis urzędowy</summary>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
              {v.description}
            </p>
          </details>
        )}
      </section>

      <Link href="/glosowania" className="inline-block text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300">
        ← Wszystkie głosowania
      </Link>
    </div>
  );
}

export default function VotingPage({ params }: { params: Params }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Suspense fallback={<div className="h-[600px] rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />}>
        <VotingDetail params={params} />
      </Suspense>
    </div>
  );
}
