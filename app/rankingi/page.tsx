import Link from "next/link";
import type { Metadata } from "next";
import { RANKINGS } from "@/lib/rankings";

export const metadata: Metadata = {
  title: "Rankingi posłów i głosowań",
  description:
    "Gotowe zestawienia z danych Sejmu RP: frekwencja posłów, głosy wbrew własnemu klubowi, najbardziej wyrównane głosowania kadencji.",
};

export default function RankingsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">Rankingi</h1>
      <div className="grid sm:grid-cols-2 gap-2">
        {Object.entries(RANKINGS).map(([slug, r]) => (
          <Link
            key={slug}
            href={`/rankingi/${slug}`}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 hover:border-blue-500 transition-colors"
          >
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{r.title}</p>
            <p className="text-xs text-zinc-500 mt-1">{r.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
