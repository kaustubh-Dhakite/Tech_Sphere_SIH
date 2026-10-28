-- =====================================================
-- AICTE Integrated Complaint Monitoring System
-- Database Schema for Supabase PostgreSQL
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE user_role AS ENUM (
  'system_administrator',
  'competent_authority',
  'rb_officer',           -- Regulation Bureau
  'pgrc_officer',         -- Public Grievance Redressal Cell
  'bureau_officer',       -- Other Bureau/Cell
  'regional_officer',
  'auditor'
);

CREATE TYPE case_status AS ENUM (
  'received',
  'pending',
  'under_process',
  'transferred',
  'escalated',
  'disposed',
  'reopened'
);

CREATE TYPE case_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TYPE institution_type AS ENUM (
  'university',
  'autonomous',
  'affiliated',
  'polytechnic',
  'other'
);

CREATE TYPE overlap_match_type AS ENUM (
  'exact_id',
  'institution_name',
  'subject_similarity',
  'semantic_match'
);

CREATE TYPE overlap_status AS ENUM ('detected', 'reviewed', 'confirmed', 'dismissed', 'linked');

-- =====================================================
-- TABLES
-- =====================================================

-- User Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL,
  bureau_id UUID, -- NULL for cross-bureau roles
  regional_office_id UUID,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Role Permissions
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role user_role NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role, resource, action)
);

-- Bureaus and Cells
CREATE TABLE bureaus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE, -- 'RB', 'PGRC', 'APR', 'ACD', 'CMP', 'WEL'
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  description TEXT,
  email TEXT,
  phone TEXT,
  color TEXT DEFAULT '#2563eb',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Regional Offices
CREATE TABLE regional_offices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  region TEXT NOT NULL, -- 'North', 'South', 'East', 'West', 'Central', 'Northeast'
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Institutions
CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aicte_permanent_id TEXT UNIQUE, -- Can be NULL for unverified/legacy
  name TEXT NOT NULL,
  type institution_type NOT NULL,
  state TEXT NOT NULL,
  district TEXT,
  city TEXT,
  address TEXT,
  pincode TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  regional_office_id UUID REFERENCES regional_offices(id),
  verified BOOLEAN DEFAULT FALSE,
  aliases TEXT[], -- For overlap detection
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_institutions_aicte_id ON institutions(aicte_permanent_id);
CREATE INDEX idx_institutions_name ON institutions USING GIN (to_tsvector('english', name));
CREATE INDEX idx_institutions_state ON institutions(state);

-- Cases/Complaints
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_number TEXT NOT NULL UNIQUE, -- CMP-2026-1001
  institution_id UUID REFERENCES institutions(id),
  institution_name TEXT NOT NULL, -- Denormalized for legacy/unverified
  aicte_permanent_id TEXT, -- Denormalized
  
  -- Complaint details
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  
  -- Complainant
  complainant_name TEXT NOT NULL,
  complainant_email TEXT NOT NULL,
  complainant_phone TEXT,
  
  -- Assignment
  bureau_id UUID REFERENCES bureaus(id),
  assigned_officer_id UUID REFERENCES profiles(id),
  regional_office_id UUID REFERENCES regional_offices(id),
  
  -- Status tracking
  status case_status NOT NULL DEFAULT 'received',
  priority case_priority NOT NULL DEFAULT 'medium',
  
  -- Dates
  receipt_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expected_disposal_date TIMESTAMP WITH TIME ZONE,
  actual_disposal_date TIMESTAMP WITH TIME ZONE,
  last_action_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional
  last_action_description TEXT,
  next_required_action TEXT,
  disposal_outcome TEXT,
  is_demo BOOLEAN DEFAULT FALSE, -- Flag for demo/seed data
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cases_case_number ON cases(case_number);
CREATE INDEX idx_cases_institution ON cases(institution_id);
CREATE INDEX idx_cases_aicte_id ON cases(aicte_permanent_id);
CREATE INDEX idx_cases_bureau ON cases(bureau_id);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_priority ON cases(priority);
CREATE INDEX idx_cases_receipt_date ON cases(receipt_date DESC);
CREATE INDEX idx_cases_subject ON cases USING GIN (to_tsvector('english', subject));
CREATE INDEX idx_cases_description ON cases USING GIN (to_tsvector('english', description));

