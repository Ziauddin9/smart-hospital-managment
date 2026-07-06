import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Medicine } from '../types';
import Modal from '../components/Modal';
import { Plus, Search, Edit2, Trash2, Pill, AlertTriangle, AlertCircle } from 'lucide-react';

const categories = ['Analgesic', 'Antibiotic', 'Antidiabetic', 'Antihypertensive', 'Antacid', 'NSAID', 'Statin', 'Bronchodilator', 'Antiviral', 'Antihistamine', 'Antidepressant', 'Other'];
const units = ['tablet', 'capsule', 'ml', 'mg', 'inhaler', 'injection', 'syrup', 'cream', 'drops'];

const emptyForm = {
  name: '',
  generic_name: '',
  category: '',
  manufacturer: '',
  batch_number: '',
  quantity_in_stock: 0,
  unit: 'tablet',
  unit_price: 0,
  reorder_level: 10,
  expiry_date: '',
};

export default function Pharmacy() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchMedicines = async () => {
    setLoading(true);
    const { data } = await supabase.from('medicines').select('*').order('name');
    setMedicines(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchMedicines(); }, []);

  const filtered = medicines.filter(m => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.generic_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (m.manufacturer ?? '').toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCategory || m.category === filterCategory;
    return matchSearch && matchCat;
  });

  const lowStock = medicines.filter(m => m.quantity_in_stock <= m.reorder_level);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setError(''); setShowModal(true); };
  const openEdit = (med: Medicine) => {
    setEditing(med);
    setForm({
      name: med.name,
      generic_name: med.generic_name ?? '',
      category: med.category ?? '',
      manufacturer: med.manufacturer ?? '',
      batch_number: med.batch_number ?? '',
      quantity_in_stock: med.quantity_in_stock,
      unit: med.unit,
      unit_price: med.unit_price,
      reorder_level: med.reorder_level,
      expiry_date: med.expiry_date ?? '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Medicine name is required.'); return; }
    setSaving(true);
    setError('');
    const payload = {
      name: form.name,
      generic_name: form.generic_name || null,
      category: form.category || null,
      manufacturer: form.manufacturer || null,
      batch_number: form.batch_number || null,
      quantity_in_stock: form.quantity_in_stock,
      unit: form.unit,
      unit_price: form.unit_price,
      reorder_level: form.reorder_level,
      expiry_date: form.expiry_date || null,
    };
    let err;
    if (editing) {
      ({ error: err } = await supabase.from('medicines').update(payload).eq('id', editing.id));
    } else {
      ({ error: err } = await supabase.from('medicines').insert(payload));
    }
    if (err) { setError(err.message); } else { setShowModal(false); fetchMedicines(); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this medicine?')) return;
    await supabase.from('medicines').delete().eq('id', id);
    fetchMedicines();
  };

  const getStockStatus = (med: Medicine) => {
    if (med.quantity_in_stock === 0) return { label: 'Out of Stock', cls: 'bg-red-100 text-red-700' };
    if (med.quantity_in_stock <= med.reorder_level) return { label: 'Low Stock', cls: 'bg-amber-100 text-amber-700' };
    return { label: 'In Stock', cls: 'bg-emerald-100 text-emerald-700' };
  };

  const isExpiringSoon = (expiry: string) => {
    const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days <= 30 && days >= 0;
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">{lowStock.length} medicine(s) below reorder level</p>
            <p className="text-xs text-amber-600 mt-0.5">{lowStock.map(m => m.name).join(', ')}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search medicines..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input pl-9"
          />
        </div>
        <select className="form-select w-44" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Medicine
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-700">Medicine Inventory</h3>
          <span className="text-xs text-slate-400">{filtered.length} items</span>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 bg-slate-50 rounded-lg animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Pill className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No medicines found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="table-th">Medicine</th>
                  <th className="table-th">Category</th>
                  <th className="table-th">Stock</th>
                  <th className="table-th">Unit Price</th>
                  <th className="table-th">Expiry</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(med => {
                  const stock = getStockStatus(med);
                  const expirySoon = med.expiry_date && isExpiringSoon(med.expiry_date);
                  return (
                    <tr key={med.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="table-td">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <Pill className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 text-sm">{med.name}</p>
                            <p className="text-xs text-slate-400">{med.generic_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-td">
                        <span className="text-sm text-slate-600">{med.category ?? '—'}</span>
                      </td>
                      <td className="table-td">
                        <p className="text-sm font-semibold text-slate-900">{med.quantity_in_stock}</p>
                        <p className="text-xs text-slate-400">{med.unit}s</p>
                      </td>
                      <td className="table-td">
                        <p className="text-sm font-medium text-slate-900">₹{med.unit_price.toFixed(2)}</p>
                      </td>
                      <td className="table-td">
                        {med.expiry_date ? (
                          <p className={`text-sm ${expirySoon ? 'text-amber-600 font-medium' : 'text-slate-600'}`}>
                            {expirySoon && '⚠ '}
                            {new Date(med.expiry_date).toLocaleDateString()}
                          </p>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="table-td">
                        <span className={`badge ${stock.cls}`}>{stock.label}</span>
                      </td>
                      <td className="table-td">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(med)} className="p-1.5 hover:bg-sky-50 rounded-lg text-slate-400 hover:text-sky-600 transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(med.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title={editing ? 'Edit Medicine' : 'Add Medicine'} onClose={() => setShowModal(false)} size="lg">
          <div className="p-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="form-label">Medicine Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Generic Name</label>
                <input className="form-input" value={form.generic_name} onChange={e => setForm(f => ({ ...f, generic_name: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Manufacturer</label>
                <input className="form-input" value={form.manufacturer} onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Batch Number</label>
                <input className="form-input" value={form.batch_number} onChange={e => setForm(f => ({ ...f, batch_number: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Quantity in Stock</label>
                <input type="number" min={0} className="form-input" value={form.quantity_in_stock} onChange={e => setForm(f => ({ ...f, quantity_in_stock: +e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Unit</label>
                <select className="form-select" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                  {units.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Unit Price (₹)</label>
                <input type="number" min={0} step={0.01} className="form-input" value={form.unit_price} onChange={e => setForm(f => ({ ...f, unit_price: +e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Reorder Level</label>
                <input type="number" min={0} className="form-input" value={form.reorder_level} onChange={e => setForm(f => ({ ...f, reorder_level: +e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Expiry Date</label>
                <input type="date" className="form-input" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Medicine'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
