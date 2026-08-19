/**
 * Single place for brand + URL config.
 * Change SITE_NAME / SITE_DOMAIN once the domain is picked.
 */
export const SITE_NAME = "Sejm Vote Explorer";
export const SITE_SHORT = "Explorer";
export const SITE_TAGLINE =
  "Sprawdź, jak naprawdę głosował Sejm — każde głosowanie, każdy klub, każdy poseł.";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

/** Official Sejm source links — every data point must be traceable. */
export const sejmDrukUrl = (druk: number) =>
  `https://www.sejm.gov.pl/Sejm10.nsf/druk.xsp?nr=${druk}`;

export const sejmVotingUrl = (sitting: number, votingNumber: number) =>
  `https://www.sejm.gov.pl/sejm10.nsf/agent.xsp?symbol=glosowania&nrkadencji=10&nrposiedzenia=${sitting}&nrglosowania=${votingNumber}`;

export const sejmMpUrl = (sejmId: number) =>
  `https://www.sejm.gov.pl/sejm10.nsf/posel.xsp?id=${String(sejmId).padStart(3, "0")}&type=A`;