-- Case Assignment History
CREATE TABLE case_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  from_bureau_id UUID REFERENCES bureaus(id),
  to_bureau_id UUID REFERENCES bureaus(id),
  from_officer_id UUID REFERENCES profiles(id),
  to_officer_id UUID REFERENCES profiles(id),
  assigned_by_id UUID REFERENCES profiles(id),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_assignments_case ON case_assignments(case_id);

-- Case Action History/Timeline
CREATE TABLE case_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'status_change', 'transfer', 'escalation', 'note', 'document_upload'
  performed_by_id UUID REFERENCES profiles(id),
  performed_by_name TEXT NOT NULL,
  performed_by_role TEXT NOT NULL,
  
  old_status case_status,
  new_status case_status,
  old_bureau_id UUID REFERENCES bureaus(id),
  new_bureau_id UUID REFERENCES bureaus(id),
  
  action_description TEXT NOT NULL,
  details TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_actions_case ON case_actions(case_id, created_at DESC);
CREATE INDEX idx_actions_type ON case_actions(action_type);

-- Case Notes (internal and public remarks)
CREATE TABLE case_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  note_text TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notes_case ON case_notes(case_id, created_at DESC);

-- Case Document Attachments
CREATE TABLE case_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  storage_path TEXT NOT NULL, -- Supabase Storage path
  uploaded_by_id UUID REFERENCES profiles(id),
  is_sensitive BOOLEAN DEFAULT FALSE, -- Restricted access
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_documents_case ON case_documents(case_id);

-- Linked/Related Cases
CREATE TABLE case_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  linked_case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL, -- 'related', 'duplicate', 'follow_up'
  description TEXT,
  created_by_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(case_id, linked_case_id)
);

CREATE INDEX idx_links_case ON case_links(case_id);
CREATE INDEX idx_links_linked_case ON case_links(linked_case_id);

-- Overlap Detection Alerts
CREATE TABLE overlap_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  related_case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id),
  match_type overlap_match_type NOT NULL,
  match_confidence NUMERIC(3,2), -- 0.00 to 1.00
  match_reason TEXT NOT NULL,
  status overlap_status DEFAULT 'detected',
  reviewed_by_id UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(case_id, related_case_id)
);

CREATE INDEX idx_overlaps_case ON overlap_alerts(case_id);
CREATE INDEX idx_overlaps_related ON overlap_alerts(related_case_id);
CREATE INDEX idx_overlaps_status ON overlap_alerts(status);
CREATE INDEX idx_overlaps_institution ON overlap_alerts(institution_id);

-- SLA Rules
CREATE TABLE sla_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  priority case_priority NOT NULL,
  bureau_id UUID REFERENCES bureaus(id), -- NULL for default rule
  target_days INTEGER NOT NULL,
  escalation_days INTEGER,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SLA Escalations
CREATE TABLE sla_escalations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  escalation_reason TEXT NOT NULL,
  escalated_to_id UUID REFERENCES profiles(id),
  escalated_by_id UUID REFERENCES profiles(id),
  days_overdue INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_escalations_case ON sla_escalations(case_id);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL, -- 'new_assignment', 'status_change', 'sla_warning', 'overlap_detected', 'escalation'
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bureaus ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE overlap_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Profiles: Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('system_administrator', 'competent_authority')
    )
  );

-- Bureaus: All authenticated users can read
CREATE POLICY "Authenticated users can read bureaus"
  ON bureaus FOR SELECT
  USING (auth.role() = 'authenticated');

-- Regional Offices: All authenticated users can read
CREATE POLICY "Authenticated users can read regional offices"
  ON regional_offices FOR SELECT
  USING (auth.role() = 'authenticated');

-- Institutions: All authenticated users can read
CREATE POLICY "Authenticated users can read institutions"
  ON institutions FOR SELECT
  USING (auth.role() = 'authenticated');

-- Cases: Users can read cases they have access to based on role
CREATE POLICY "Users can read authorized cases"
  ON cases FOR SELECT
  USING (
    -- System administrators and competent authority can see all
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('system_administrator', 'competent_authority', 'auditor')
    )
    OR
    -- Bureau officers can see cases in their bureau
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND bureau_id = cases.bureau_id
        AND role IN ('rb_officer', 'pgrc_officer', 'bureau_officer')
    )
    OR
    -- Regional officers can see cases in their region
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND regional_office_id = cases.regional_office_id
        AND role = 'regional_officer'
    )
    OR
    -- Assigned officer can see their cases
    cases.assigned_officer_id = auth.uid()
  );

