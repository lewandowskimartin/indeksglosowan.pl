import { createClient } from "@/lib/supabase/server";

/* ────────────────────────────────────────────────────────────────────────────
   Shared read-only query layer for the Explorer.
   Every function here is safe to call from a server component.
   No user data, no auth — pure public Sejm records.
   ──────────────────────────────────────────────────────────────────────────── */

export type VoteValue = "YES" | "NO" | "ABSTAIN" | "ABSENT" | "VOTE_VALID";

export interface VotingRow {
  id: string;
  term: number;
  sitting_number: number;
  voting_number: number;
  title: string;
  display_title: string | null;
  topic: string | null;
  description: string | null;
  summary: string | null;
  vote_date: string | null;
  kind: string | null;
  yes_votes: number | null;
  no_votes: number | null;
  abstain_votes: number | null;
  not_participating: number | null;
  total_voted: number | null;
  druk_number: number | null;
  categories: string[] | null;
  tags: string[] | null;
}

export interface ClubBreakdownRow {
  club: string;
  club_yes: number;
  club_no: number;
  club_abstain: number;
  club_absent: number;
  club_total: number;
  majority_vote: "YES" | "NO" | "ABSTAIN" | "SPLIT";
}

export interface PoliticianRow {
  id: string;
  sejm_id: number;
  first_name: string;
  last_name: string;
  club: string | null;
  active: boolean;
}

const VOTING_FIELDS =
  "id, term, sitting_number, voting_number, title, display_title, topic, description, summary, vote_date, kind, yes_votes, no_votes, abstain_votes, not_participating, total_voted, druk_number, categories, tags";

export const PAGE_SIZE = 25;

export interface SearchParams {
  q?: string;
  club?: string;
  category?: string;
  result?: "passed" | "rejected" | "";
  druk?: string;
  from?: string;
  to?: string;
  page?: number;
}

/** Full-text-ish search over votings with filters + pagination. */
export async function searchVotings(params: SearchParams) {
  const supabase = await createClient();
  const page = Math.max(1, params.page ?? 1);
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("votings")
    .select(VOTING_FIELDS, { count: "exact" })
    .order("vote_date", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const q = params.q?.trim();
  if (q) {
    const safe = q.replace(/[%,()]/g, " ");
    query = query.or(
      `display_title.ilike.%${safe}%,title.ilike.%${safe}%,topic.ilike.%${safe}%,description.ilike.%${safe}%`
    );
  }

  if (params.druk) {
    const n = parseInt(params.druk, 10);
    if (!Number.isNaN(n)) query = query.eq("druk_number", n);
  }

  if (params.category) query = query.contains("categories", [params.category]);
  if (params.from) query = query.gte("vote_date", params.from);
  if (params.to) query = query.lte("vote_date", params.to);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  let rows = (data ?? []) as unknown as VotingRow[];

  // Outcome filter is derived, not stored — applied after fetch.
  if (params.result === "passed") rows = rows.filter(passed);
  if (params.result === "rejected") rows = rows.filter((v) => !passed(v));

  return { rows, total: count ?? 0, page, pageCount: Math.ceil((count ?? 0) / PAGE_SIZE) };
}

export function passed(v: Pick<VotingRow, "yes_votes" | "no_votes">) {
  return (v.yes_votes ?? 0) > (v.no_votes ?? 0);
}

export function votingTitle(v: Pick<VotingRow, "display_title" | "title">) {
  return v.display_title?.trim() || v.title;
}

export async function getVoting(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("votings").select(VOTING_FIELDS).eq("id", id).maybeSingle();
  return (data as unknown as VotingRow) ?? null;
}

export async function getRecentVotings(limit = 10) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("votings")
    .select(VOTING_FIELDS)
    .order("vote_date", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as VotingRow[];
}

/** Club-by-club breakdown for a single voting — the "Sejm360" screen. */
export async function getClubBreakdown(votingId: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_voting_club_breakdown", { p_voting_id: votingId });
  return (data ?? []) as ClubBreakdownRow[];
}

/** Individual MP votes for one voting, optionally narrowed to one club. */
export async function getVotingMPVotes(votingId: string, club?: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_voting_mp_votes", {
    p_voting_id: votingId,
    p_club: club ?? null,
  });
  return (data ?? []) as {
    politician_id: string;
    first_name: string;
    last_name: string;
    club: string | null;
    vote: VoteValue;
  }[];
}

export async function getPolitician(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("politicians")
    .select("id, sejm_id, first_name, last_name, club, active")
    .eq("id", id)
    .maybeSingle();
  return (data as PoliticianRow) ?? null;
}

export async function listPoliticians(club?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("politicians")
    .select("id, sejm_id, first_name, last_name, club, active")
    .order("last_name", { ascending: true })
    .limit(1000);
  if (club) query = query.eq("club", club);
  const { data } = await query;
  return (data ?? []) as PoliticianRow[];
}

export interface PoliticianStats {
  yes_count: number;
  no_count: number;
  abstain_count: number;
  absent_count: number;
  total_count: number;
  attendance_pct: number;
  rebellion_count: number;
}

export async function getPoliticianStats(politicianId: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_politician_stats", { p_politician_id: politicianId });
  const row = Array.isArray(data) ? data[0] : data;
  return (row as PoliticianStats) ?? null;
}

export async function getPoliticianVotes(politicianId: string, limit = 50, offset = 0) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_politician_voting_history", {
    p_politician_id: politicianId,
    p_limit: limit,
    p_offset: offset,
  });
  return (data ?? []) as {
    voting_id: string;
    display_title: string | null;
    title: string;
    vote_date: string;
    druk_number: number | null;
    vote: VoteValue;
    club_majority: string;
    against_club: boolean;
  }[];
}

export interface ClubStats {
  club: string;
  mp_count: number;
  votings_count: number;
  attendance_pct: number;
  cohesion_pct: number;
  yes_count: number;
  no_count: number;
  abstain_count: number;
}

export async function listClubs() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_club_stats", { p_club: null });
  return (data ?? []) as ClubStats[];
}

export async function getClubStats(club: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_club_stats", { p_club: club });
  const row = Array.isArray(data) ? data[0] : data;
  return (row as ClubStats) ?? null;
}

/* ── Ranking / canned-query pages ───────────────────────────────────────── */

export async function getRanking(slug: string, limit = 50) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_ranking", { p_slug: slug, p_limit: limit });
  return (data ?? []) as {
    rank: number;
    entity_id: string;
    label: string;
    sublabel: string | null;
    value: number;
    value_label: string;
  }[];
}
