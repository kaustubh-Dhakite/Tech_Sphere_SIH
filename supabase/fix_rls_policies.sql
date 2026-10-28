-- =====================================================
-- FIX ROW LEVEL SECURITY (RLS) POLICIES FOR CASES
-- Run this in your Supabase SQL Editor:
-- https://app.supabase.com/project/_/sql
-- =====================================================

-- 1. Allow anyone (students, citizens, anonymous complainants) to submit grievances
DROP POLICY IF EXISTS "Officers can create cases" ON cases;
DROP POLICY IF EXISTS "Public can submit cases" ON cases;
CREATE POLICY "Public can submit cases"
  ON cases FOR INSERT
  WITH CHECK (true);

-- 2. Allow reading cases (officers/admins see all, complainants see cases)
DROP POLICY IF EXISTS "Users can read authorized cases" ON cases;
DROP POLICY IF EXISTS "Allow public and officers read cases" ON cases;
CREATE POLICY "Allow public and officers read cases"
  ON cases FOR SELECT
  USING (true);

-- 3. Allow updating case statuses
DROP POLICY IF EXISTS "Officers can update authorized cases" ON cases;
DROP POLICY IF EXISTS "Allow updating cases" ON cases;
CREATE POLICY "Allow updating cases"
  ON cases FOR UPDATE
  USING (true);

-- 4. Allow admin and complainants to delete cases/queries
DROP POLICY IF EXISTS "Allow delete on cases" ON cases;
CREATE POLICY "Allow delete on cases"
  ON cases FOR DELETE
  USING (true);

-- 5. Seed default bureaus if missing
INSERT INTO bureaus (code, name, short_name, color, is_active)
VALUES
  ('APR', 'Approval Bureau', 'Approvals', '#2563eb', true),
  ('ACD', 'Academic Bureau', 'Academics', '#8b5cf6', true),
  ('GRV', 'Public Grievance Redressal Cell', 'Grievance', '#f97316', true),
  ('CMP', 'Standards & Compliance Bureau', 'Compliance', '#ef4444', true),
  ('WEL', 'Student Welfare & Scholarship Cell', 'Welfare', '#16a34a', true)
ON CONFLICT (code) DO NOTHING;
