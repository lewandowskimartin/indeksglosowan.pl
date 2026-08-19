/**
 * Canned-query pages. Each one is a static, indexable URL — this is the
 * organic-search engine of the site. Add a new entry here + a matching
 * branch in get_ranking() to ship a new SEO page.
 */
export const RANKINGS = {
  "najczesciej-nieobecni": {
    title: "Najczęściej nieobecni posłowie",
    description: "Posłowie z najwyższym odsetkiem nieobecności w głosowaniach tej kadencji.",
    entity: "posel" as const,
  },
  "najlepsza-frekwencja": {
    title: "Najlepsza frekwencja w Sejmie",
    description: "Posłowie, którzy oddali głos w największym odsetku głosowań.",
    entity: "posel" as const,
  },
  "przeciw-wlasnemu-klubowi": {
    title: "Kto najczęściej głosuje przeciw własnemu klubowi",
    description: "Posłowie, którzy najczęściej łamią linię swojego klubu.",
    entity: "posel" as const,
  },
  "najblizsze-glosowania": {
    title: "Najbardziej wyrównane głosowania",
    description: "Głosowania rozstrzygnięte najmniejszą różnicą głosów.",
    entity: "glosowanie" as const,
  },
} as const;

export type RankingSlug = keyof typeof RANKINGS;
export const RANKING_SLUGS = Object.keys(RANKINGS) as RankingSlug[];
