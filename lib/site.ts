/**
 * Single place for brand + URL config.
 * The header renders SITE_NAME as [first word][rest], so keep it two words.
 */
export const SITE_NAME = "Indeks Głosowań";
export const SITE_SHORT = "Indeks";
export const SITE_TAGLINE =
  "Sprawdź, jak naprawdę głosował Sejm — każde głosowanie, każdy klub, każdy poseł.";

export const SITE_DOMAIN = "indeksglosowan.pl";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `https://${SITE_DOMAIN}`);

/** Official Sejm source links — every data point must be traceable. */
export const sejmDrukUrl = (druk: number) =>
  `https://www.sejm.gov.pl/Sejm10.nsf/druk.xsp?nr=${druk}`;

export const sejmVotingUrl = (sitting: number, votingNumber: number) =>
  `https://www.sejm.gov.pl/sejm10.nsf/agent.xsp?symbol=glosowania&nrkadencji=10&nrposiedzenia=${sitting}&nrglosowania=${votingNumber}`;

export const sejmMpUrl = (sejmId: number) =>
  `https://www.sejm.gov.pl/sejm10.nsf/posel.xsp?id=${String(sejmId).padStart(3, "0")}&type=A`;
