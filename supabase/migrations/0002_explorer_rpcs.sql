-- ============================================================================
-- 0002 — Explorer read RPCs
--
-- All functions are STABLE + SECURITY DEFINER + granted to anon.
-- They only ever read public parliamentary records.
-- COALESCE(club_at_vote, current club) keeps historical attribution correct
-- while remaining safe on rows synced before 0001.
-- ============================================================================

-- ─── Club-by-club breakdown for one voting (the "Sejm360" screen) ───────────
CREATE OR REPLACE FUNCTION get_voting_club_breakdown(p_voting_id uuid)
RETURNS TABLE(
  club          text,
  club_yes      bigint,
  club_no       bigint,
  club_abstain  bigint,
  club_absent   bigint,
  club_total    bigint,
  majority_vote text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH raw AS (
    SELECT
      COALESCE(NULLIF(pv.club_at_vote, ''), pol.club) AS club,
      COUNT(*) FILTER (WHERE pv.vote = 'YES')     AS club_yes,
      COUNT(*) FILTER (WHERE pv.vote = 'NO')      AS club_no,
      COUNT(*) FILTER (WHERE pv.vote = 'ABSTAIN') AS club_abstain,
      COUNT(*) FILTER (WHERE pv.vote NOT IN ('YES','NO','ABSTAIN')) AS club_absent,
      COUNT(*) AS club_total
    FROM politician_votes pv
    JOIN politicians pol ON pol.id = pv.politician_id
    WHERE pv.voting_id = p_voting_id
    GROUP BY 1
  )
  SELECT club, club_yes, club_no, club_abstain, club_absent, club_total,
    CASE
      WHEN club_yes     > club_no  AND club_yes     > club_abstain THEN 'YES'
      WHEN club_no      > club_yes AND club_no      > club_abstain THEN 'NO'
      WHEN club_abstain > club_yes AND club_abstain > club_no      THEN 'ABSTAIN'
      ELSE 'SPLIT'
    END
  FROM raw
  WHERE club IS NOT NULL AND club <> ''
  ORDER BY club_total DESC, club;
$$;

-- ─── Individual MP votes for one voting (optionally one club) ───────────────
CREATE OR REPLACE FUNCTION get_voting_mp_votes(p_voting_id uuid, p_club text DEFAULT NULL)
RETURNS TABLE(
  politician_id uuid,
  first_name    text,
  last_name     text,
  club          text,
  vote          text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    pol.id, pol.first_name, pol.last_name,
    COALESCE(NULLIF(pv.club_at_vote, ''), pol.club) AS club,
    pv.vote
  FROM politician_votes pv
  JOIN politicians pol ON pol.id = pv.politician_id
  WHERE pv.voting_id = p_voting_id
    AND (p_club IS NULL OR COALESCE(NULLIF(pv.club_at_vote, ''), pol.club) = p_club)
  ORDER BY club, pol.last_name, pol.first_name;
$$;

-- ─── Per-MP aggregate stats (attendance + rebellion count) ──────────────────
CREATE OR REPLACE FUNCTION get_politician_stats(p_politician_id uuid)
RETURNS TABLE(
  yes_count       bigint,
  no_count        bigint,
  abstain_count   bigint,
  absent_count    bigint,
  total_count     bigint,
  attendance_pct  numeric,
  rebellion_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH mine AS (
    SELECT pv.voting_id, pv.vote,
           COALESCE(NULLIF(pv.club_at_vote, ''), pol.club) AS club
    FROM politician_votes pv
    JOIN politicians pol ON pol.id = pv.politician_id
    WHERE pv.politician_id = p_politician_id
  ),
  totals AS (
    SELECT
      COUNT(*) FILTER (WHERE vote = 'YES')     AS yes_count,
      COUNT(*) FILTER (WHERE vote = 'NO')      AS no_count,
      COUNT(*) FILTER (WHERE vote = 'ABSTAIN') AS abstain_count,
      COUNT(*) FILTER (WHERE vote NOT IN ('YES','NO','ABSTAIN')) AS absent_count,
      COUNT(*) AS total_count
    FROM mine
  ),
  club_line AS (
    -- majority direction of the MP's own club on each of those votings
    SELECT m.voting_id, m.vote AS my_vote,
      CASE
        WHEN COUNT(*) FILTER (WHERE pv.vote='YES') > COUNT(*) FILTER (WHERE pv.vote='NO')
             AND COUNT(*) FILTER (WHERE pv.vote='YES') > COUNT(*) FILTER (WHERE pv.vote='ABSTAIN') THEN 'YES'
        WHEN COUNT(*) FILTER (WHERE pv.vote='NO')  > COUNT(*) FILTER (WHERE pv.vote='YES')
             AND COUNT(*) FILTER (WHERE pv.vote='NO')  > COUNT(*) FILTER (WHERE pv.vote='ABSTAIN') THEN 'NO'
        WHEN COUNT(*) FILTER (WHERE pv.vote='ABSTAIN') > COUNT(*) FILTER (WHERE pv.vote='YES')
             AND COUNT(*) FILTER (WHERE pv.vote='ABSTAIN') > COUNT(*) FILTER (WHERE pv.vote='NO') THEN 'ABSTAIN'
        ELSE 'SPLIT'
      END AS club_majority
    FROM mine m
    JOIN politician_votes pv ON pv.voting_id = m.voting_id
    JOIN politicians pol2 ON pol2.id = pv.politician_id
    WHERE COALESCE(NULLIF(pv.club_at_vote, ''), pol2.club) = m.club
      AND pv.politician_id <> p_politician_id
    GROUP BY m.voting_id, m.vote
  )
  SELECT
    t.yes_count, t.no_count, t.abstain_count, t.absent_count, t.total_count,
    CASE WHEN t.total_count = 0 THEN 0
         ELSE ROUND(((t.yes_count + t.no_count + t.abstain_count)::numeric / t.total_count) * 100, 1)
    END,
    (SELECT COUNT(*) FROM club_line c
      WHERE c.my_vote IN ('YES','NO','ABSTAIN')
        AND c.club_majority <> 'SPLIT'
        AND c.my_vote <> c.club_majority)
  FROM totals t;
$$;

-- ─── Per-MP voting history (paged) ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_politician_voting_history(
  p_politician_id uuid,
  p_limit  int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS TABLE(
  voting_id     uuid,
  display_title text,
  title         text,
  vote_date     timestamptz,
  druk_number   int,
  vote          text,
  club_majority text,
  against_club  boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH mine AS (
    SELECT pv.voting_id, pv.vote,
           COALESCE(NULLIF(pv.club_at_vote, ''), pol.club) AS club,
           v.display_title, v.title, v.vote_date, v.druk_number
    FROM politician_votes pv
    JOIN politicians pol ON pol.id = pv.politician_id
    JOIN votings v ON v.id = pv.voting_id
    WHERE pv.politician_id = p_politician_id
    ORDER BY v.vote_date DESC
    LIMIT p_limit OFFSET p_offset
  ),
  club_line AS (
    SELECT m.voting_id,
      CASE
        WHEN COUNT(*) FILTER (WHERE pv.vote='YES') > COUNT(*) FILTER (WHERE pv.vote='NO')
             AND COUNT(*) FILTER (WHERE pv.vote='YES') > COUNT(*) FILTER (WHERE pv.vote='ABSTAIN') THEN 'YES'
        WHEN COUNT(*) FILTER (WHERE pv.vote='NO')  > COUNT(*) FILTER (WHERE pv.vote='YES')
             AND COUNT(*) FILTER (WHERE pv.vote='NO')  > COUNT(*) FILTER (WHERE pv.vote='ABSTAIN') THEN 'NO'
        WHEN COUNT(*) FILTER (WHERE pv.vote='ABSTAIN') > COUNT(*) FILTER (WHERE pv.vote='YES')
             AND COUNT(*) FILTER (WHERE pv.vote='ABSTAIN') > COUNT(*) FILTER (WHERE pv.vote='NO') THEN 'ABSTAIN'
        ELSE 'SPLIT'
      END AS club_majority
    FROM mine m
    JOIN politician_votes pv ON pv.voting_id = m.voting_id
    JOIN politicians pol2 ON pol2.id = pv.politician_id
    WHERE COALESCE(NULLIF(pv.club_at_vote, ''), pol2.club) = m.club
      AND pv.politician_id <> p_politician_id
    GROUP BY m.voting_id
  )
  SELECT m.voting_id, m.display_title, m.title, m.vote_date, m.druk_number, m.vote,
         COALESCE(c.club_majority, 'SPLIT'),
         (m.vote IN ('YES','NO','ABSTAIN')
          AND COALESCE(c.club_majority,'SPLIT') <> 'SPLIT'
          AND m.vote <> c.club_majority)
  FROM mine m
  LEFT JOIN club_line c ON c.voting_id = m.voting_id
  ORDER BY m.vote_date DESC;
$$;

-- ─── Club stats (one club, or all when p_club IS NULL) ──────────────────────
CREATE OR REPLACE FUNCTION get_club_stats(p_club text DEFAULT NULL)
RETURNS TABLE(
  club           text,
  mp_count       bigint,
  votings_count  bigint,
  attendance_pct numeric,
  cohesion_pct   numeric,
  yes_count      bigint,
  no_count       bigint,
  abstain_count  bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH v AS (
    SELECT
      COALESCE(NULLIF(pv.club_at_vote, ''), pol.club) AS club,
      pv.voting_id, pv.vote, pv.politician_id
    FROM politician_votes pv
    JOIN politicians pol ON pol.id = pv.politician_id
  ),
  filtered AS (
    SELECT * FROM v
    WHERE club IS NOT NULL AND club <> ''
      AND (p_club IS NULL OR club = p_club)
  ),
  agg AS (
    SELECT club,
      COUNT(*) FILTER (WHERE vote='YES')     AS yes_count,
      COUNT(*) FILTER (WHERE vote='NO')      AS no_count,
      COUNT(*) FILTER (WHERE vote='ABSTAIN') AS abstain_count,
      COUNT(*) FILTER (WHERE vote NOT IN ('YES','NO','ABSTAIN')) AS absent_count,
      COUNT(*) AS total_rows,
      COUNT(DISTINCT voting_id)    AS votings_count,
      COUNT(DISTINCT politician_id) AS mp_count
    FROM filtered GROUP BY club
  ),
  -- cohesion: share of the club voting with its own majority, averaged per voting
  per_voting AS (
    SELECT club, voting_id,
      GREATEST(
        COUNT(*) FILTER (WHERE vote='YES'),
        COUNT(*) FILTER (WHERE vote='NO'),
        COUNT(*) FILTER (WHERE vote='ABSTAIN')
      )::numeric AS top_bloc,
      NULLIF(COUNT(*) FILTER (WHERE vote IN ('YES','NO','ABSTAIN')), 0)::numeric AS active
    FROM filtered GROUP BY club, voting_id
  ),
  cohesion AS (
    SELECT club, ROUND(AVG(top_bloc / active) * 100, 1) AS cohesion_pct
    FROM per_voting WHERE active IS NOT NULL GROUP BY club
  )
  SELECT a.club, a.mp_count, a.votings_count,
    ROUND(((a.yes_count + a.no_count + a.abstain_count)::numeric / NULLIF(a.total_rows,0)) * 100, 1),
    c.cohesion_pct, a.yes_count, a.no_count, a.abstain_count
  FROM agg a LEFT JOIN cohesion c ON c.club = a.club
  ORDER BY a.mp_count DESC, a.club;
$$;

-- ─── Canned ranking pages (SEO engine) ──────────────────────────────────────
CREATE OR REPLACE FUNCTION get_ranking(p_slug text, p_limit int DEFAULT 50)
RETURNS TABLE(
  rank        int,
  entity_id   uuid,
  label       text,
  sublabel    text,
  value       numeric,
  value_label text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_slug IN ('najczesciej-nieobecni', 'najlepsza-frekwencja') THEN
    RETURN QUERY
    WITH s AS (
      SELECT pol.id, pol.first_name || ' ' || pol.last_name AS nm, pol.club,
             COUNT(*) AS total,
             COUNT(*) FILTER (WHERE pv.vote NOT IN ('YES','NO','ABSTAIN')) AS absent
      FROM politician_votes pv
      JOIN politicians pol ON pol.id = pv.politician_id
      GROUP BY pol.id, nm, pol.club
      HAVING COUNT(*) >= 50
    ), r AS (
      SELECT id, nm, club,
             ROUND((absent::numeric / total) * 100, 1) AS pct
      FROM s
    )
    SELECT ROW_NUMBER() OVER (
             ORDER BY CASE WHEN p_slug='najczesciej-nieobecni' THEN pct END DESC NULLS LAST,
                      CASE WHEN p_slug='najlepsza-frekwencja'  THEN pct END ASC  NULLS LAST
           )::int,
           r.id, r.nm, r.club,
           CASE WHEN p_slug='najlepsza-frekwencja' THEN 100 - r.pct ELSE r.pct END,
           CASE WHEN p_slug='najlepsza-frekwencja'
                THEN (100 - r.pct)::text || '% frekwencji'
                ELSE r.pct::text || '% nieobecności' END
    FROM r LIMIT p_limit;

  ELSIF p_slug = 'przeciw-wlasnemu-klubowi' THEN
    RETURN QUERY
    WITH base AS (
      SELECT pv.voting_id, pv.politician_id, pv.vote,
             COALESCE(NULLIF(pv.club_at_vote,''), pol.club) AS club,
             pol.first_name || ' ' || pol.last_name AS nm
      FROM politician_votes pv
      JOIN politicians pol ON pol.id = pv.politician_id
      WHERE pv.vote IN ('YES','NO','ABSTAIN')
    ), club_major AS (
      SELECT voting_id, club,
        CASE
          WHEN COUNT(*) FILTER (WHERE vote='YES') > COUNT(*) FILTER (WHERE vote='NO')
               AND COUNT(*) FILTER (WHERE vote='YES') > COUNT(*) FILTER (WHERE vote='ABSTAIN') THEN 'YES'
          WHEN COUNT(*) FILTER (WHERE vote='NO')  > COUNT(*) FILTER (WHERE vote='YES')
               AND COUNT(*) FILTER (WHERE vote='NO')  > COUNT(*) FILTER (WHERE vote='ABSTAIN') THEN 'NO'
          WHEN COUNT(*) FILTER (WHERE vote='ABSTAIN') > COUNT(*) FILTER (WHERE vote='YES')
               AND COUNT(*) FILTER (WHERE vote='ABSTAIN') > COUNT(*) FILTER (WHERE vote='NO') THEN 'ABSTAIN'
          ELSE 'SPLIT'
        END AS maj
      FROM base WHERE club IS NOT NULL AND club <> ''
      GROUP BY voting_id, club
    )
    SELECT ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC)::int,
           b.politician_id, MIN(b.nm), MIN(b.club),
           COUNT(*)::numeric,
           COUNT(*)::text || ' razy przeciw klubowi'
    FROM base b
    JOIN club_major cm ON cm.voting_id = b.voting_id AND cm.club = b.club
    WHERE cm.maj <> 'SPLIT' AND b.vote <> cm.maj
    GROUP BY b.politician_id
    ORDER BY COUNT(*) DESC
    LIMIT p_limit;

  ELSIF p_slug = 'najblizsze-glosowania' THEN
    RETURN QUERY
    SELECT ROW_NUMBER() OVER (ORDER BY ABS(COALESCE(v.yes_votes,0) - COALESCE(v.no_votes,0)) ASC)::int,
           v.id,
           COALESCE(NULLIF(v.display_title,''), v.title),
           to_char(v.vote_date, 'DD.MM.YYYY'),
           ABS(COALESCE(v.yes_votes,0) - COALESCE(v.no_votes,0))::numeric,
           'różnica ' || ABS(COALESCE(v.yes_votes,0) - COALESCE(v.no_votes,0))::text || ' głosów'
    FROM votings v
    WHERE COALESCE(v.yes_votes,0) + COALESCE(v.no_votes,0) > 200
    ORDER BY ABS(COALESCE(v.yes_votes,0) - COALESCE(v.no_votes,0)) ASC, v.vote_date DESC
    LIMIT p_limit;

  ELSE
    RETURN;
  END IF;
END;
$$;

-- ─── Grants: everything is public, read-only ────────────────────────────────
GRANT EXECUTE ON FUNCTION get_voting_club_breakdown(uuid)                 TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_voting_mp_votes(uuid, text)                 TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_politician_stats(uuid)                      TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_politician_voting_history(uuid, int, int)   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_club_stats(text)                            TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_ranking(text, int)                          TO anon, authenticated;
