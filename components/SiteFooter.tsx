import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export default function SiteFooter() {
  return (
    <footer className="border-t border-zinc-100 dark:border-zinc-900 mt-16">
      <div className="max-w-5xl mx-auto px-4 py-8 text-xs text-zinc-500 dark:text-zinc-500 space-y-3">
        <p>
          Dane pochodzą z oficjalnego API Sejmu RP (
          <a
            href="https://api.sejm.gov.pl"
            className="underline hover:text-zinc-800 dark:hover:text-zinc-300"
            rel="noopener noreferrer"
            target="_blank"
          >
            api.sejm.gov.pl
          </a>
          ) i są aktualizowane codziennie. Każde głosowanie zawiera odnośnik do źródła.
        </p>
        <p>
          {SITE_NAME} jest niezależnym serwisem obywatelskim. Nie jest powiązany z Kancelarią Sejmu
          ani żadną partią polityczną. Dokładamy starań, by dane były wierne — w razie rozbieżności
          rozstrzyga zapis urzędowy.
        </p>
        <div className="flex gap-4 pt-1">
          <Link href="/o-serwisie" className="underline hover:text-zinc-800 dark:hover:text-zinc-300">
            O serwisie
          </Link>
          <Link href="/glosowania" className="underline hover:text-zinc-800 dark:hover:text-zinc-300">
            Szukaj głosowań
          </Link>
        </div>
      </div>
    </footer>
  );
}
