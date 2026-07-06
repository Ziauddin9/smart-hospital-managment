import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MedicalRecord, Patient, Doctor } from '../types';
import Modal from '../components/Modal';
import { Plus, Search, Eye, Edit2, Trash2, FileText, AlertCircle, Activity } from 'lucide-react';

const emptyForm = {
  patient_id: '',
  doctor_id: '',
  visit_date: '',
  chief_complaint: '',
  diagnosis: '',
  treatment_plan: '',
  prescription_notes: '',
  notes: '',
  bp: '',
  temperature: '',
  pulse: '',
  weight: '',
  height: '',
  oxygen_saturation: '',
};

export default function MedicalRecords() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<MedicalRecord | null>(null);
  const [editing, setEditing] = useState<MedicalRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const [{ data: recs }, { data: pts }, { data: docs }] = await Promise.all([
      supabase.from('medical_records')
        .select('*, patients(full_name, patient_number), doctors(full_name, specialization)')
        .order('visit_date', { ascending: false }),
      supabase.from('patients').select('id, full_name, patient_number').eq('status', 'active').order('full_name'),
      supabase.from('doctors').select('id, full_name, specialization').eq('status', 'active').order('full_name'),
    ]);
    setRecords((recs ?? []) as unknown as MedicalRecord[]);
    setPatients(pts ?? []);
    setDoctors((docs ?? []) as unknown as Doctor[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = records.filter(r =>
    r.patients?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.doctors?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.patients?.patient_number?.toLowerCase().includes(search.toLowerCase()) ||
    (r.diagnosis ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, visit_date: new Date().toISOString().split('T')[0] });
    setError('');
    setShowModal(true);
  };

  const openEdit = (rec: MedicalRecord) => {
    setEditing(rec);
    setForm({
      patient_id: rec.patient_id,
      doctor_id: rec.doctor_id,
      visit_date: rec.visit_date,
      chief_complaint: rec.chief_complaint ?? '',
      diagnosis: rec.diagnosis ?? '',
      treatment_plan: rec.treatment_plan ?? '',
      prescription_notes: rec.prescription_notes ?? '',
      notes: rec.notes ?? '',
      bp: rec.vital_signs?.blood_pressure ?? '',
      temperature: rec.vital_signs?.temperature ?? '',
      pulse: rec.vital_signs?.pulse ?? '',
      weight: rec.vital_signs?.weight ?? '',
      height: rec.vital_signs?.height ?? '',
      oxygen_saturation: rec.vital_signs?.oxygen_saturation ?? '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.patient_id) { setError('Please select a patient.'); return; }
    if (!form.doctor_id) { setError('Please select a doctor.'); return; }
    if (!form.visit_date) { setError('Visit date is required.'); return; }
    setSaving(true);
    setError('');
    const payload = {
      patient_id: form.patient_id,
      doctor_id: form.doctor_id,
      visit_date: form.visit_date,
      chief_complaint: form.chief_complaint || null,
      diagnosis: form.diagnosis || null,
      treatment_plan: form.treatment_plan || null,
      prescription_notes: form.prescription_notes || null,
      notes: form.notes || null,
      vital_signs: {
        blood_pressure: form.bp || null,
        temperature: form.temperature || null,
        pulse: form.pulse || null,
        weight: form.weight || null,
        height: form.height || null,
        oxygen_saturation: form.oxygen_saturation || null,
      },
    };
    let err;
    if (editing) {
      ({ error: err } = await supabase.from('medical_records').update(payload).eq('id', editing.id));
    } else {
      ({ error: err } = await supabase.from('medical_records').insert(payload));
    }
    if (err) { setError(err.message); } else { setShowModal(false); fetchData(); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this medical record?')) return;
    await supabase.from('medical_records').delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient, doctor, or diagnosis..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input pl-9"
          />
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Record
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-700">Medical Records</h3>
          <span className="text-xs text-slate-400">{filtered.length} records</span>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-slate-50 rounded-lg animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <FileText className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No medical records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="table-th">Patient</th>
                  <th className="table-th">Doctor</th>
                  <th className="table-th">Visit Date</th>
                  <th className="table-th">Chief Complaint</th>
                  <th className="table-th">Diagnosis</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="table-td">
                      <p className="font-medium text-slate-900">{rec.patients?.full_name}</p>
                      <p className="text-xs text-slate-400">{rec.patients?.patient_number}</p>
                    </td>
                    <td className="table-td">
                      <p className="text-sm">{rec.doctors?.full_name}</p>
                      <p className="text-xs text-slate-400">{rec.doctors?.specialization}</p>
                    </td>
                    <td className="table-td">{new Date(rec.visit_date).toLocaleDateString()}</td>
                    <td className="table-td">
                      <p className="text-sm max-w-xs truncate">{rec.chief_complaint ?? '—'}</p>
                    </td>
                    <td className="table-td">
                      <p className="text-sm max-w-xs truncate">{rec.diagnosis ?? '—'}</p>
                    </td>
                    <td className="table-td">
                      <div className="flex gap-1">
                        <button onClick={() => setShowDetail(rec)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openEdit(rec)} className="p-1.5 hover:bg-sky-50 rounded-lg text-slate-400 hover:text-sky-600 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(rec.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors">
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

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal title={editing ? 'Edit Medical Record' : 'New Medical Record'} onClose={() => setShowModal(false)} size="xl">
          <div className="p-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Patient *</label>
                <select className="form-select" value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))}>
                  <option value="">Select patient</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.patient_number})</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Doctor *</label>
                <select className="form-select" value={form.doctor_id} onChange={e => setForm(f => ({ ...f, doctor_id: e.target.value }))}>
                  <option value="">Select doctor</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Visit Date *</label>
                <input type="date" className="form-input" value={form.visit_date} onChange={e => setForm(f => ({ ...f, visit_date: e.target.value }))} />
              </div>
            </div>

            {/* Vital Signs */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-sky-500" />
                <h4 className="text-sm font-semibold text-slate-900">Vital Signs</h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl">
                {[
                  ['Blood Pressure', 'bp', 'e.g. 120/80 mmHg'],
                  ['Temperature', 'temperature', 'e.g. 98.6°F'],
                  ['Pulse Rate', 'pulse', 'e.g. 72 bpm'],
                  ['Weight', 'weight', 'e.g. 70 kg'],
                  ['Height', 'height', 'e.g. 175 cm'],
                  ['O₂ Saturation', 'oxygen_saturation', 'e.g. 98%'],
                ].map(([label, key, placeholder]) => (
                  <div key={key}>
                    <label className="form-label text-xs">{label}</label>
                    <input
                      className="form-input text-xs"
                      placeholder={placeholder}
                      value={form[key as keyof typeof form]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Chief Complaint</label>
                <textarea className="form-input resize-none" rows={3} value={form.chief_complaint} onChange={e => setForm(f => ({ ...f, chief_complaint: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Diagnosis</label>
                <textarea className="form-input resize-none" rows={3} value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Treatment Plan</label>
                <textarea className="form-input resize-none" rows={3} value={form.treatment_plan} onChange={e => setForm(f => ({ ...f, treatment_plan: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Prescription Notes</label>
                <textarea className="form-input resize-none" rows={3} value={form.prescription_notes} onChange={e => setForm(f => ({ ...f, prescription_notes: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <label className="form-label">Additional Notes</label>
                <textarea className="form-input resize-none" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Save Record'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <Modal title="Medical Record Details" onClose={() => setShowDetail(null)} size="xl">
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">{showDetail.patients?.full_name}</h3>
                <p className="text-sm text-slate-400">{showDetail.patients?.patient_number}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-700">{showDetail.doctors?.full_name}</p>
                <p className="text-xs text-slate-400">{new Date(showDetail.visit_date).toLocaleDateString()}</p>
              </div>
            </div>

            {Object.keys(showDetail.vital_signs ?? {}).some(k => showDetail.vital_signs[k as keyof typeof showDetail.vital_signs]) && (
              <div className="p-4 bg-sky-50 rounded-xl">
                <p className="text-xs font-semibold text-sky-700 mb-2 flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> Vital Signs</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(showDetail.vital_signs ?? {}).filter(([, v]) => v).map(([k, v]) => (
                    <div key={k} className="bg-white rounded-lg p-2">
                      <p className="text-xs text-slate-400 capitalize">{k.replace('_', ' ')}</p>
                      <p className="text-sm font-semibold text-slate-900">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ['Chief Complaint', showDetail.chief_complaint],
                ['Diagnosis', showDetail.diagnosis],
                ['Treatment Plan', showDetail.treatment_plan],
                ['Prescription Notes', showDetail.prescription_notes],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label as string} className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
                  <p className="text-sm text-slate-800 leading-relaxed">{value}</p>
                </div>
              ))}
            </div>

            {showDetail.notes && (
              <div className="p-4 bg-amber-50 rounded-xl">
                <p className="text-xs font-semibold text-amber-700 mb-1">Additional Notes</p>
                <p className="text-sm text-amber-800">{showDetail.notes}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
