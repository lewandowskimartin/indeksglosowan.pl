import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import SearchForm from "@/components/SearchForm";
import VotingListItem from "@/components/VotingListItem";
import { searchVotings } from "@/lib/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Głosowania w Sejmie — wyszukiwarka",
  description:
    "Przeszukaj wszystkie głosowania Sejmu RP: po temacie, numerze druku, dacie i wyniku. Zobacz, jak głosował każdy klub i każdy poseł.",
};

type SP = Promise<Record<string, string | undefined>>;

async function Results({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const page = parseInt(sp.page ?? "1", 10) || 1;

  const { rows, total, pageCount } = await searchVotings({
    q: sp.q,
    druk: sp.druk,
    from: sp.from,
    to: sp.to,
    result: (sp.result as "passed" | "rejected" | undefined) ?? "",
    category: sp.category,
    page,
  });

  const qs = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (v && k !== "page") params.set(k, v);
    params.set("page", String(p));
    return `/glosowania?${params}`;
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 py-16 text-center">
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Brak wyników</p>
        <p className="mt-1 text-xs text-zinc-500">Spróbuj krótszej frazy albo wyczyść filtry.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500">
        Znaleziono <strong className="text-zinc-800 dark:text-zinc-200">{total}</strong> głosowań
      </p>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-900 overflow-hidden">
        {rows.map((v) => (
          <VotingListItem key={v.id} v={v} />
        ))}
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between text-xs">
          {page > 1 ? (
            <Link href={qs(page - 1)} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              ← Poprzednia
            </Link>
          ) : (
            <span />
          )}
          <span className="text-zinc-500">
            Strona {page} z {pageCount}
          </span>
          {page < pageCount ? (
            <Link href={qs(page + 1)} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              Następna →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}

export default function VotingsPage({ searchParams }: { searchParams: SP }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">Głosowania</h1>
      <Suspense fallback={<div className="h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />}>
        <SearchForm compact />
      </Suspense>
      <Suspense fallback={<div className="h-96 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
