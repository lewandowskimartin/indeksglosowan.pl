import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";
import { RANKING_SLUGS } from "@/lib/rankings";

export const revalidate = 86400;

/** Sitemap covers the SEO surface: rankings, clubs, MPs and recent votings. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [{ data: votings }, { data: mps }] = await Promise.all([
    supabase.from("votings").select("id, vote_date").order("vote_date", { ascending: false }).limit(5000),
    supabase.from("politicians").select("id").limit(1000),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    "",
    "/glosowania",
    "/poslowie",
    "/partie",
    "/rankingi",
    "/o-serwisie",
    ...RANKING_SLUGS.map((s) => `/rankingi/${s}`),
  ].map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "daily", priority: p === "" ? 1 : 0.8 }));

  return [
    ...staticPages,
    ...(votings ?? []).map((v) => ({
      url: `${SITE_URL}/glosowanie/${v.id}`,
      lastModified: v.vote_date ? new Date(v.vote_date) : undefined,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    ...(mps ?? []).map((m) => ({
      url: `${SITE_URL}/posel/${m.id}`,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
