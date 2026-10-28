-- =====================================================
-- SEED DATA FOR AICTE COMPLAINT MONITORING SYSTEM
-- Run this AFTER schema.sql to populate initial data
-- =====================================================

-- Insert Bureaus and Cells
INSERT INTO bureaus (code, name, short_name, description, email, color) VALUES
('RB', 'Regulation Bureau', 'Regulation', 'Regulatory compliance, norm enforcement, and policy implementation', 'regulation@aicte-demo.in', '#2563eb'),
('PGRC', 'Public Grievance Redressal Cell', 'Grievance', 'Student and stakeholder grievances, complaints, and redressal', 'grievance@aicte-demo.in', '#f97316'),
('APR', 'Approvals & Recognition Bureau', 'Approvals', 'Extensions of approval, intake verification, and new programme approvals', 'approvals@aicte-demo.in', '#2563eb'),
('ACD', 'Academic Affairs Bureau', 'Academic', 'Curriculum, examinations, results, faculty strength, and academic quality', 'academic@aicte-demo.in', '#0d9488'),
('CMP', 'Compliance & Inspection Cell', 'Compliance', 'Norm adherence, mandatory disclosure, and inspection follow-ups', 'compliance@aicte-demo.in', '#b45309'),
('WEL', 'Student Welfare & Support Cell', 'Welfare', 'Scholarships, hostel amenities, health services, and student support', 'welfare@aicte-demo.in', '#16a34a')
ON CONFLICT (code) DO NOTHING;

-- Insert Regional Offices
INSERT INTO regional_offices (name, code, region, state, city, email) VALUES
('Northern Regional Office', 'NRO', 'North', 'Delhi', 'New Delhi', 'nro@aicte-demo.in'),
('Western Regional Office', 'WRO', 'West', 'Maharashtra', 'Mumbai', 'wro@aicte-demo.in'),
('Southern Regional Office', 'SRO', 'South', 'Karnataka', 'Bengaluru', 'sro@aicte-demo.in'),
('Eastern Regional Office', 'ERO', 'East', 'West Bengal', 'Kolkata', 'ero@aicte-demo.in'),
('Central Regional Office', 'CRO', 'Central', 'Madhya Pradesh', 'Bhopal', 'cro@aicte-demo.in'),
('Northeastern Regional Office', 'NERO', 'Northeast', 'Assam', 'Guwahati', 'nero@aicte-demo.in')
ON CONFLICT (code) DO NOTHING;

-- Insert SLA Rules (Default targets)
INSERT INTO sla_rules (priority, bureau_id, target_days, escalation_days, description) VALUES
('urgent', NULL, 7, 5, 'Default SLA for urgent priority cases'),
('high', NULL, 14, 10, 'Default SLA for high priority cases'),
('medium', NULL, 21, 15, 'Default SLA for medium priority cases'),
('low', NULL, 30, 21, 'Default SLA for low priority cases')
ON CONFLICT DO NOTHING;

-- Insert Role Permissions
INSERT INTO role_permissions (role, resource, action) VALUES
-- System Administrator - Full access
('system_administrator', 'cases', 'create'),
('system_administrator', 'cases', 'read'),
('system_administrator', 'cases', 'update'),
('system_administrator', 'cases', 'delete'),
('system_administrator', 'users', 'manage'),
('system_administrator', 'bureaus', 'manage'),
('system_administrator', 'reports', 'read'),

-- Competent Authority / Senior Management - Read-only + oversight
('competent_authority', 'cases', 'read'),
('competent_authority', 'reports', 'read'),
('competent_authority', 'overlaps', 'read'),

-- Regulation Bureau Officer
('rb_officer', 'cases', 'create'),
('rb_officer', 'cases', 'read'),
('rb_officer', 'cases', 'update'),
('rb_officer', 'cases', 'transfer'),
('rb_officer', 'overlaps', 'review'),

-- PGRC Officer
('pgrc_officer', 'cases', 'create'),
('pgrc_officer', 'cases', 'read'),
('pgrc_officer', 'cases', 'update'),
('pgrc_officer', 'cases', 'transfer'),
('pgrc_officer', 'overlaps', 'review'),

-- Other Bureau Officer
('bureau_officer', 'cases', 'create'),
('bureau_officer', 'cases', 'read'),
('bureau_officer', 'cases', 'update'),
('bureau_officer', 'cases', 'transfer'),

-- Regional Officer
('regional_officer', 'cases', 'read'),
('regional_officer', 'cases', 'update'),
('regional_officer', 'escalations', 'manage'),

-- Auditor - Read-only
('auditor', 'cases', 'read'),
('auditor', 'audit_logs', 'read'),
('auditor', 'reports', 'read')
ON CONFLICT DO NOTHING;

