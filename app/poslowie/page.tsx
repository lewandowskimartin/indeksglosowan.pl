import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { partyMeta } from "@/lib/party-colors";
import { listPoliticians } from "@/lib/queries";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Posłowie na Sejm — pełna lista",
  description:
    "Wszyscy posłowie obecnej kadencji Sejmu RP. Kliknij, by zobaczyć frekwencję, historię głosowań i głosy wbrew własnemu klubowi.",
};

async function MPList({ searchParams }: { searchParams: Promise<{ klub?: string }> }) {
  const { klub } = await searchParams;
  const mps = await listPoliticians(klub);

  const clubs = Array.from(new Set(mps.map((m) => m.club).filter(Boolean))) as string[];

  return (
    <div className="space-y-5">
      {!klub && clubs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {clubs.sort().map((c) => (
            <Link
              key={c}
              href={`/poslowie?klub=${encodeURIComponent(c)}`}
              className="px-2.5 py-1 rounded-full text-[11px] font-bold border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 transition-colors"
            >
              {c}
            </Link>
          ))}
        </div>
      )}
      {klub && (
        <Link href="/poslowie" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
          ← Wszystkie kluby
        </Link>
      )}

      <p className="text-xs text-zinc-500">{mps.length} posłów</p>

      <ul className="grid sm:grid-cols-2 gap-x-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-2">
        {mps.map((m) => {
          const meta = partyMeta(m.club);
          return (
            <li key={m.id}>
              <Link
                href={`/posel/${m.id}`}
                className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.cssVar }} />
                <span className="text-sm text-zinc-800 dark:text-zinc-200 truncate">
                  {m.last_name} {m.first_name}
                </span>
                <span className="ml-auto text-[10px] text-zinc-400 shrink-0">{m.club}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function MPsPage({ searchParams }: { searchParams: Promise<{ klub?: string }> }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">Posłowie</h1>
      <Suspense fallback={<div className="h-96 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />}>
        <MPList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
