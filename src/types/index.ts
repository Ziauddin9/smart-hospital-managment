export interface Department {
  id: string;
  name: string;
  description?: string;
  head_doctor_id?: string;
  created_at: string;
}

export interface Doctor {
  id: string;
  full_name: string;
  specialization: string;
  department_id?: string;
  email?: string;
  phone?: string;
  license_number?: string;
  qualification?: string;
  experience_years: number;
  availability_days: string[];
  status: 'active' | 'inactive' | 'on_leave';
  created_at: string;
  departments?: Department;
}

export interface Staff {
  id: string;
  full_name: string;
  role: string;
  department_id?: string;
  email?: string;
  phone?: string;
  status: 'active' | 'inactive';
  created_at: string;
  departments?: Department;
}

export interface Patient {
  id: string;
  patient_number: string;
  full_name: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  blood_group?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  insurance_provider?: string;
  insurance_number?: string;
  allergies?: string;
  status: 'active' | 'inactive' | 'deceased';
  created_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  type: 'consultation' | 'follow_up' | 'emergency' | 'procedure' | 'checkup';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  created_at: string;
  patients?: Patient;
  doctors?: Doctor;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  visit_date: string;
  chief_complaint?: string;
  diagnosis?: string;
  treatment_plan?: string;
  prescription_notes?: string;
  vital_signs: {
    blood_pressure?: string;
    temperature?: string;
    pulse?: string;
    weight?: string;
    height?: string;
    oxygen_saturation?: string;
  };
  notes?: string;
  created_at: string;
  patients?: Patient;
  doctors?: Doctor;
}

export interface Medicine {
  id: string;
  name: string;
  generic_name?: string;
  category?: string;
  manufacturer?: string;
  batch_number?: string;
  quantity_in_stock: number;
  unit: string;
  unit_price: number;
  reorder_level: number;
  expiry_date?: string;
  created_at: string;
}

export interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  medical_record_id?: string;
  prescribed_date: string;
  status: 'pending' | 'dispensed' | 'cancelled';
  notes?: string;
  created_at: string;
  patients?: Patient;
  doctors?: Doctor;
  prescription_items?: PrescriptionItem[];
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  medicine_id: string;
  dosage?: string;
  frequency?: string;
  duration_days?: number;
  quantity: number;
  instructions?: string;
  created_at: string;
  medicines?: Medicine;
}

export interface LabTest {
  id: string;
  patient_id: string;
  doctor_id: string;
  test_name: string;
  test_type?: string;
  ordered_date: string;
  status: 'ordered' | 'sample_collected' | 'processing' | 'completed' | 'cancelled';
  priority: 'routine' | 'urgent' | 'stat';
  notes?: string;
  created_at: string;
  patients?: Patient;
  doctors?: Doctor;
  lab_results?: LabResult[];
}

export interface LabResult {
  id: string;
  lab_test_id: string;
  technician_name?: string;
  result_value?: string;
  result_unit?: string;
  reference_range?: string;
  result_date: string;
  remarks?: string;
  status: 'normal' | 'abnormal' | 'critical';
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  patient_id: string;
  appointment_id?: string;
  invoice_date: string;
  due_date?: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  status: 'draft' | 'pending' | 'paid' | 'partially_paid' | 'cancelled';
  notes?: string;
  created_at: string;
  patients?: Patient;
  invoice_items?: InvoiceItem[];
  payments?: Payment[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  category: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  payment_date: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'insurance' | 'bank_transfer' | 'online';
  transaction_id?: string;
  notes?: string;
  created_at: string;
}

// New authentication types

export type HospitalRole = 'admin' | 'doctor' | 'nurse' | 'pharmacist' | 'receptionist' | 'lab_tech' | 'accountant' | 'staff';

export interface HospitalUser {
  id: string;
  auth_user_id?: string;
  email: string;
  full_name: string;
  role: HospitalRole;
  department_id?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  last_login?: string;
  created_at: string;
  updated_at: string;
  departments?: Department;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  table_name: string;
  record_id?: string;
  old_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  hospital_users?: HospitalUser;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message?: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  action_url?: string;
  created_at: string;
}

export interface DashboardStats {
  total_patients: number;
  total_doctors: number;
  today_appointments: number;
  completed_today: number;
  pending_bills: number;
  low_stock_medicines: number;
  pending_lab_tests: number;
  new_patients_this_month: number;
  total_revenue: number;
  pending_amount: number;
}

export interface PatientProfile {
  patient: Patient;
  appointments: Array<{
    id: string;
    date: string;
    time: string;
    doctor: string;
    status: string;
    type: string;
  }>;
  medical_records: Array<{
    id: string;
    visit_date: string;
    doctor: string;
    diagnosis?: string;
    chief_complaint?: string;
  }>;
  invoices: Array<{
    id: string;
    invoice_number: string;
    date: string;
    total: number;
    status: string;
  }>;
  lab_tests: Array<{
    id: string;
    test_name: string;
    ordered_date: string;
    status: string;
  }>;
}
