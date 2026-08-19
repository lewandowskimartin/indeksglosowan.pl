import { Suspense } from "react";
import Link from "next/link";
import SearchForm from "@/components/SearchForm";
import VotingListItem from "@/components/VotingListItem";
import { getRecentVotings } from "@/lib/queries";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const revalidate = 3600;

const SHORTCUTS = [
  { href: "/rankingi/najczesciej-nieobecni", label: "Najczęściej nieobecni posłowie" },
  { href: "/rankingi/przeciw-wlasnemu-klubowi", label: "Kto najczęściej głosuje przeciw klubowi" },
  { href: "/rankingi/najblizsze-glosowania", label: "Najbardziej wyrównane głosowania" },
  { href: "/rankingi/najlepsza-frekwencja", label: "Najlepsza frekwencja w Sejmie" },
];

async function Recent() {
  const votings = await getRecentVotings(8);
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-900 overflow-hidden">
      {votings.map((v) => (
        <VotingListItem key={v.id} v={v} />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">
      <section className="space-y-4 text-center">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
          Jak głosował Sejm?
        </h1>
        <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
          {SITE_TAGLINE}
        </p>
        <div className="pt-2 text-left">
          <Suspense fallback={<div className="h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />}>
            <SearchForm />
          </Suspense>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Popularne zestawienia</h2>
        <div className="grid sm:grid-cols-2 gap-2">
          {SHORTCUTS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {s.label} →
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Ostatnie głosowania</h2>
          <Link href="/glosowania" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            Wszystkie →
          </Link>
        </div>
        <Suspense
          fallback={<div className="h-96 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />}
        >
          <Recent />
        </Suspense>
      </section>

      <p className="text-[11px] text-zinc-400 text-center">
        {SITE_NAME} korzysta wyłącznie z oficjalnych danych Sejmu RP.
      </p>
    </div>
  );
}
