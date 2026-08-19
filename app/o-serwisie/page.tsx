import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "O serwisie",
  description: "Skąd pochodzą dane, jak liczymy statystyki i jak zgłosić błąd.",
};

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
      <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">O serwisie</h1>

      <p>
        {SITE_NAME} to niezależna wyszukiwarka głosowań Sejmu RP. Nie oceniamy, nie komentujemy — pokazujemy
        zapis: kto, kiedy i jak zagłosował.
      </p>

      <h2 className="text-base font-bold text-zinc-900 dark:text-white pt-2">Skąd dane</h2>
      <p>
        Wszystkie dane pobieramy z oficjalnego API Kancelarii Sejmu (api.sejm.gov.pl) i odświeżamy codziennie.
        Każde głosowanie ma odnośnik do zapisu urzędowego oraz do druku sejmowego, jeśli jest dostępny.
      </p>

      <h2 className="text-base font-bold text-zinc-900 dark:text-white pt-2">Jak liczymy statystyki</h2>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>
          <strong>Frekwencja</strong> — odsetek głosowań, w których poseł oddał głos (za, przeciw lub
          wstrzymał się) spośród wszystkich, w których był uprawniony.
        </li>
        <li>
          <strong>Spójność klubu</strong> — średni odsetek posłów klubu głosujących zgodnie z większością
          własnego klubu, liczony osobno dla każdego głosowania.
        </li>
        <li>
          <strong>Głosy wbrew klubowi</strong> — głosowania, w których poseł zagłosował inaczej niż większość
          jego klubu. Głosowania, w których klub był podzielony, nie są liczone.
        </li>
        <li>
          <strong>Przynależność klubowa</strong> zapisywana jest w momencie głosowania, więc zmiany klubu w
          trakcie kadencji nie zniekształcają historii.
        </li>
      </ul>

      <h2 className="text-base font-bold text-zinc-900 dark:text-white pt-2">Prywatność</h2>
      <p>
        Serwis nie wymaga logowania i nie zbiera danych osobowych odwiedzających. Publikujemy wyłącznie jawne
        akty urzędowe posłów.
      </p>

      <h2 className="text-base font-bold text-zinc-900 dark:text-white pt-2">Błędy</h2>
      <p>
        Dokładamy starań, by dane były wierne źródłu. W razie rozbieżności rozstrzyga zapis na sejm.gov.pl.
        Zauważony błąd prosimy zgłosić — poprawimy i opiszemy zmianę.
      </p>
    </div>
  );
}
