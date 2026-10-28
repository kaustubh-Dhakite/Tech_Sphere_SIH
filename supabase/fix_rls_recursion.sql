-- =====================================================================
-- FIX: Infinite recursion in RLS policies
-- =====================================================================
-- The original schema had policies on `cases`, `case_actions`, and
-- `case_notes` that queried `profiles` inside an USING clause.
-- Because `profiles` itself has an RLS policy, Postgres entered an
-- infinite loop.
--
-- Solution: use SECURITY DEFINER helper functions that bypass RLS
-- when checking the caller's role/bureau, then reference those
-- functions in the policies instead.
--
-- Run this in Supabase SQL Editor AFTER schema.sql has been applied.
-- =====================================================================

-- 1. Drop the broken policies ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can read authorized cases"        ON cases;
DROP POLICY IF EXISTS "Officers can create cases"              ON cases;
DROP POLICY IF EXISTS "Officers can update authorized cases"   ON cases;
DROP POLICY IF EXISTS "Users can read case actions"            ON case_actions;
DROP POLICY IF EXISTS "Users can read authorized case notes"   ON case_notes;
DROP POLICY IF EXISTS "Staff can read overlap alerts"          ON overlap_alerts;
DROP POLICY IF EXISTS "Admins can read all profiles"           ON profiles;

-- 2. Create SECURITY DEFINER helper functions ─────────────────────────────────
--    These run as the DB owner (bypassing RLS), so they can safely
--    query `profiles` without triggering another RLS check.

CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION auth_user_bureau_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT bureau_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION auth_user_regional_office_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT regional_office_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Convenience: TRUE when caller has one of the listed roles
CREATE OR REPLACE FUNCTION auth_has_role(roles user_role[])
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = ANY(roles)
  );
$$;

-- 3. Re-create policies using the helper functions ────────────────────────────

-- profiles: admins can read all
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (
    auth_has_role(ARRAY['system_administrator','competent_authority']::user_role[])
  );

-- cases: read
CREATE POLICY "Users can read authorized cases"
  ON cases FOR SELECT
  USING (
    -- System admin / senior mgmt / auditor → all cases
    auth_has_role(ARRAY['system_administrator','competent_authority','auditor']::user_role[])
    OR
    -- Bureau officers → cases in their bureau
    (
      auth_user_bureau_id() IS NOT NULL
      AND auth_user_bureau_id() = bureau_id
      AND auth_has_role(ARRAY['rb_officer','pgrc_officer','bureau_officer']::user_role[])
    )
    OR
    -- Regional officers → cases in their region
    (
      auth_user_regional_office_id() IS NOT NULL
      AND auth_user_regional_office_id() = regional_office_id
      AND auth_has_role(ARRAY['regional_officer']::user_role[])
    )
    OR
    -- Assigned officer always sees their case
    assigned_officer_id = auth.uid()
  );

-- cases: insert
CREATE POLICY "Officers can create cases"
  ON cases FOR INSERT
  WITH CHECK (
    auth_has_role(ARRAY[
      'system_administrator','rb_officer','pgrc_officer',
      'bureau_officer','regional_officer'
    ]::user_role[])
  );

-- cases: update
CREATE POLICY "Officers can update authorized cases"
  ON cases FOR UPDATE
  USING (
    auth_has_role(ARRAY['system_administrator','competent_authority']::user_role[])
    OR (
      auth_user_bureau_id() IS NOT NULL
      AND auth_user_bureau_id() = bureau_id
      AND auth_has_role(ARRAY['rb_officer','pgrc_officer','bureau_officer']::user_role[])
    )
    OR assigned_officer_id = auth.uid()
  );

-- case_actions: read
CREATE POLICY "Users can read case actions"
  ON case_actions FOR SELECT
  USING (
    auth_has_role(ARRAY['system_administrator','competent_authority','auditor']::user_role[])
    OR EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = case_actions.case_id
        AND (
          auth_user_bureau_id() = cases.bureau_id
          OR cases.assigned_officer_id = auth.uid()
        )
    )
  );

-- case_notes: read (public notes for everyone; internal only for staff)
CREATE POLICY "Users can read authorized case notes"
  ON case_notes FOR SELECT
  USING (
    is_internal = FALSE
    OR auth_has_role(ARRAY[
      'system_administrator','competent_authority',
      'rb_officer','pgrc_officer','bureau_officer',
      'regional_officer','auditor'
    ]::user_role[])
  );

-- overlap_alerts: staff only
CREATE POLICY "Staff can read overlap alerts"
  ON overlap_alerts FOR SELECT
  USING (
    auth_has_role(ARRAY[
      'system_administrator','competent_authority',
      'rb_officer','pgrc_officer','bureau_officer','auditor'
    ]::user_role[])
  );

-- 4. Grant execute on helper functions to authenticated role ──────────────────
GRANT EXECUTE ON FUNCTION auth_user_role()              TO authenticated;
GRANT EXECUTE ON FUNCTION auth_user_bureau_id()         TO authenticated;
GRANT EXECUTE ON FUNCTION auth_user_regional_office_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auth_has_role(user_role[])    TO authenticated;
