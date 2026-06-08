-- PPL Theory Hub — Analytics setup
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard → SQL)
-- Replace CHANGE_ME_ADMIN_KEY with a strong secret password before running.

CREATE TABLE IF NOT EXISTS stats_events (
  id bigserial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  visitor_id text NOT NULL,
  visitor_name text,
  session_id text,
  event_type text NOT NULL,
  module_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_stats_events_created_at ON stats_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stats_events_visitor_id ON stats_events (visitor_id);
CREATE INDEX IF NOT EXISTS idx_stats_events_event_type ON stats_events (event_type);
CREATE INDEX IF NOT EXISTS idx_stats_events_module_id ON stats_events (module_id);

ALTER TABLE stats_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_stats" ON stats_events;
CREATE POLICY "anon_insert_stats" ON stats_events
  FOR INSERT TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_stats" ON stats_events;
CREATE POLICY "anon_select_stats" ON stats_events
  FOR SELECT TO anon
  USING (false);

CREATE OR REPLACE FUNCTION get_admin_stats(admin_key text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expected_key constant text := 'CHANGE_ME_ADMIN_KEY';
BEGIN
  IF admin_key IS NULL OR admin_key <> expected_key THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  RETURN (
    SELECT json_build_object(
      'summary', (
        SELECT json_build_object(
          'unique_visitors', (SELECT count(DISTINCT visitor_id) FROM stats_events),
          'named_visitors', (
            SELECT count(DISTINCT visitor_id)
            FROM stats_events
            WHERE visitor_name IS NOT NULL AND visitor_name <> '' AND visitor_name NOT LIKE 'אנונימי-%'
          ),
          'total_visits', (SELECT count(*) FROM stats_events WHERE event_type = 'app_visit'),
          'visits_today', (
            SELECT count(*) FROM stats_events
            WHERE event_type = 'app_visit' AND created_at >= date_trunc('day', now())
          ),
          'visits_7d', (
            SELECT count(*) FROM stats_events
            WHERE event_type = 'app_visit' AND created_at >= now() - interval '7 days'
          ),
          'total_answers', (SELECT count(*) FROM stats_events WHERE event_type = 'answer'),
          'correct_answers', (
            SELECT count(*) FROM stats_events
            WHERE event_type = 'answer' AND (payload->>'correct')::boolean = true
          ),
          'exam_submissions', (SELECT count(*) FROM stats_events WHERE event_type = 'exam_submit'),
          'avg_session_sec', (
            SELECT coalesce(round(avg((payload->>'duration_sec')::numeric)), 0)
            FROM stats_events
            WHERE event_type = 'session_end' AND (payload->>'duration_sec') IS NOT NULL
          )
        )
      ),
      'visitors', (
        SELECT coalesce(json_agg(row_to_json(v) ORDER BY v.last_seen DESC), '[]'::json)
        FROM (
          SELECT
            visitor_id,
            coalesce(
              max(visitor_name) FILTER (WHERE visitor_name IS NOT NULL AND visitor_name <> ''),
              'אנונימי'
            ) AS visitor_name,
            min(created_at) AS first_seen,
            max(created_at) AS last_seen,
            count(*) FILTER (WHERE event_type = 'app_visit') AS visit_count,
            count(*) FILTER (WHERE event_type = 'answer') AS answer_count,
            count(*) FILTER (WHERE event_type = 'answer' AND (payload->>'correct')::boolean = true) AS correct_count,
            count(DISTINCT module_id) FILTER (WHERE module_id IS NOT NULL) AS modules_used,
            count(*) FILTER (WHERE event_type = 'exam_submit') AS exam_submissions
          FROM stats_events
          GROUP BY visitor_id
        ) v
      ),
      'modules', (
        SELECT coalesce(json_agg(row_to_json(m) ORDER BY m.opens DESC), '[]'::json)
        FROM (
          SELECT
            module_id,
            count(*) FILTER (WHERE event_type = 'module_open') AS opens,
            count(*) FILTER (WHERE event_type = 'answer') AS answers,
            count(*) FILTER (WHERE event_type = 'answer' AND (payload->>'correct')::boolean = true) AS correct,
            count(*) FILTER (WHERE event_type = 'exam_submit') AS submissions,
            coalesce(round(avg((payload->>'score_pct')::numeric) FILTER (WHERE event_type = 'exam_submit')), 0) AS avg_score_pct
          FROM stats_events
          WHERE module_id IS NOT NULL
          GROUP BY module_id
        ) m
      ),
      'daily', (
        SELECT coalesce(json_agg(row_to_json(d) ORDER BY d.day DESC), '[]'::json)
        FROM (
          SELECT
            date_trunc('day', created_at)::date AS day,
            count(*) FILTER (WHERE event_type = 'app_visit') AS visits,
            count(*) FILTER (WHERE event_type = 'answer') AS answers,
            count(DISTINCT visitor_id) AS unique_visitors
          FROM stats_events
          WHERE created_at >= now() - interval '30 days'
          GROUP BY 1
        ) d
      ),
      'weak_categories', (
        SELECT coalesce(json_agg(row_to_json(c) ORDER BY c.wrong_count DESC), '[]'::json)
        FROM (
          SELECT
            module_id,
            payload->>'category' AS category,
            count(*) AS wrong_count
          FROM stats_events
          WHERE event_type = 'answer'
            AND (payload->>'correct')::boolean = false
            AND payload->>'category' IS NOT NULL
          GROUP BY module_id, payload->>'category'
          ORDER BY count(*) DESC
          LIMIT 15
        ) c
      ),
      'recent_events', (
        SELECT coalesce(json_agg(row_to_json(e) ORDER BY e.created_at DESC), '[]'::json)
        FROM (
          SELECT
            created_at,
            visitor_name,
            event_type,
            module_id,
            payload
          FROM stats_events
          ORDER BY created_at DESC
          LIMIT 50
        ) e
      )
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION get_admin_stats(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_admin_stats(text) TO anon;
