/*
# Smart Hospital Management System - Complete Schema

## Overview
This migration creates the full database schema for a Smart Hospital Management System.
All tables use RLS with anon+authenticated access (single-tenant hospital admin app, no per-user sign-in).

## New Tables

### 1. departments
Represents hospital departments (Cardiology, Neurology, Emergency, etc.)
- id, name, description, head_doctor_id (nullable FK to doctors), created_at

### 2. doctors
Doctor profiles including credentials and availability.
- id, full_name, specialization, department_id (FK), email, phone, license_number,
  qualification, experience_years, availability_days (text[]), status, avatar_url, created_at

### 3. staff
Non-doctor hospital staff (nurses, admins, lab technicians).
- id, full_name, role, department_id (FK), email, phone, status, created_at

### 4. patients
Patient registration records.
- id, patient_number (auto-generated unique), full_name, date_of_birth, gender,
  blood_group, phone, email, address, emergency_contact_name, emergency_contact_phone,
  insurance_provider, insurance_number, allergies, status, created_at

### 5. appointments
Appointment scheduling between patients and doctors.
- id, patient_id (FK), doctor_id (FK), appointment_date, appointment_time,
  duration_minutes, type, status, notes, created_at

### 6. medical_records
Electronic medical records (EMR) per patient visit.
- id, patient_id (FK), doctor_id (FK), appointment_id (FK nullable),
  visit_date, chief_complaint, diagnosis, treatment_plan, prescription_notes,
  vital_signs (jsonb: bp, temp, pulse, weight, height), notes, created_at

### 7. medicines
Pharmacy medicine inventory.
- id, name, generic_name, category, manufacturer, batch_number,
  quantity_in_stock, unit, unit_price, reorder_level, expiry_date, created_at

### 8. prescriptions
Prescriptions linked to medical records.
- id, patient_id (FK), doctor_id (FK), medical_record_id (FK nullable),
  prescribed_date, status, notes, created_at

### 9. prescription_items
Individual medicines in a prescription.
- id, prescription_id (FK), medicine_id (FK), dosage, frequency, duration_days,
  quantity, instructions, created_at

### 10. lab_tests
Lab test orders.
- id, patient_id (FK), doctor_id (FK), test_name, test_type, ordered_date,
  status, priority, notes, created_at

### 11. lab_results
Results for lab tests.
- id, lab_test_id (FK), technician_name, result_value, result_unit,
  reference_range, result_date, remarks, status, created_at

### 12. invoices
Billing invoices per patient.
- id, invoice_number (auto-generated), patient_id (FK), appointment_id (FK nullable),
  invoice_date, due_date, subtotal, tax_amount, discount_amount, total_amount,
  status (draft/pending/paid/cancelled), notes, created_at

### 13. invoice_items
Line items on an invoice.
- id, invoice_id (FK), description, category, quantity, unit_price, total_price, created_at

### 14. payments
Payment records against invoices.
- id, invoice_id (FK), payment_date, amount, payment_method, transaction_id,
  notes, created_at

## Security
- RLS enabled on all tables.
- All policies use TO anon, authenticated (single-tenant, no user sign-in screen).
- USING (true) / WITH CHECK (true) is intentional for this shared hospital dashboard.

## Important Notes
1. patient_number uses a sequence for auto-increment: HOSP-00001, HOSP-00002, etc.
2. invoice_number uses a sequence: INV-2024-00001.
3. departments.head_doctor_id has a deferred FK to doctors to avoid circular dependency.
4. All monetary amounts stored as numeric(12,2).
5. availability_days on doctors stores array of day names.
*/

-- ─── SEQUENCES ───────────────────────────────────────────────────────────────

CREATE SEQUENCE IF NOT EXISTS patient_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

-- ─── DEPARTMENTS ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_departments" ON departments;
CREATE POLICY "anon_select_departments" ON departments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_departments" ON departments;
CREATE POLICY "anon_insert_departments" ON departments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_departments" ON departments;
CREATE POLICY "anon_update_departments" ON departments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_departments" ON departments;
CREATE POLICY "anon_delete_departments" ON departments FOR DELETE TO anon, authenticated USING (true);

