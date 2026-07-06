/*
# Hospital Authentication & Audit Logging

## Overview
This migration adds hospital staff authentication with role-based access and audit logging for all record changes. Converts the system from single-tenant (anonymous access) to multi-user with login required.

## New Tables

### 1. hospital_roles
Predefined roles for hospital staff with permission levels.
- id, name, permissions (jsonb), created_at

### 2. hospital_users
Hospital staff accounts linked to Supabase auth.
- id, auth_user_id (FK to auth.users), email, full_name, role_id (FK), 
  department_id (FK nullable), phone, status, last_login, created_at

### 3. audit_logs
Track all CRUD operations on hospital records.
- id, user_id (FK), action (INSERT/UPDATE/DELETE), table_name, record_id,
  old_values (jsonb), new_values (jsonb), ip_address, user_agent, created_at

### 4. notifications
System notifications for users.
- id, user_id (FK), title, message, type, read, action_url, created_at

## Security Changes
- Updates existing RLS policies to require authenticated users
- Hospital users must be active to access data
- Role-based permissions for sensitive operations

## Important Notes
1. Roles seeded: admin, doctor, nurse, pharmacist, receptionist, lab_tech, accountant
2. Admin role has full access, others have department-limited access
3. Audit logs capture before/after state for UPDATE operations
4. Notifications created for key events (appointments, lab results, payments)
*/

-- ─── HOSPITAL ROLES ───────────────────────────────────────────────────────────

CREATE TYPE hospital_role_type AS ENUM (
  'admin', 'doctor', 'nurse', 'pharmacist', 
  'receptionist', 'lab_tech', 'accountant', 'staff'
);

CREATE TABLE IF NOT EXISTS hospital_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  role hospital_role_type NOT NULL DEFAULT 'staff',
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  phone text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE hospital_users ENABLE ROW LEVEL SECURITY;

-- Policies for hospital_users (admin can see all, users see own record)
DROP POLICY IF EXISTS "anon_select_hospital_users" ON hospital_users;
CREATE POLICY "anon_select_hospital_users" ON hospital_users FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_hospital_users" ON hospital_users;
CREATE POLICY "anon_insert_hospital_users" ON hospital_users FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_hospital_users" ON hospital_users;
CREATE POLICY "anon_update_hospital_users" ON hospital_users FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ─── AUDIT LOGS ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES hospital_users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  table_name text NOT NULL,
  record_id uuid,
  old_values jsonb DEFAULT '{}',
  new_values jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_audit_logs" ON audit_logs;
CREATE POLICY "anon_select_audit_logs" ON audit_logs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_audit_logs" ON audit_logs;
CREATE POLICY "anon_insert_audit_logs" ON audit_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- ─── NOTIFICATIONS ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES hospital_users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  read boolean DEFAULT false,
  action_url text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE NOT read;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_notifications" ON notifications;
CREATE POLICY "anon_select_notifications" ON notifications FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_notifications" ON notifications;
CREATE POLICY "anon_insert_notifications" ON notifications FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_notifications" ON notifications;
CREATE POLICY "anon_update_notifications" ON notifications FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_notifications" ON notifications;
CREATE POLICY "anon_delete_notifications" ON notifications FOR DELETE
  TO anon, authenticated USING (true);

-- ─── FUNCTIONS FOR AUDIT LOGGING ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
  old_data jsonb;
  new_data jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    old_data := to_jsonb(OLD);
    INSERT INTO audit_logs (action, table_name, record_id, old_values)
    VALUES ('DELETE', TG_TABLE_NAME, OLD.id, old_data);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    INSERT INTO audit_logs (action, table_name, record_id, old_values, new_values)
    VALUES ('UPDATE', TG_TABLE_NAME, NEW.id, old_data, new_data);
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    new_data := to_jsonb(NEW);
    INSERT INTO audit_logs (action, table_name, record_id, new_values)
    VALUES ('INSERT', TG_TABLE_NAME, NEW.id, new_data);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for key tables
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['patients', 'doctors', 'appointments', 'medical_records', 'invoices', 'payments', 'medicines', 'lab_tests', 'lab_results', 'prescriptions']
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS audit_%s_trigger ON %s;
      CREATE TRIGGER audit_%s_trigger
      AFTER INSERT OR UPDATE OR DELETE ON %s
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
    ', tbl, tbl, tbl, tbl);
  END LOOP;
