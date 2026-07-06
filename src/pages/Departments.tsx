import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Department, Doctor } from '../types';
import Modal from '../components/Modal';
import { Plus, Edit2, Trash2, Building2, AlertCircle, UserCog } from 'lucide-react';

const emptyForm = { name: '', description: '', head_doctor_id: '' };

export default function Departments() {
  const [departments, setDepartments] = useState<(Department & { head_doctor?: { full_name: string }; doctor_count?: number })[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const [{ data: depts }, { data: docs }] = await Promise.all([
      supabase.from('departments').select('*, doctors!departments_head_doctor_id_fkey(full_name)').order('name'),
      supabase.from('doctors').select('id, full_name, specialization').eq('status', 'active').order('full_name'),
    ]);

    // get doctor counts per department
    const { data: doctorCounts } = await supabase
      .from('doctors')
      .select('department_id')
      .not('department_id', 'is', null);

    const countMap: Record<string, number> = {};
    (doctorCounts ?? []).forEach(d => {
      if (d.department_id) countMap[d.department_id] = (countMap[d.department_id] ?? 0) + 1;
    });

    const enriched = (depts ?? []).map((d: Record<string, unknown>) => ({
      ...d,
      head_doctor: d.doctors as { full_name: string } | null,
      doctor_count: countMap[d.id as string] ?? 0,
    }));

    setDepartments(enriched as unknown as (Department & { head_doctor?: { full_name: string }; doctor_count?: number })[]);
    setDoctors((docs ?? []) as unknown as Doctor[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setError(''); setShowModal(true); };
  const openEdit = (dept: Department) => {
    setEditing(dept);
    setForm({ name: dept.name, description: dept.description ?? '', head_doctor_id: dept.head_doctor_id ?? '' });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Department name is required.'); return; }
    setSaving(true);
    setError('');
    const payload = { name: form.name, description: form.description || null, head_doctor_id: form.head_doctor_id || null };
    let err;
    if (editing) {
      ({ error: err } = await supabase.from('departments').update(payload).eq('id', editing.id));
    } else {
      ({ error: err } = await supabase.from('departments').insert(payload));
    }
    if (err) { setError(err.message); } else { setShowModal(false); fetchData(); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this department?')) return;
    await supabase.from('departments').delete().eq('id', id);
    fetchData();
  };

  const colors = [
    'from-sky-400 to-sky-500', 'from-emerald-400 to-emerald-500',
    'from-violet-400 to-violet-500', 'from-amber-400 to-amber-500',
    'from-rose-400 to-rose-500', 'from-teal-400 to-teal-500',
    'from-indigo-400 to-indigo-500', 'from-orange-400 to-orange-500',
  ];

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex justify-end">
        <button onClick={openAdd} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="card h-32 animate-pulse" />)}
        </div>
      ) : departments.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-slate-400">
          <Building2 className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm">No departments found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {departments.map((dept, idx) => (
            <div key={dept.id} className="card overflow-hidden hover:shadow-md transition-shadow group">
              <div className={`h-2 bg-gradient-to-r ${colors[idx % colors.length]}`} />
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <h3 className="font-semibold text-slate-900 text-sm">{dept.name}</h3>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(dept)} className="p-1 hover:bg-sky-50 rounded text-slate-400 hover:text-sky-600">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(dept.id)} className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {dept.description && <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{dept.description}</p>}
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <UserCog className="w-3 h-3 text-slate-300" />
                    <span>{dept.doctor_count ?? 0} doctors</span>
                  </div>
                  {dept.head_doctor && (
                    <p className="text-xs text-slate-400 truncate">Head: {dept.head_doctor.full_name}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Edit Department' : 'Add Department'} onClose={() => setShowModal(false)}>
          <div className="p-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}
            <div>
              <label className="form-label">Department Name *</label>
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Description</label>
              <textarea className="form-input resize-none" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Head Doctor</label>
              <select className="form-select" value={form.head_doctor_id} onChange={e => setForm(f => ({ ...f, head_doctor_id: e.target.value }))}>
                <option value="">Select head doctor</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name} — {d.specialization}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Department'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
