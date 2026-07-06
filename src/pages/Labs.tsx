import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { LabTest, Patient, Doctor } from '../types';
import Modal from '../components/Modal';
import { Plus, Search, Edit2, Trash2, FlaskConical, Eye, AlertCircle, CheckCircle } from 'lucide-react';

const statusColors: Record<string, string> = {
  ordered: 'bg-slate-100 text-slate-600',
  sample_collected: 'bg-sky-100 text-sky-700',
  processing: 'bg-violet-100 text-violet-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

const priorityColors: Record<string, string> = {
  routine: 'bg-slate-100 text-slate-600',
  urgent: 'bg-amber-100 text-amber-700',
  stat: 'bg-red-100 text-red-700',
};

const resultStatusColors: Record<string, string> = {
  normal: 'bg-emerald-100 text-emerald-700',
  abnormal: 'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700',
};

const emptyTestForm = {
  patient_id: '',
  doctor_id: '',
  test_name: '',
  test_type: '',
  ordered_date: '',
  status: 'ordered',
  priority: 'routine',
  notes: '',
};

const emptyResultForm = {
  technician_name: '',
  result_value: '',
  result_unit: '',
  reference_range: '',
  result_date: '',
  remarks: '',
  status: 'normal',
};

export default function Labs() {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState<LabTest | null>(null);
  const [showDetail, setShowDetail] = useState<LabTest | null>(null);
  const [editing, setEditing] = useState<LabTest | null>(null);
  const [form, setForm] = useState(emptyTestForm);
  const [resultForm, setResultForm] = useState(emptyResultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const [{ data: labs }, { data: pts }, { data: docs }] = await Promise.all([
      supabase.from('lab_tests')
        .select('*, patients(full_name, patient_number), doctors(full_name, specialization), lab_results(*)')
        .order('ordered_date', { ascending: false }),
      supabase.from('patients').select('id, full_name, patient_number').eq('status', 'active').order('full_name'),
      supabase.from('doctors').select('id, full_name, specialization').eq('status', 'active').order('full_name'),
    ]);
    setTests((labs ?? []) as unknown as LabTest[]);
    setPatients(pts ?? []);
    setDoctors((docs ?? []) as unknown as Doctor[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = tests.filter(t => {
    const matchSearch =
      t.patients?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.test_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyTestForm, ordered_date: new Date().toISOString().split('T')[0] });
    setError('');
    setShowModal(true);
  };

  const openEdit = (test: LabTest) => {
    setEditing(test);
    setForm({
      patient_id: test.patient_id,
      doctor_id: test.doctor_id,
      test_name: test.test_name,
      test_type: test.test_type ?? '',
      ordered_date: test.ordered_date,
      status: test.status,
      priority: test.priority,
      notes: test.notes ?? '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.patient_id || !form.doctor_id || !form.test_name) {
      setError('Patient, doctor, and test name are required.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = { ...form, test_type: form.test_type || null, notes: form.notes || null };
    let err;
    if (editing) {
      ({ error: err } = await supabase.from('lab_tests').update(payload).eq('id', editing.id));
    } else {
      ({ error: err } = await supabase.from('lab_tests').insert(payload));
    }
    if (err) { setError(err.message); } else { setShowModal(false); fetchData(); }
    setSaving(false);
  };

  const handleSaveResult = async () => {
    if (!showResultModal) return;
    if (!resultForm.result_value) { setError('Result value is required.'); return; }
    setSaving(true);
    setError('');
    const payload = {
      lab_test_id: showResultModal.id,
      result_date: resultForm.result_date || new Date().toISOString().split('T')[0],
      technician_name: resultForm.technician_name || null,
      result_value: resultForm.result_value,
      result_unit: resultForm.result_unit || null,
      reference_range: resultForm.reference_range || null,
      remarks: resultForm.remarks || null,
      status: resultForm.status,
    };
    const { error: err } = await supabase.from('lab_results').insert(payload);
    if (!err) {
      await supabase.from('lab_tests').update({ status: 'completed' }).eq('id', showResultModal.id);
    }
    if (err) { setError(err.message); } else { setShowResultModal(null); setResultForm(emptyResultForm); fetchData(); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lab test?')) return;
    await supabase.from('lab_tests').delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient or test name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input pl-9"
          />
        </div>
        <select className="form-select w-44" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {Object.keys(statusColors).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="w-4 h-4" /> Order Test
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-700">Lab Tests</h3>
          <span className="text-xs text-slate-400">{filtered.length} tests</span>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-slate-50 rounded-lg animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <FlaskConical className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No lab tests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="table-th">Patient</th>
                  <th className="table-th">Test</th>
                  <th className="table-th">Ordered By</th>
                  <th className="table-th">Date</th>
                  <th className="table-th">Priority</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Results</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(test => (
                  <tr key={test.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="table-td">
                      <p className="font-medium text-slate-900">{test.patients?.full_name}</p>
                      <p className="text-xs text-slate-400">{test.patients?.patient_number}</p>
                    </td>
                    <td className="table-td">
                      <p className="font-medium text-slate-900">{test.test_name}</p>
                      <p className="text-xs text-slate-400">{test.test_type}</p>
                    </td>
                    <td className="table-td">
                      <p className="text-sm">{test.doctors?.full_name}</p>
                    </td>
                    <td className="table-td">{new Date(test.ordered_date).toLocaleDateString()}</td>
                    <td className="table-td">
                      <span className={`badge ${priorityColors[test.priority]}`}>{test.priority}</span>
                    </td>
                    <td className="table-td">
                      <span className={`badge ${statusColors[test.status]}`}>{test.status.replace('_', ' ')}</span>
                    </td>
                    <td className="table-td">
                      {test.lab_results && test.lab_results.length > 0 ? (
                        <button
                          onClick={() => setShowDetail(test)}
                          className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> {test.lab_results.length} result(s)
                        </button>
                      ) : (
                        <button
                          onClick={() => { setShowResultModal(test); setResultForm({ ...emptyResultForm, result_date: new Date().toISOString().split('T')[0] }); setError(''); }}
                          className="text-xs font-medium text-sky-600 hover:text-sky-700"
                        >
                          + Add Result
                        </button>
                      )}
                    </td>
                    <td className="table-td">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(test)} className="p-1.5 hover:bg-sky-50 rounded-lg text-slate-400 hover:text-sky-600 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(test.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors">
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

      {/* Add/Edit Test Modal */}
      {showModal && (
        <Modal title={editing ? 'Edit Lab Test' : 'Order Lab Test'} onClose={() => setShowModal(false)} size="lg">
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
              <div>
                <label className="form-label">Ordering Doctor *</label>
                <select className="form-select" value={form.doctor_id} onChange={e => setForm(f => ({ ...f, doctor_id: e.target.value }))}>
                  <option value="">Select doctor</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Test Name *</label>
                <input className="form-input" value={form.test_name} onChange={e => setForm(f => ({ ...f, test_name: e.target.value }))} placeholder="e.g. Complete Blood Count" />
              </div>
              <div>
                <label className="form-label">Test Type</label>
                <input className="form-input" value={form.test_type} onChange={e => setForm(f => ({ ...f, test_type: e.target.value }))} placeholder="e.g. Hematology" />
              </div>
              <div>
                <label className="form-label">Ordered Date</label>
                <input type="date" className="form-input" value={form.ordered_date} onChange={e => setForm(f => ({ ...f, ordered_date: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Priority</label>
                <select className="form-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="routine">Routine</option>
                  <option value="urgent">Urgent</option>
                  <option value="stat">STAT</option>
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
                <textarea className="form-input resize-none" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Order Test'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Result Modal */}
      {showResultModal && (
        <Modal title={`Add Result — ${showResultModal.test_name}`} onClose={() => setShowResultModal(null)} size="md">
          <div className="p-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="form-label">Result Value *</label>
                <input className="form-input" value={resultForm.result_value} onChange={e => setResultForm(f => ({ ...f, result_value: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Unit</label>
                <input className="form-input" value={resultForm.result_unit} onChange={e => setResultForm(f => ({ ...f, result_unit: e.target.value }))} placeholder="e.g. mg/dL" />
              </div>
              <div>
                <label className="form-label">Reference Range</label>
                <input className="form-input" value={resultForm.reference_range} onChange={e => setResultForm(f => ({ ...f, reference_range: e.target.value }))} placeholder="e.g. 70-100" />
              </div>
              <div>
                <label className="form-label">Technician</label>
                <input className="form-input" value={resultForm.technician_name} onChange={e => setResultForm(f => ({ ...f, technician_name: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Result Date</label>
                <input type="date" className="form-input" value={resultForm.result_date} onChange={e => setResultForm(f => ({ ...f, result_date: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Result Status</label>
                <select className="form-select" value={resultForm.status} onChange={e => setResultForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="normal">Normal</option>
                  <option value="abnormal">Abnormal</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="form-label">Remarks</label>
                <textarea className="form-input resize-none" rows={2} value={resultForm.remarks} onChange={e => setResultForm(f => ({ ...f, remarks: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowResultModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleSaveResult} disabled={saving} className="btn-primary disabled:opacity-60">
                {saving ? 'Saving...' : 'Save Result'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Detail Modal */}
      {showDetail && showDetail.lab_results && (
        <Modal title={`Results — ${showDetail.test_name}`} onClose={() => setShowDetail(null)} size="lg">
          <div className="p-6 space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl text-sm">
              <span className="text-slate-500">Patient: </span>
              <span className="font-medium text-slate-900">{showDetail.patients?.full_name}</span>
              <span className="text-slate-300 mx-2">|</span>
              <span className="text-slate-500">Ordered: </span>
              <span className="font-medium text-slate-900">{new Date(showDetail.ordered_date).toLocaleDateString()}</span>
            </div>
            {showDetail.lab_results.map(r => (
              <div key={r.id} className="border border-slate-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{r.result_value} {r.result_unit}</p>
                    {r.reference_range && <p className="text-xs text-slate-400">Ref: {r.reference_range}</p>}
                  </div>
                  <span className={`badge ${resultStatusColors[r.status]}`}>{r.status}</span>
                </div>
                {r.remarks && <p className="text-xs text-slate-500">{r.remarks}</p>}
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{r.technician_name ? `By: ${r.technician_name}` : ''}</span>
                  <span>{new Date(r.result_date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
