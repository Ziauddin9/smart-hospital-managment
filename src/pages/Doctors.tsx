import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Doctor, Department } from '../types';
import Modal from '../components/Modal';
import { Plus, Search, Edit2, Trash2, UserCog, Phone, Mail, Star, AlertCircle } from 'lucide-react';
import Departments from './Departments';

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-slate-100 text-slate-600',
  on_leave: 'bg-amber-100 text-amber-700',
};

const emptyForm = {
  full_name: '',
  specialization: '',
  department_id: '',
  email: '',
  phone: '',
  license_number: '',
  qualification: '',
  experience_years: 0,
  availability_days: [] as string[],
  status: 'active',
};

export default function Doctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
  setLoading(true);

  const { data: docs, error: doctorsError } = await supabase
    .from("doctors")
    .select(`
  *,
  departments!doctors_department_id_fkey(
    id,
    name
  )
`)
    .order("full_name");

  console.log("Doctors:", docs);
  console.log("Doctors Error:", doctorsError);

  const { data: depts, error: deptError } = await supabase
    .from("departments")
    .select("*")
    .order("name");

  console.log("Departments:", depts);
  console.log("Departments Error:", deptError);

  setDoctors(docs ?? []);
  setDepartments(depts ?? []);
  setLoading(false);
};

  useEffect(() => { fetchData(); }, []);

  const filtered = doctors.filter(d =>
    d.full_name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialization.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (doc: Doctor) => {
    setEditing(doc);
    setForm({
      full_name: doc.full_name,
      specialization: doc.specialization,
      department_id: doc.department_id ?? '',
      email: doc.email ?? '',
      phone: doc.phone ?? '',
      license_number: doc.license_number ?? '',
      qualification: doc.qualification ?? '',
      experience_years: doc.experience_years,
      availability_days: doc.availability_days ?? [],
      status: doc.status,
    });
    setError('');
    setShowModal(true);
  };

  const toggleDay = (day: string) => {
    setForm(f => ({
      ...f,
      availability_days: f.availability_days.includes(day)
        ? f.availability_days.filter(d => d !== day)
        : [...f.availability_days, day],
    }));
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) { setError('Full name is required.'); return; }
    if (!form.specialization.trim()) { setError('Specialization is required.'); return; }
    setSaving(true);
    setError('');
    const payload = {
      full_name: form.full_name,
      specialization: form.specialization,
      department_id: form.department_id || null,
      email: form.email || null,
      phone: form.phone || null,
      license_number: form.license_number || null,
      qualification: form.qualification || null,
      experience_years: form.experience_years,
      availability_days: form.availability_days,
      status: form.status,
    };
    let err;
    if (editing) {
      ({ error: err } = await supabase.from('doctors').update(payload).eq('id', editing.id));
    } else {
      ({ error: err } = await supabase.from('doctors').insert(payload));
    }
    if (err) { setError(err.message); } else { setShowModal(false); fetchData(); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this doctor? This action cannot be undone.')) return;
    await supabase.from('doctors').delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or specialization..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input pl-9"
          />
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Doctor
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse h-44" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-slate-400">
          <UserCog className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm font-medium">No doctors found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(doc => (
            <div key={doc.id} className="card p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-sky-100 rounded-xl flex items-center justify-center">
                    <span className="text-sky-600 font-bold">{doc.full_name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{doc.full_name}</p>
                    <p className="text-xs text-slate-400">{doc.specialization}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(doc)} className="p-1.5 hover:bg-sky-50 rounded-lg text-slate-400 hover:text-sky-600 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(doc.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                {doc.phone && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone className="w-3 h-3 text-slate-300" /> {doc.phone}
                  </div>
                )}
                {doc.email && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Mail className="w-3 h-3 text-slate-300" /> {doc.email}
                  </div>
                )}
                {doc.experience_years > 0 && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Star className="w-3 h-3 text-amber-400" /> {doc.experience_years} years experience
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-400">
                  {(doc.departments as unknown as Department)?.name ?? 'No department'}
                </span>
                <span className={`badge ${statusColors[doc.status]}`}>{doc.status.replace('_', ' ')}</span>
              </div>

              {doc.availability_days?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {doc.availability_days.map(day => (
                    <span key={day} className="text-xs px-1.5 py-0.5 bg-sky-50 text-sky-600 rounded">
                      {day.slice(0, 3)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Edit Doctor' : 'Add New Doctor'} onClose={() => setShowModal(false)} size="lg">
          <div className="p-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Specialization *</label>
                <input className="form-input" value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Department</label>
                <select className="form-select" value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))}>
                  <option value="">Select department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">License Number</label>
                <input className="form-input" value={form.license_number} onChange={e => setForm(f => ({ ...f, license_number: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Qualification</label>
                <input className="form-input" value={form.qualification} onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))} placeholder="MBBS, MD, etc." />
              </div>
              <div>
                <label className="form-label">Years of Experience</label>
                <input type="number" min={0} className="form-input" value={form.experience_years} onChange={e => setForm(f => ({ ...f, experience_years: +e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="on_leave">On Leave</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="form-label">Availability Days</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {weekDays.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        form.availability_days.includes(day)
                          ? 'bg-sky-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Doctor'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
