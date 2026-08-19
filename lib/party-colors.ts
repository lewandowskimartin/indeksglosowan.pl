/**
 * Party colour map — CSS custom-property approach for WCAG AAA compliance.
 *
 * Actual colour values live in globals.css under :root (light) and .dark (dark).
 * This module returns `var(--party-xxx)` strings so the browser resolves the
 * correct shade automatically — no JS theme detection needed, no hydration flash.
 *
 * Keys are exact Sejm API club IDs from api.sejm.gov.pl/sejm/term10/clubs
 */

export interface PartyMeta {
  name: string;
  cssVar: string;       // e.g. 'var(--party-ko)'
}

const PARTY_META: Record<string, PartyMeta> = {
  KO:              { name: 'Koalicja Obywatelska',         cssVar: 'var(--party-ko)' },
  PiS:             { name: 'Prawo i Sprawiedliwość',       cssVar: 'var(--party-pis)' },
  'PSL-TD':        { name: 'PSL – Trzecia Droga',          cssVar: 'var(--party-psl-td)' },
  Polska2050:      { name: 'Polska 2050',                  cssVar: 'var(--party-polska2050)' },
  Centrum:         { name: 'Centrum',                      cssVar: 'var(--party-centrum)' },
  Lewica:          { name: 'Lewica',                       cssVar: 'var(--party-lewica)' },
  Razem:           { name: 'Razem',                        cssVar: 'var(--party-razem)' },
  Konfederacja:    { name: 'Konfederacja WiN',             cssVar: 'var(--party-konfederacja)' },
  Konfederacja_KP: { name: 'Konfederacja Korony Polskiej', cssVar: 'var(--party-konfederacja-kp)' },
  Demokracja:      { name: 'Demokracja Bezpośrednia',      cssVar: 'var(--party-demokracja)' },
  'niez.':         { name: 'Niezrzeszeni',                 cssVar: 'var(--party-niez)' },

  // Legacy / alternative spellings
  PO:     { name: 'Platforma Obywatelska',          cssVar: 'var(--party-ko)' },
  ZP:     { name: 'Zjednoczona Prawica',            cssVar: 'var(--party-pis)' },
  TD:     { name: 'Trzecia Droga',                  cssVar: 'var(--party-psl-td)' },
  PSL:    { name: 'Polskie Stronnictwo Ludowe',     cssVar: 'var(--party-psl-td)' },
  PL2050: { name: 'Polska 2050',                    cssVar: 'var(--party-polska2050)' },
  SLD:    { name: 'Sojusz Lewicy Demokratycznej',   cssVar: 'var(--party-lewica)' },
  MN:     { name: 'Mniejszość Niemiecka',           cssVar: 'var(--party-polska2050)' },
};

const FALLBACK: PartyMeta = { name: 'Nieznana partia', cssVar: 'var(--party-fallback)' };

/** Returns party metadata. */
export function partyMeta(club: string | null | undefined): PartyMeta {
  return (club ? PARTY_META[club] : undefined) ?? FALLBACK;
}

/**
 * Returns the CSS variable string for the party colour.
 * The browser resolves the correct light/dark shade via CSS custom properties,
 * so no theme detection is needed here.
 */
export function partyColor(club: string | null | undefined): string {
  return partyMeta(club).cssVar;
}

/** Returns the CSS variable for text rendered ON a party-colour background. */
export function partyOnColor(): string {
  return 'var(--party-on-color)';
}
