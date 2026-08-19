-- ============================================================================
-- 0001 — Explorer core schema additions
--
-- Run this on the EXISTING Supabase project that already holds
-- politicians / votings / politician_votes / druk_summaries.
-- Everything here is additive and idempotent.
-- ============================================================================

-- ─── 1. Club at time of vote ────────────────────────────────────────────────
-- politicians.club only stores the MP's CURRENT club. MPs switch clubs
-- mid-term, so historical "how did party X vote" is wrong for switchers.
-- Capturing the club on the vote row fixes attribution permanently.
-- Backfilled from the current club; correct from the next sync onward.

ALTER TABLE politician_votes
  ADD COLUMN IF NOT EXISTS club_at_vote text;

UPDATE politician_votes pv
SET    club_at_vote = p.club
FROM   politicians p
WHERE  pv.politician_id = p.id
  AND  pv.club_at_vote IS NULL;

CREATE INDEX IF NOT EXISTS idx_pol_votes_club_at_vote
  ON politician_votes (club_at_vote);

CREATE INDEX IF NOT EXISTS idx_pol_votes_voting_club
  ON politician_votes (voting_id, club_at_vote);

-- ─── 2. Search support ──────────────────────────────────────────────────────
-- Trigram indexes make the ILIKE '%term%' search fast without a tsvector
-- column. Polish stemming is not worth the complexity at MVP scale.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_votings_title_trgm
  ON votings USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_votings_display_title_trgm
  ON votings USING gin (display_title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_votings_topic_trgm
  ON votings USING gin (topic gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_votings_categories
  ON votings USING gin (categories);
CREATE INDEX IF NOT EXISTS idx_votings_tags
  ON votings USING gin (tags);

-- ─── 3. Public read policies ────────────────────────────────────────────────
-- The Explorer is login-free. These four tables are public records.

ALTER TABLE politicians       ENABLE ROW LEVEL SECURITY;
ALTER TABLE votings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE politician_votes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE druk_summaries    ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='politicians' AND policyname='Public read politicians') THEN
    CREATE POLICY "Public read politicians" ON politicians FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='votings' AND policyname='Public read votings') THEN
    CREATE POLICY "Public read votings" ON votings FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='politician_votes' AND policyname='Public read politician_votes') THEN
    CREATE POLICY "Public read politician_votes" ON politician_votes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='druk_summaries' AND policyname='Public read druk_summaries') THEN
    CREATE POLICY "Public read druk_summaries" ON druk_summaries FOR SELECT USING (true);
  END IF;
END $$;