-- Cases: Officers can insert cases
CREATE POLICY "Officers can create cases"
  ON cases FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('system_administrator', 'rb_officer', 'pgrc_officer', 'bureau_officer', 'regional_officer')
    )
  );

-- Cases: Officers can update cases in their scope
CREATE POLICY "Officers can update authorized cases"
  ON cases FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND (
          role IN ('system_administrator', 'competent_authority')
          OR (bureau_id = cases.bureau_id AND role IN ('rb_officer', 'pgrc_officer', 'bureau_officer'))
          OR (assigned_officer_id = auth.uid())
        )
    )
  );

-- Case Actions: Users can read actions for cases they can see
CREATE POLICY "Users can read case actions"
  ON case_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = case_actions.case_id
        AND (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('system_administrator', 'competent_authority', 'auditor')
          )
          OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND bureau_id = cases.bureau_id
          )
          OR cases.assigned_officer_id = auth.uid()
        )
    )
  );

-- Case Notes: Users can read public notes or internal notes if authorized
CREATE POLICY "Users can read authorized case notes"
  ON case_notes FOR SELECT
  USING (
    (is_internal = FALSE) -- Public notes visible to all
    OR
    -- Internal notes only for staff
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('system_administrator', 'competent_authority', 'rb_officer', 'pgrc_officer', 'bureau_officer', 'regional_officer', 'auditor')
    )
  );

-- Overlap Alerts: Staff can read overlap alerts
CREATE POLICY "Staff can read overlap alerts"
  ON overlap_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('system_administrator', 'competent_authority', 'rb_officer', 'pgrc_officer', 'bureau_officer', 'auditor')
    )
  );

-- Notifications: Users can read their own notifications
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Audit Logs: Only system admins can read audit logs
CREATE POLICY "System admins can read audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'system_administrator'
    )
  );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bureaus_updated_at BEFORE UPDATE ON bureaus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_institutions_updated_at BEFORE UPDATE ON institutions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_notes_updated_at BEFORE UPDATE ON case_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate case number
CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  max_num INTEGER;
  new_num TEXT;
BEGIN
  year := EXTRACT(YEAR FROM NOW())::TEXT;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(case_number FROM '\d{4}$') AS INTEGER)), 1000) INTO max_num
  FROM cases
  WHERE case_number LIKE 'CMP-' || year || '-%';
  
  new_num := (max_num + 1)::TEXT;
  
  RETURN 'CMP-' || year || '-' || new_num;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate SLA days remaining
CREATE OR REPLACE FUNCTION calculate_sla_days_remaining(case_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  receipt_date_val TIMESTAMP WITH TIME ZONE;
  priority_val case_priority;
  bureau_id_val UUID;
  target_days INTEGER;
  days_elapsed INTEGER;
BEGIN
  SELECT receipt_date, priority, bureau_id INTO receipt_date_val, priority_val, bureau_id_val
  FROM cases WHERE id = case_id_param;
  
  SELECT sla_rules.target_days INTO target_days
  FROM sla_rules
  WHERE sla_rules.priority = priority_val
    AND (sla_rules.bureau_id = bureau_id_val OR sla_rules.bureau_id IS NULL)
    AND sla_rules.is_active = TRUE
  ORDER BY sla_rules.bureau_id NULLS LAST
  LIMIT 1;
  
  IF target_days IS NULL THEN
    target_days := 14; -- Default SLA
  END IF;
  
  days_elapsed := EXTRACT(DAY FROM (NOW() - receipt_date_val));
  
  RETURN target_days - days_elapsed;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Additional composite indexes for common queries
CREATE INDEX idx_cases_bureau_status ON cases(bureau_id, status);
CREATE INDEX idx_cases_officer_status ON cases(assigned_officer_id, status);
CREATE INDEX idx_cases_regional_status ON cases(regional_office_id, status);
CREATE INDEX idx_cases_sla_check ON cases(receipt_date, status) WHERE status NOT IN ('disposed');

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE cases IS 'Main complaints/cases table for AICTE institution monitoring';
COMMENT ON TABLE institutions IS 'Directory of AICTE-recognized institutions with permanent IDs';
COMMENT ON TABLE overlap_alerts IS 'Detected potential overlapping cases across bureaus for coordination';
COMMENT ON TABLE case_actions IS 'Complete audit trail of all actions performed on cases';
COMMENT ON COLUMN cases.is_demo IS 'Flag to distinguish demo/seed data from real records';
COMMENT ON COLUMN case_notes.is_internal IS 'Internal notes restricted to staff; public remarks visible to complainants';
