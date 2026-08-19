import { createAdminClient } from "@/lib/supabase/admin";
import { VotingListResponse, VotingDetailResponse } from "./types";

/**
 * Syncs all votings and MP votes for a particular sitting number.
 * @param sittingNum - The sitting number to sync
 * @param markAsPublished - Whether to mark new votings as published (default: false)
 */
export async function syncSitting(sittingNum: number, markAsPublished: boolean = false) {
  const supabase = createAdminClient();
  
  // 1. Fetch voting list
  const listRes = await fetch(`https://api.sejm.gov.pl/sejm/term10/votings/${sittingNum}`);
  if (!listRes.ok) throw new Error(`Failed to fetch voting list for sitting ${sittingNum}`);
  
  const votings: VotingListResponse[] = await listRes.json();
  let totalSaved = 0;

  // 2. Fetch mapping of all politicians to resolve DB UUIDs from Sejm IDs
  const { data: allPol } = await supabase.from("politicians").select("id, sejm_id, club");
  const polMap = new Map<number, { id: string; club: string | null }>();
  if (allPol) {
    allPol.forEach(p => polMap.set(p.sejm_id, { id: p.id, club: p.club }));
  }

  // 3. For each voting, fetch details and insert into db
  for (const v of votings) {
    // Check if voting already exists
    const { data: existing } = await supabase
      .from("votings")
      .select("id")
      .eq("term", v.term)
      .eq("sitting_number", v.sitting)
      .eq("voting_number", v.votingNumber)
      .single();
      
    if (existing) {
      continue; // Skip if it already exists
    }

    // Polite throttling to avoid hitting API rate limits
    await new Promise(resolve => setTimeout(resolve, 200));

    // Fetch individual vote results for this voting
    const detailRes = await fetch(`https://api.sejm.gov.pl/sejm/term10/votings/${sittingNum}/${v.votingNumber}`);
    if (!detailRes.ok) continue;

    const detail: VotingDetailResponse = await detailRes.json();

    // Attempt to extract the "druk nr" (bill number) from title, topic, or description
    let drukNumber = null;
    const fullText = `${v.title || ''} ${v.topic || ''} ${v.description || ''}`;
    const match = fullText.match(/druk[ui]?\s+nr\s*(\d+)/i);
    if (match) {
      drukNumber = parseInt(match[1], 10);
    }

    // Insert the voting record
    const { data: dbVoting, error: vErr } = await supabase.from("votings").insert({
      term: v.term,
      sitting_number: v.sitting,
      voting_number: v.votingNumber,
      title: v.title,
      topic: v.topic,
      description: v.description,
      vote_date: v.date,
      kind: v.kind,
      yes_votes: v.yes,
      no_votes: v.no,
      abstain_votes: v.abstain,
      not_participating: v.notParticipating,
      total_voted: (v.yes || 0) + (v.no || 0) + (v.abstain || 0),
      druk_number: drukNumber,
      published: markAsPublished
    }).select("id").single();

    if (vErr || !dbVoting) {
        console.error(`Failed to insert voting ${v.votingNumber}`, vErr);
        continue;
    }

    // Transform MP votes and insert
    if (detail.votes && detail.votes.length > 0) {
      // club_at_vote freezes party attribution at the moment of the vote,
      // so MPs who switch clubs mid-term stay correctly attributed in history.
      const votesToInsert = detail.votes.map(mv => {
        const pol = polMap.get(mv.MP);
        return {
          voting_id: dbVoting.id,
          politician_id: pol?.id,
          club_at_vote: pol?.club ?? null,
          vote: mv.vote
        };
      }).filter(v => v.politician_id !== undefined); // only insert if we found the politician

      if (votesToInsert.length > 0) {
          const { error: mpVoteErr } = await supabase.from("politician_votes").insert(votesToInsert);
          if (mpVoteErr) {
            console.error(`Failed to insert MP votes for voting ${v.votingNumber}`, mpVoteErr);
          }
      }
    }
    
    totalSaved++;
  }
  
  return { saved: totalSaved };
}