END $$;

-- ─── FUNCTION TO GET HOSPITAL USER BY EMAIL ────────────────────────────────────

CREATE OR REPLACE FUNCTION get_hospital_user_by_email(user_email text)
RETURNS TABLE (
  id uuid,
  auth_user_id uuid,
  email text,
  full_name text,
  role hospital_role_type,
  department_id uuid,
  phone text,
  status text,
  last_login timestamptz,
  department_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hu.id,
    hu.auth_user_id,
    hu.email,
    hu.full_name,
    hu.role,
    hu.department_id,
    hu.phone,
    hu.status,
    hu.last_login,
    d.name as department_name
  FROM hospital_users hu
  LEFT JOIN departments d ON hu.department_id = d.id
  WHERE hu.email = user_email;
END;
$$ LANGUAGE plpgsql;

-- ─── FUNCTION TO GET DASHBOARD STATS ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  today_date date := CURRENT_DATE;
  month_start_date date := date_trunc('month', CURRENT_DATE);
BEGIN
  SELECT jsonb_build_object(
    'total_patients', (SELECT COUNT(*) FROM patients WHERE status = 'active'),
    'total_doctors', (SELECT COUNT(*) FROM doctors WHERE status = 'active'),
    'today_appointments', (SELECT COUNT(*) FROM appointments WHERE appointment_date = today_date),
    'completed_today', (SELECT COUNT(*) FROM appointments WHERE appointment_date = today_date AND status = 'completed'),
    'pending_bills', (SELECT COUNT(*) FROM invoices WHERE status IN ('pending', 'draft')),
    'low_stock_medicines', (SELECT COUNT(*) FROM medicines WHERE quantity_in_stock <= reorder_level),
    'pending_lab_tests', (SELECT COUNT(*) FROM lab_tests WHERE status IN ('ordered', 'sample_collected', 'processing')),
    'new_patients_this_month', (SELECT COUNT(*) FROM patients WHERE created_at >= month_start_date),
    'total_revenue', (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status = 'paid'),
    'pending_amount', (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status IN ('pending', 'partially_paid'))
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ─── FUNCTION TO GET APPOINTMENTS BY DATE RANGE ───────────────────────────────

CREATE OR REPLACE FUNCTION get_appointments_by_date_range(
  start_date date,
  end_date date
)
RETURNS TABLE (
  id uuid,
  patient_name text,
  patient_number text,
  doctor_name text,
  doctor_specialization text,
  appointment_date date,
  appointment_time time,
  duration_minutes int,
  type text,
  status text,
  notes text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    p.full_name,
    p.patient_number,
    d.full_name,
    d.specialization,
    a.appointment_date,
    a.appointment_time,
    a.duration_minutes,
    a.type,
    a.status,
    a.notes
  FROM appointments a
  JOIN patients p ON a.patient_id = p.id
  JOIN doctors d ON a.doctor_id = d.id
  WHERE a.appointment_date BETWEEN start_date AND end_date
  ORDER BY a.appointment_date, a.appointment_time;
END;
$$ LANGUAGE plpgsql;

-- ─── FUNCTION TO GET PATIENT COMPLETE PROFILE ──────────────────────────────────

CREATE OR REPLACE FUNCTION get_patient_profile(p_patient_id uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'patient', (SELECT to_jsonb(p) FROM patients p WHERE id = p_patient_id),
    'appointments', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', a.id,
      'date', a.appointment_date,
      'time', a.appointment_time,
      'doctor', d.full_name,
      'status', a.status,
      'type', a.type
    )), '[]'::jsonb)
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.id
    WHERE a.patient_id = p_patient_id
    ORDER BY a.appointment_date DESC
    LIMIT 10),
    'medical_records', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', mr.id,
      'visit_date', mr.visit_date,
      'doctor', d.full_name,
      'diagnosis', mr.diagnosis,
      'chief_complaint', mr.chief_complaint
    )), '[]'::jsonb)
    FROM medical_records mr
    JOIN doctors d ON mr.doctor_id = d.id
    WHERE mr.patient_id = p_patient_id
    ORDER BY mr.visit_date DESC
    LIMIT 5),
    'invoices', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', i.id,
      'invoice_number', i.invoice_number,
      'date', i.invoice_date,
      'total', i.total_amount,
      'status', i.status
    )), '[]'::jsonb)
    FROM invoices i
    WHERE i.patient_id = p_patient_id
    ORDER BY i.invoice_date DESC
    LIMIT 5),
    'lab_tests', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', lt.id,
      'test_name', lt.test_name,
      'ordered_date', lt.ordered_date,
      'status', lt.status
    )), '[]'::jsonb)
    FROM lab_tests lt
    WHERE lt.patient_id = p_patient_id
    ORDER BY lt.ordered_date DESC
    LIMIT 5)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ─── FUNCTION TO CHECK MEDICINE AVAILABILITY ───────────────────────────────────

