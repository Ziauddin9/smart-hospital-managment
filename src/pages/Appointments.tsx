import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Appointment, Patient, Doctor } from '../types';
import Modal from '../components/Modal';
import { Plus, Search, Edit2, Trash2, Calendar, Clock, AlertCircle } from 'lucide-react';

const typeLabels: Record<string, string> = {
  consultation: 'Consultation',
  follow_up: 'Follow-up',
  emergency: 'Emergency',
  procedure: 'Procedure',
  checkup: 'Check-up',
};

const statusColors: Record<string, string> = {
  scheduled: 'bg-sky-100 text-sky-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-amber-100 text-amber-700',
};

const emptyForm = {
  patient_id: '',
  doctor_id: '',
  appointment_date: '',
  appointment_time: '',
  duration_minutes: 30,
  type: 'consultation',
  status: 'scheduled',
  notes: '',
};

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const [{ data: appts }, { data: pts }, { data: docs }] = await Promise.all([
      supabase.from('appointments')
        .select('*, patients(full_name, patient_number), doctors(full_name, specialization)')
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false }),
      supabase.from('patients').select('id, full_name, patient_number').eq('status', 'active').order('full_name'),
      supabase.from('doctors').select('id, full_name, specialization').eq('status', 'active').order('full_name'),
    ]);
    setAppointments((appts ?? []) as unknown as Appointment[]);
    setPatients(pts ?? []);
    setDoctors((docs ?? []) as unknown as Doctor[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = appointments.filter(a => {
    const matchSearch =
      a.patients?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.doctors?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.patients?.patient_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, appointment_date: new Date().toISOString().split('T')[0] });
    setError('');
    setShowModal(true);
  };

  const openEdit = (appt: Appointment) => {
    setEditing(appt);
    setForm({
      patient_id: appt.patient_id,
      doctor_id: appt.doctor_id,
      appointment_date: appt.appointment_date,
      appointment_time: appt.appointment_time.slice(0, 5),
      duration_minutes: appt.duration_minutes,
      type: appt.type,
      status: appt.status,
      notes: appt.notes ?? '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.patient_id) { setError('Please select a patient.'); return; }
    if (!form.doctor_id) { setError('Please select a doctor.'); return; }
    if (!form.appointment_date) { setError('Date is required.'); return; }
    if (!form.appointment_time) { setError('Time is required.'); return; }
    setSaving(true);
    setError('');
    const payload = { ...form, notes: form.notes || null };
    let err;
    if (editing) {
      ({ error: err } = await supabase.from('appointments').update(payload).eq('id', editing.id));
    } else {
      ({ error: err } = await supabase.from('appointments').insert(payload));
    }
    if (err) { setError(err.message); } else { setShowModal(false); fetchData(); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this appointment?')) return;
    await supabase.from('appointments').delete().eq('id', id);
    fetchData();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await supabase.from('appointments').update({ status }).eq('id', id);
    fetchData();
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient or doctor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input pl-9"
          />
        </div>
        <select
          className="form-select w-40"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          {Object.keys(statusColors).map(s => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="w-4 h-4" /> New Appointment
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-700">All Appointments</h3>
          <span className="text-xs text-slate-400">{filtered.length} records</span>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-slate-50 rounded-lg animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Calendar className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No appointments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="table-th">Patient</th>
                  <th className="table-th">Doctor</th>
                  <th className="table-th">Date & Time</th>
                  <th className="table-th">Type</th>
                  <th className="table-th">Duration</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(appt => (
                  <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="table-td">
                      <p className="font-medium text-slate-900">{appt.patients?.full_name}</p>
                      <p className="text-xs text-slate-400">{appt.patients?.patient_number}</p>
                    </td>
                    <td className="table-td">
                      <p className="font-medium text-slate-900">{appt.doctors?.full_name}</p>
                      <p className="text-xs text-slate-400">{appt.doctors?.specialization}</p>
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-300" />
                        <p>{new Date(appt.appointment_date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-300" />
                        <p className="text-xs text-slate-400">{appt.appointment_time?.slice(0, 5)}</p>
                      </div>
                    </td>
                    <td className="table-td">{typeLabels[appt.type]}</td>
                    <td className="table-td text-slate-500">{appt.duration_minutes} min</td>
                    <td className="table-td">
                      <select
                        value={appt.status}
                        onChange={e => handleStatusChange(appt.id, e.target.value)}
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 outline-none cursor-pointer ${statusColors[appt.status]}`}
                      >
                        {Object.keys(statusColors).map(s => (
                          <option key={s} value={s}>{s.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </td>
                    <td className="table-td">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(appt)} className="p-1.5 hover:bg-sky-50 rounded-lg text-slate-400 hover:text-sky-600 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(appt.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title={editing ? 'Edit Appointment' : 'New Appointment'} onClose={() => setShowModal(false)} size="lg">
          <div className="p-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="form-label">Patient *</label>
                <select className="form-select" value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))}>
                  <option value="">Select patient</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.patient_number})</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="form-label">Doctor *</label>
                <select className="form-select" value={form.doctor_id} onChange={e => setForm(f => ({ ...f, doctor_id: e.target.value }))}>
                  <option value="">Select doctor</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name} — {d.specialization}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Date *</label>
                <input type="date" className="form-input" value={form.appointment_date} onChange={e => setForm(f => ({ ...f, appointment_date: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Time *</label>
                <input type="time" className="form-input" value={form.appointment_time} onChange={e => setForm(f => ({ ...f, appointment_time: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Duration (minutes)</label>
                <input type="number" min={15} step={15} className="form-input" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: +e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Type</label>
                <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {Object.entries(typeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {Object.keys(statusColors).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="form-label">Notes</label>
                <textarea className="form-input resize-none" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Book Appointment'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