-- Insert Sample Institutions (for demo purposes)
INSERT INTO institutions (aicte_permanent_id, name, type, state, district, city, email, verified) VALUES
('1-123456789', 'Greenwood Institute of Technology', 'affiliated', 'Maharashtra', 'Pune', 'Pune', 'info@greenwood.edu.in', TRUE),
('1-987654321', 'Blue Ridge College of Pharmacy', 'autonomous', 'Telangana', 'Hyderabad', 'Hyderabad', 'admin@blueridge.edu.in', TRUE),
('1-456789123', 'Kaveri Institute of Management', 'affiliated', 'Karnataka', 'Bengaluru', 'Bengaluru', 'office@kaveri.ac.in', TRUE),
('1-789123456', 'Mahanadi Institute of Technology', 'autonomous', 'Chhattisgarh', 'Raipur', 'Raipur', 'contact@mahanadi.edu.in', TRUE),
('1-321654987', 'Vindhya College of Engineering', 'affiliated', 'Madhya Pradesh', 'Bhopal', 'Bhopal', 'registrar@vindhya.ac.in', TRUE),
('1-654987321', 'Northgate Technical University', 'university', 'Uttar Pradesh', 'Lucknow', 'Lucknow', 'admin@northgate.edu.in', TRUE),
('1-147258369', 'Waltair Institute of Marine Engineering', 'autonomous', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'info@waltair.edu.in', TRUE),
('1-369258147', 'Thar Desert College of Polytechnic', 'polytechnic', 'Rajasthan', 'Jodhpur', 'Jodhpur', 'office@thardesert.edu.in', TRUE),
('1-258369147', 'Brahmaputra Valley University', 'university', 'Assam', 'Guwahati', 'Guwahati', 'info@bvu.edu.in', TRUE),
('1-741852963', 'Backwater Institute of Hospitality Studies', 'affiliated', 'Kerala', 'Kochi', 'Kochi', 'admin@backwater.edu.in', TRUE),
('1-852963741', 'Eastern Ghat College of Engineering', 'autonomous', 'Odisha', 'Bhubaneswar', 'Bhubaneswar', 'principal@eastghat.ac.in', TRUE),
('1-963741852', 'Deccan College of Agriculture', 'affiliated', 'Maharashtra', 'Nashik', 'Nashik', 'registrar@deccan.edu.in', TRUE),
('1-159357486', 'Chinar Valley Institute of Architecture', 'autonomous', 'Jammu and Kashmir', 'Srinagar', 'Srinagar', 'office@chinar.edu.in', TRUE),
('1-357486159', 'Doon Valley College of Education', 'affiliated', 'Uttarakhand', 'Dehradun', 'Dehradun', 'info@doon.edu.in', TRUE),
('1-486159357', 'Devgiri Technical Institute', 'affiliated', 'Maharashtra', 'Aurangabad', 'Aurangabad', 'admin@devgiri.ac.in', TRUE),
('1-824916357', 'Hooghly Institute of Design', 'autonomous', 'West Bengal', 'Kolkata', 'Kolkata', 'contact@hooghly.edu.in', TRUE),
('1-916357824', 'Coromandel College of Arts & Science', 'affiliated', 'Tamil Nadu', 'Chennai', 'Chennai', 'office@coromandel.edu.in', TRUE)
ON CONFLICT (aicte_permanent_id) DO NOTHING;

-- NOTE: Demo cases will be migrated from localStorage or created via the application
-- to preserve the existing seeded complaints and their relationships.

-- Create a function to help migrate localStorage demo data
CREATE OR REPLACE FUNCTION migrate_demo_case(
  p_case_number TEXT,
  p_subject TEXT,
  p_description TEXT,
  p_complainant_name TEXT,
  p_complainant_email TEXT,
  p_institution_name TEXT,
  p_category TEXT,
  p_bureau_code TEXT,
  p_priority TEXT,
  p_status TEXT,
  p_receipt_date TIMESTAMP WITH TIME ZONE
)
RETURNS UUID AS $$
DECLARE
  v_case_id UUID;
  v_bureau_id UUID;
  v_institution_id UUID;
  v_case_status case_status;
  v_case_priority case_priority;
BEGIN
  -- Get bureau ID
  SELECT id INTO v_bureau_id FROM bureaus WHERE code = p_bureau_code LIMIT 1;
  
  -- Get institution ID (fuzzy match on name)
  SELECT id INTO v_institution_id FROM institutions 
  WHERE LOWER(name) LIKE LOWER('%' || p_institution_name || '%')
  LIMIT 1;
  
  -- Map legacy status to enum
  v_case_status := CASE p_status
    WHEN 'Submitted' THEN 'received'::case_status
    WHEN 'Under Review' THEN 'under_process'::case_status
    WHEN 'In Progress' THEN 'under_process'::case_status
    WHEN 'Resolved' THEN 'disposed'::case_status
    WHEN 'Escalated' THEN 'escalated'::case_status
    ELSE 'pending'::case_status
  END;
  
  -- Map priority
  v_case_priority := CASE LOWER(p_priority)
    WHEN 'high' THEN 'high'::case_priority
    WHEN 'medium' THEN 'medium'::case_priority
    WHEN 'low' THEN 'low'::case_priority
    ELSE 'medium'::case_priority
  END;
  
  -- Insert case
  INSERT INTO cases (
    case_number,
    institution_id,
    institution_name,
    subject,
    description,
    complainant_name,
    complainant_email,
    category,
    bureau_id,
    status,
    priority,
    receipt_date,
    is_demo
  ) VALUES (
    p_case_number,
    v_institution_id,
    p_institution_name,
    p_subject,
    p_description,
    p_complainant_name,
    p_complainant_email,
    p_category,
    v_bureau_id,
    v_case_status,
    v_case_priority,
    p_receipt_date,
    TRUE
  )
  RETURNING id INTO v_case_id;
  
  RETURN v_case_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION migrate_demo_case IS 'Helper function to migrate localStorage demo complaints to the database';