-- ─── DOCTORS ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  specialization text NOT NULL,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  email text UNIQUE,
  phone text,
  license_number text,
  qualification text,
  experience_years int DEFAULT 0,
  availability_days text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','on_leave')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_doctors" ON doctors;
CREATE POLICY "anon_select_doctors" ON doctors FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_doctors" ON doctors;
CREATE POLICY "anon_insert_doctors" ON doctors FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_doctors" ON doctors;
CREATE POLICY "anon_update_doctors" ON doctors FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_doctors" ON doctors;
CREATE POLICY "anon_delete_doctors" ON doctors FOR DELETE TO anon, authenticated USING (true);

-- Add head_doctor_id to departments after doctors table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'departments' AND column_name = 'head_doctor_id'
  ) THEN
    ALTER TABLE departments ADD COLUMN head_doctor_id uuid REFERENCES doctors(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ─── STAFF ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  role text NOT NULL,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  email text UNIQUE,
  phone text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_staff" ON staff;
CREATE POLICY "anon_select_staff" ON staff FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_staff" ON staff;
CREATE POLICY "anon_insert_staff" ON staff FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_staff" ON staff;
CREATE POLICY "anon_update_staff" ON staff FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_staff" ON staff;
CREATE POLICY "anon_delete_staff" ON staff FOR DELETE TO anon, authenticated USING (true);

-- ─── PATIENTS ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_number text UNIQUE NOT NULL DEFAULT 'HOSP-' || LPAD(nextval('patient_number_seq')::text, 5, '0'),
  full_name text NOT NULL,
  date_of_birth date,
  gender text CHECK (gender IN ('male','female','other')),
  blood_group text CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  phone text,
  email text,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  insurance_provider text,
  insurance_number text,
  allergies text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','deceased')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_patients" ON patients;
CREATE POLICY "anon_select_patients" ON patients FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_patients" ON patients;
CREATE POLICY "anon_insert_patients" ON patients FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_patients" ON patients;
CREATE POLICY "anon_update_patients" ON patients FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_patients" ON patients;
CREATE POLICY "anon_delete_patients" ON patients FOR DELETE TO anon, authenticated USING (true);

-- ─── APPOINTMENTS ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  duration_minutes int DEFAULT 30,
  type text NOT NULL DEFAULT 'consultation' CHECK (type IN ('consultation','follow_up','emergency','procedure','checkup')),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','confirmed','completed','cancelled','no_show')),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_appointments" ON appointments;
CREATE POLICY "anon_select_appointments" ON appointments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_appointments" ON appointments;
CREATE POLICY "anon_insert_appointments" ON appointments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_appointments" ON appointments;
CREATE POLICY "anon_update_appointments" ON appointments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_appointments" ON appointments;
CREATE POLICY "anon_delete_appointments" ON appointments FOR DELETE TO anon, authenticated USING (true);

-- ─── MEDICAL RECORDS ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  visit_date date NOT NULL DEFAULT CURRENT_DATE,
  chief_complaint text,
  diagnosis text,
  treatment_plan text,
  prescription_notes text,
  vital_signs jsonb DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_medical_records" ON medical_records;
CREATE POLICY "anon_select_medical_records" ON medical_records FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_medical_records" ON medical_records;
CREATE POLICY "anon_insert_medical_records" ON medical_records FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_medical_records" ON medical_records;
CREATE POLICY "anon_update_medical_records" ON medical_records FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_medical_records" ON medical_records;
CREATE POLICY "anon_delete_medical_records" ON medical_records FOR DELETE TO anon, authenticated USING (true);

-- ─── MEDICINES ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  generic_name text,
  category text,
  manufacturer text,
  batch_number text,
  quantity_in_stock int NOT NULL DEFAULT 0,
  unit text DEFAULT 'tablet',
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  reorder_level int DEFAULT 10,
  expiry_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_medicines" ON medicines;
CREATE POLICY "anon_select_medicines" ON medicines FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_medicines" ON medicines;
CREATE POLICY "anon_insert_medicines" ON medicines FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_medicines" ON medicines;
CREATE POLICY "anon_update_medicines" ON medicines FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_medicines" ON medicines;
CREATE POLICY "anon_delete_medicines" ON medicines FOR DELETE TO anon, authenticated USING (true);

-- ─── PRESCRIPTIONS ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  medical_record_id uuid REFERENCES medical_records(id) ON DELETE SET NULL,
  prescribed_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','dispensed','cancelled')),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_prescriptions" ON prescriptions;
CREATE POLICY "anon_select_prescriptions" ON prescriptions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_prescriptions" ON prescriptions;
CREATE POLICY "anon_insert_prescriptions" ON prescriptions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_prescriptions" ON prescriptions;
CREATE POLICY "anon_update_prescriptions" ON prescriptions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_prescriptions" ON prescriptions;
CREATE POLICY "anon_delete_prescriptions" ON prescriptions FOR DELETE TO anon, authenticated USING (true);

-- ─── PRESCRIPTION ITEMS ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS prescription_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  medicine_id uuid NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  dosage text,
  frequency text,
  duration_days int,
  quantity int DEFAULT 1,
  instructions text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_prescription_items" ON prescription_items;
CREATE POLICY "anon_select_prescription_items" ON prescription_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_prescription_items" ON prescription_items;
CREATE POLICY "anon_insert_prescription_items" ON prescription_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_prescription_items" ON prescription_items;
CREATE POLICY "anon_update_prescription_items" ON prescription_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_prescription_items" ON prescription_items;
CREATE POLICY "anon_delete_prescription_items" ON prescription_items FOR DELETE TO anon, authenticated USING (true);

-- ─── LAB TESTS ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  test_name text NOT NULL,
  test_type text,
  ordered_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'ordered' CHECK (status IN ('ordered','sample_collected','processing','completed','cancelled')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('routine','urgent','stat')),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lab_tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_lab_tests" ON lab_tests;
CREATE POLICY "anon_select_lab_tests" ON lab_tests FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_lab_tests" ON lab_tests;
CREATE POLICY "anon_insert_lab_tests" ON lab_tests FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_lab_tests" ON lab_tests;
CREATE POLICY "anon_update_lab_tests" ON lab_tests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_lab_tests" ON lab_tests;
CREATE POLICY "anon_delete_lab_tests" ON lab_tests FOR DELETE TO anon, authenticated USING (true);

-- ─── LAB RESULTS ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lab_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_test_id uuid NOT NULL REFERENCES lab_tests(id) ON DELETE CASCADE,
  technician_name text,
  result_value text,
  result_unit text,
  reference_range text,
  result_date date NOT NULL DEFAULT CURRENT_DATE,
  remarks text,
  status text NOT NULL DEFAULT 'normal' CHECK (status IN ('normal','abnormal','critical')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_lab_results" ON lab_results;
CREATE POLICY "anon_select_lab_results" ON lab_results FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_lab_results" ON lab_results;
CREATE POLICY "anon_insert_lab_results" ON lab_results FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_lab_results" ON lab_results;
CREATE POLICY "anon_update_lab_results" ON lab_results FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_lab_results" ON lab_results;
CREATE POLICY "anon_delete_lab_results" ON lab_results FOR DELETE TO anon, authenticated USING (true);

-- ─── INVOICES ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL DEFAULT 'INV-' || to_char(now(), 'YYYY') || '-' || LPAD(nextval('invoice_number_seq')::text, 5, '0'),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  tax_amount numeric(12,2) NOT NULL DEFAULT 0,
  discount_amount numeric(12,2) NOT NULL DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('draft','pending','paid','partially_paid','cancelled')),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_invoices" ON invoices;
CREATE POLICY "anon_select_invoices" ON invoices FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_invoices" ON invoices;
CREATE POLICY "anon_insert_invoices" ON invoices FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_invoices" ON invoices;
CREATE POLICY "anon_update_invoices" ON invoices FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_invoices" ON invoices;
CREATE POLICY "anon_delete_invoices" ON invoices FOR DELETE TO anon, authenticated USING (true);

-- ─── INVOICE ITEMS ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  category text DEFAULT 'service',
  quantity int NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  total_price numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_invoice_items" ON invoice_items;
CREATE POLICY "anon_select_invoice_items" ON invoice_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_invoice_items" ON invoice_items;
CREATE POLICY "anon_insert_invoice_items" ON invoice_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_invoice_items" ON invoice_items;
CREATE POLICY "anon_update_invoice_items" ON invoice_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_invoice_items" ON invoice_items;
CREATE POLICY "anon_delete_invoice_items" ON invoice_items FOR DELETE TO anon, authenticated USING (true);

-- ─── PAYMENTS ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric(12,2) NOT NULL,
  payment_method text NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash','card','insurance','bank_transfer','online')),
  transaction_id text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_payments" ON payments;
CREATE POLICY "anon_select_payments" ON payments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_payments" ON payments;
CREATE POLICY "anon_insert_payments" ON payments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_payments" ON payments;
CREATE POLICY "anon_update_payments" ON payments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_payments" ON payments;
CREATE POLICY "anon_delete_payments" ON payments FOR DELETE TO anon, authenticated USING (true);

-- ─── SEED DATA ────────────────────────────────────────────────────────────────

INSERT INTO departments (name, description) VALUES
  ('Emergency', 'Emergency and trauma care department'),
  ('Cardiology', 'Heart and cardiovascular disease treatment'),
  ('Neurology', 'Brain and nervous system disorders'),
  ('Orthopedics', 'Bone, joint, and muscle treatment'),
  ('Pediatrics', 'Medical care for infants and children'),
  ('Oncology', 'Cancer diagnosis and treatment'),
  ('Radiology', 'Medical imaging and diagnostics'),
  ('Laboratory', 'Clinical pathology and diagnostics')
ON CONFLICT DO NOTHING;

INSERT INTO medicines (name, generic_name, category, manufacturer, batch_number, quantity_in_stock, unit, unit_price, reorder_level, expiry_date) VALUES
  ('Paracetamol 500mg', 'Acetaminophen', 'Analgesic', 'PharmaCo', 'BT001', 500, 'tablet', 0.50, 50, '2026-12-31'),
  ('Amoxicillin 250mg', 'Amoxicillin', 'Antibiotic', 'MediGen', 'BT002', 200, 'capsule', 1.20, 30, '2026-06-30'),
  ('Metformin 500mg', 'Metformin HCl', 'Antidiabetic', 'DiabCare', 'BT003', 350, 'tablet', 0.80, 40, '2026-09-30'),
  ('Atorvastatin 20mg', 'Atorvastatin', 'Statin', 'HeartCare', 'BT004', 150, 'tablet', 2.50, 20, '2027-03-31'),
  ('Omeprazole 20mg', 'Omeprazole', 'Antacid', 'GastroCare', 'BT005', 250, 'capsule', 1.80, 25, '2026-11-30'),
  ('Ibuprofen 400mg', 'Ibuprofen', 'NSAID', 'PharmaCo', 'BT006', 400, 'tablet', 0.60, 50, '2026-10-31'),
  ('Lisinopril 10mg', 'Lisinopril', 'ACE Inhibitor', 'CardioGen', 'BT007', 180, 'tablet', 1.50, 25, '2027-01-31'),
  ('Salbutamol Inhaler', 'Albuterol', 'Bronchodilator', 'RespiraCo', 'BT008', 80, 'inhaler', 12.00, 10, '2026-08-31')
ON CONFLICT DO NOTHING;
