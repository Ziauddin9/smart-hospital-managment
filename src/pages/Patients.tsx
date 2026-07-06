import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Patient } from '../types';
import Modal from '../components/Modal';
import { Plus, Search, Edit2, Trash2, User, Phone, Mail, Droplets, AlertCircle } from 'lucide-react';

const genderOptions = ['male', 'female', 'other'];
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-slate-100 text-slate-600',
  deceased: 'bg-red-100 text-red-700',
};

const emptyForm = {
  full_name: '',
  date_of_birth: '',
  gender: '',
  blood_group: '',
  phone: '',
  email: '',
  address: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  insurance_provider: '',
  insurance_number: '',
  allergies: '',
  status: 'active',
};

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Patient | null>(null);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchPatients = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });
    setPatients(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchPatients(); }, []);

  const filtered = patients.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.patient_number.toLowerCase().includes(search.toLowerCase()) ||
    (p.phone ?? '').includes(search)
  );

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (patient: Patient) => {
    setEditing(patient);
    setForm({
      full_name: patient.full_name,
      date_of_birth: patient.date_of_birth ?? '',
      gender: patient.gender ?? '',
      blood_group: patient.blood_group ?? '',
      phone: patient.phone ?? '',
      email: patient.email ?? '',
      address: patient.address ?? '',
      emergency_contact_name: patient.emergency_contact_name ?? '',
      emergency_contact_phone: patient.emergency_contact_phone ?? '',
      insurance_provider: patient.insurance_provider ?? '',
      insurance_number: patient.insurance_number ?? '',
      allergies: patient.allergies ?? '',
      status: patient.status,
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) { setError('Full name is required.'); return; }
    setSaving(true);
    setError('');
    const payload = {
      full_name: form.full_name,
      date_of_birth: form.date_of_birth || null,
      gender: form.gender || null,
      blood_group: form.blood_group || null,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
      emergency_contact_name: form.emergency_contact_name || null,
      emergency_contact_phone: form.emergency_contact_phone || null,
      insurance_provider: form.insurance_provider || null,
      insurance_number: form.insurance_number || null,
      allergies: form.allergies || null,
      status: form.status,
    };

    let err;
    if (editing) {
      ({ error: err } = await supabase.from('patients').update(payload).eq('id', editing.id));
    } else {
      ({ error: err } = await supabase.from('patients').insert(payload));
    }

    if (err) { setError(err.message); } else { setShowModal(false); fetchPatients(); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this patient? This cannot be undone.')) return;
    await supabase.from('patients').delete().eq('id', id);
    fetchPatients();
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, ID, or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input pl-9"
          />
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="w-4 h-4" /> Register Patient
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">All Patients</h3>
          <span className="text-xs text-slate-400">{filtered.length} records</span>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <User className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No patients found</p>
            <p className="text-xs mt-1">Register your first patient to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="table-th">Patient</th>
                  <th className="table-th">Contact</th>
                  <th className="table-th">Blood Group</th>
                  <th className="table-th">Insurance</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(patient => (
                  <tr key={patient.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sky-600 text-xs font-bold">
                            {patient.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <button
                            onClick={() => setShowDetail(patient)}
                            className="font-medium text-slate-900 hover:text-sky-600 transition-colors text-left"
                          >
                            {patient.full_name}
                          </button>
                          <p className="text-xs text-slate-400">{patient.patient_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-td">
                      <div className="space-y-0.5">
                        {patient.phone && (
                          <p className="text-xs flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-300" />{patient.phone}
                          </p>
                        )}
                        {patient.email && (
                          <p className="text-xs flex items-center gap-1 text-slate-400">
                            <Mail className="w-3 h-3 text-slate-300" />{patient.email}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="table-td">
                      {patient.blood_group ? (
                        <span className="inline-flex items-center gap-1">
                          <Droplets className="w-3 h-3 text-red-400" />
                          <span className="text-sm font-semibold text-red-600">{patient.blood_group}</span>
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="table-td">
                      <p className="text-sm">{patient.insurance_provider || <span className="text-slate-300">—</span>}</p>
                    </td>
                    <td className="table-td">
                      <span className={`badge ${statusColors[patient.status]}`}>{patient.status}</span>
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(patient)} className="p-1.5 hover:bg-sky-50 rounded-lg text-slate-400 hover:text-sky-600 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(patient.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors">
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
        <Modal
          title={editing ? 'Edit Patient' : 'Register New Patient'}
          onClose={() => setShowModal(false)}
          size="lg"
        >
          <div className="p-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Patient's full name" />
              </div>
              <div>
                <label className="form-label">Date of Birth</label>
                <input type="date" className="form-input" value={form.date_of_birth} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Gender</label>
                <select className="form-select" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                  <option value="">Select gender</option>
                  {genderOptions.map(g => <option key={g} value={g} className="capitalize">{g}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Blood Group</label>
                <select className="form-select" value={form.blood_group} onChange={e => setForm(f => ({ ...f, blood_group: e.target.value }))}>
                  <option value="">Select blood group</option>
                  {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="deceased">Deceased</option>
                </select>
              </div>
              <div>
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 000 000 0000" />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="patient@email.com" />
              </div>
              <div className="sm:col-span-2">
                <label className="form-label">Address</label>
                <input className="form-input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Full address" />
              </div>
              <div>
                <label className="form-label">Emergency Contact Name</label>
                <input className="form-input" value={form.emergency_contact_name} onChange={e => setForm(f => ({ ...f, emergency_contact_name: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Emergency Contact Phone</label>
                <input className="form-input" value={form.emergency_contact_phone} onChange={e => setForm(f => ({ ...f, emergency_contact_phone: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Insurance Provider</label>
                <input className="form-input" value={form.insurance_provider} onChange={e => setForm(f => ({ ...f, insurance_provider: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Insurance Number</label>
                <input className="form-input" value={form.insurance_number} onChange={e => setForm(f => ({ ...f, insurance_number: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <label className="form-label">Known Allergies</label>
                <textarea className="form-input resize-none" rows={2} value={form.allergies} onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))} placeholder="List any known allergies..." />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Register Patient'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <Modal title="Patient Profile" onClose={() => setShowDetail(null)} size="lg">
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-sky-100 rounded-2xl flex items-center justify-center">
                <span className="text-sky-600 text-xl font-bold">{showDetail.full_name.charAt(0)}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{showDetail.full_name}</h3>
                <p className="text-sm text-slate-500">{showDetail.patient_number}</p>
                <span className={`badge mt-1 ${statusColors[showDetail.status]}`}>{showDetail.status}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                ['Date of Birth', showDetail.date_of_birth ? new Date(showDetail.date_of_birth).toLocaleDateString() : '—'],
                ['Gender', showDetail.gender ?? '—'],
                ['Blood Group', showDetail.blood_group ?? '—'],
                ['Phone', showDetail.phone ?? '—'],
                ['Email', showDetail.email ?? '—'],
                ['Insurance', showDetail.insurance_provider ?? '—'],
                ['Emergency Contact', showDetail.emergency_contact_name ?? '—'],
                ['Emergency Phone', showDetail.emergency_contact_phone ?? '—'],
              ].map(([label, value]) => (
                <div key={label} className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                  <p className="text-sm font-medium text-slate-900">{value}</p>
                </div>
              ))}
            </div>

            {showDetail.allergies && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                <p className="text-xs font-semibold text-red-700 mb-1">Known Allergies</p>
                <p className="text-sm text-red-600">{showDetail.allergies}</p>
              </div>
            )}

            {showDetail.address && (
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-400 mb-0.5">Address</p>
                <p className="text-sm text-slate-900">{showDetail.address}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