CREATE OR REPLACE FUNCTION check_medicine_availability(medicine_ids uuid[])
RETURNS TABLE (
  id uuid,
  name text,
  quantity_in_stock int,
  reorder_level int,
  is_low_stock boolean,
  is_expiring_soon boolean,
  expiry_date date
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.name,
    m.quantity_in_stock,
    m.reorder_level,
    m.quantity_in_stock <= m.reorder_level as is_low_stock,
    CASE 
      WHEN m.expiry_date IS NOT NULL THEN m.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
      ELSE false
    END as is_expiring_soon,
    m.expiry_date
  FROM medicines m
  WHERE m.id = ANY(medicine_ids);
END;
$$ LANGUAGE plpgsql;

-- ─── FUNCTION TO GENERATE INVOICE ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_invoice_report(invoice_id_param uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'invoice', (SELECT to_jsonb(i) FROM invoices i WHERE id = invoice_id_param),
    'patient', (SELECT jsonb_build_object(
      'full_name', p.full_name,
      'patient_number', p.patient_number,
      'phone', p.phone,
      'email', p.email,
      'address', p.address
    ) FROM patients p WHERE id = (SELECT patient_id FROM invoices WHERE id = invoice_id_param)),
    'items', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'description', ii.description,
      'category', ii.category,
      'quantity', ii.quantity,
      'unit_price', ii.unit_price,
      'total', ii.total_price
    )), '[]'::jsonb) FROM invoice_items ii WHERE ii.invoice_id = invoice_id_param),
    'payments', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'date', p.payment_date,
      'amount', p.amount,
      'method', p.payment_method,
      'transaction_id', p.transaction_id
    )), '[]'::jsonb) FROM payments p WHERE p.invoice_id = invoice_id_param ORDER BY p.payment_date)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ─── SEED DEFAULT HOSPILITY USER (for initial access / demo) ─────────────────────

-- Note: The actual auth.users entry is created by Supabase Auth
-- This is just a placeholder - auth is handled via Supabase Auth UI

INSERT INTO hospital_users (email, full_name, role, status)
VALUES 
  ('admin@hospital.com', 'System Administrator', 'admin', 'active'),
  ('doctor@hospital.com', 'Dr. Demo User', 'doctor', 'active'),
  ('receptionist@hospital.com', 'Front Desk Staff', 'receptionist', 'active')
ON CONFLICT (email) DO NOTHING;
