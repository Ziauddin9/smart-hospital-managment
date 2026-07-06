import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Invoice, InvoiceItem, Patient } from '../types';
import Modal from '../components/Modal';
import { Plus, Search, Eye, Edit2, Trash2, Receipt, AlertCircle, CreditCard, X } from 'lucide-react';

const statusColors: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
  partially_paid: 'bg-sky-100 text-sky-700',
  cancelled: 'bg-red-100 text-red-700',
};

const paymentMethods = ['cash', 'card', 'insurance', 'bank_transfer', 'online'];

const emptyForm = {
  patient_id: '',
  invoice_date: new Date().toISOString().split('T')[0],
  due_date: '',
  tax_amount: 0,
  discount_amount: 0,
  status: 'pending',
  notes: '',
};

interface LineItem {
  description: string;
  category: string;
  quantity: number;
  unit_price: number;
}

export default function Billing() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Invoice | null>(null);
  const [showPayModal, setShowPayModal] = useState<Invoice | null>(null);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: '', category: 'service', quantity: 1, unit_price: 0 }]);
  const [payForm, setPayForm] = useState({ amount: 0, payment_method: 'cash', transaction_id: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const [{ data: invs }, { data: pts }] = await Promise.all([
      supabase.from('invoices')
        .select('*, patients(full_name, patient_number), invoice_items(*), payments(*)')
        .order('created_at', { ascending: false }),
      supabase.from('patients').select('id, full_name, patient_number').eq('status', 'active').order('full_name'),
    ]);
    setInvoices((invs ?? []) as unknown as Invoice[]);
    setPatients(pts ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = invoices.filter(inv => {
    const matchSearch =
      (inv.patients?.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      inv.invoice_number.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const total = subtotal + Number(form.tax_amount) - Number(form.discount_amount);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setLineItems([{ description: '', category: 'service', quantity: 1, unit_price: 0 }]);
    setError('');
    setShowModal(true);
  };

  const openEdit = (inv: Invoice) => {
    setEditing(inv);
    setForm({
      patient_id: inv.patient_id,
      invoice_date: inv.invoice_date,
      due_date: inv.due_date ?? '',
      tax_amount: inv.tax_amount,
      discount_amount: inv.discount_amount,
      status: inv.status,
      notes: inv.notes ?? '',
    });
    setLineItems(
      (inv.invoice_items ?? []).map(i => ({
        description: i.description,
        category: i.category,
        quantity: i.quantity,
        unit_price: i.unit_price,
      }))
    );
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.patient_id) { setError('Please select a patient.'); return; }
    if (lineItems.some(i => !i.description.trim())) { setError('All line items must have a description.'); return; }
    setSaving(true);
    setError('');
    const sub = lineItems.reduce((s, i) => s + i.quantity * i.unit_price, 0);
    const tot = sub + Number(form.tax_amount) - Number(form.discount_amount);
    const invoicePayload = {
      patient_id: form.patient_id,
      invoice_date: form.invoice_date,
      due_date: form.due_date || null,
      subtotal: sub,
      tax_amount: Number(form.tax_amount),
      discount_amount: Number(form.discount_amount),
      total_amount: tot,
      status: form.status,
      notes: form.notes || null,
    };

    let invoiceId = editing?.id;
    if (editing) {
      const { error: err } = await supabase.from('invoices').update(invoicePayload).eq('id', editing.id);
      if (err) { setError(err.message); setSaving(false); return; }
      await supabase.from('invoice_items').delete().eq('invoice_id', editing.id);
    } else {
      const { data, error: err } = await supabase.from('invoices').insert(invoicePayload).select('id').maybeSingle();
      if (err || !data) { setError(err?.message ?? 'Failed to create invoice'); setSaving(false); return; }
      invoiceId = data.id;
    }

    const itemsPayload = lineItems.map(i => ({
      invoice_id: invoiceId,
      description: i.description,
      category: i.category,
      quantity: i.quantity,
      unit_price: i.unit_price,
      total_price: i.quantity * i.unit_price,
    }));
    const { error: itemsErr } = await supabase.from('invoice_items').insert(itemsPayload);
    if (itemsErr) { setError(itemsErr.message); setSaving(false); return; }

    setShowModal(false);
    fetchData();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this invoice?')) return;
    await supabase.from('invoices').delete().eq('id', id);
    fetchData();
  };

  const handlePayment = async () => {
    if (!showPayModal) return;
    if (payForm.amount <= 0) { setError('Payment amount must be greater than 0.'); return; }
    setSaving(true);
    setError('');
    const { error: err } = await supabase.from('payments').insert({
      invoice_id: showPayModal.id,
      payment_date: new Date().toISOString().split('T')[0],
      amount: payForm.amount,
      payment_method: payForm.payment_method,
      transaction_id: payForm.transaction_id || null,
      notes: payForm.notes || null,
    });
    if (!err) {
      const totalPaid = ((showPayModal.payments ?? []).reduce((s, p) => s + p.amount, 0)) + payForm.amount;
      const newStatus = totalPaid >= showPayModal.total_amount ? 'paid' : 'partially_paid';
      await supabase.from('invoices').update({ status: newStatus }).eq('id', showPayModal.id);
      setShowPayModal(null);
      fetchData();
    } else {
      setError(err.message);
    }
    setSaving(false);
  };

  const getTotalRevenue = () => invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total_amount, 0);
  const getPendingAmount = () => invoices.filter(i => ['pending', 'partially_paid'].includes(i.status)).reduce((s, i) => s + i.total_amount, 0);

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Invoices', value: invoices.length, cls: 'text-slate-900' },
          { label: 'Paid', value: invoices.filter(i => i.status === 'paid').length, cls: 'text-emerald-600' },
          { label: 'Pending', value: invoices.filter(i => i.status === 'pending').length, cls: 'text-amber-600' },
          { label: 'Total Revenue', value: `₹${getTotalRevenue().toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, cls: 'text-sky-600' },
        ].map(item => (
          <div key={item.label} className="card p-4">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{item.label}</p>
            <p className={`text-xl font-bold mt-1 ${item.cls}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient or invoice number..."
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
          <Plus className="w-4 h-4" /> New Invoice
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-700">Invoices</h3>
          <span className="text-xs text-slate-400">{filtered.length} invoices</span>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-slate-50 rounded-lg animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Receipt className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No invoices found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="table-th">Invoice #</th>
                  <th className="table-th">Patient</th>
                  <th className="table-th">Date</th>
                  <th className="table-th">Due Date</th>
                  <th className="table-th">Amount</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="table-td">
                      <p className="font-mono text-sm font-medium text-sky-600">{inv.invoice_number}</p>
                    </td>
                    <td className="table-td">
                      <p className="font-medium text-slate-900">{inv.patients?.full_name}</p>
                      <p className="text-xs text-slate-400">{inv.patients?.patient_number}</p>
                    </td>
                    <td className="table-td">{new Date(inv.invoice_date).toLocaleDateString()}</td>
                    <td className="table-td">
                      {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="table-td">
                      <p className="font-semibold text-slate-900">₹{inv.total_amount.toFixed(2)}</p>
                    </td>
                    <td className="table-td">
                      <span className={`badge ${statusColors[inv.status]}`}>{inv.status.replace('_', ' ')}</span>
                    </td>
                    <td className="table-td">
                      <div className="flex gap-1">
                        <button onClick={() => setShowDetail(inv)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors" title="View">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                          <button
                            onClick={() => { setShowPayModal(inv); setPayForm({ amount: inv.total_amount, payment_method: 'cash', transaction_id: '', notes: '' }); setError(''); }}
                            className="p-1.5 hover:bg-emerald-50 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors"
                            title="Record Payment"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => openEdit(inv)} className="p-1.5 hover:bg-sky-50 rounded-lg text-slate-400 hover:text-sky-600 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(inv.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors">
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

      {/* Create/Edit Invoice Modal */}
      {showModal && (
        <Modal title={editing ? 'Edit Invoice' : 'Create Invoice'} onClose={() => setShowModal(false)} size="xl">
          <div className="p-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="form-label">Patient *</label>
                <select className="form-select" value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))}>
                  <option value="">Select patient</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.patient_number})</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Invoice Date</label>
                <input type="date" className="form-input" value={form.invoice_date} onChange={e => setForm(f => ({ ...f, invoice_date: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Due Date</label>
                <input type="date" className="form-input" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {Object.keys(statusColors).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="form-label mb-0">Line Items</label>
                <button
                  onClick={() => setLineItems(items => [...items, { description: '', category: 'service', quantity: 1, unit_price: 0 }])}
                  className="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Item
                </button>
              </div>
              <div className="space-y-2">
                {lineItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      className="form-input col-span-5"
                      placeholder="Description"
                      value={item.description}
                      onChange={e => setLineItems(ls => ls.map((l, i) => i === idx ? { ...l, description: e.target.value } : l))}
                    />
                    <select
                      className="form-select col-span-2"
                      value={item.category}
                      onChange={e => setLineItems(ls => ls.map((l, i) => i === idx ? { ...l, category: e.target.value } : l))}
                    >
                      {['service', 'medicine', 'lab', 'procedure', 'room', 'other'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input
                      type="number" min={1} className="form-input col-span-1 text-center" placeholder="Qty"
                      value={item.quantity}
                      onChange={e => setLineItems(ls => ls.map((l, i) => i === idx ? { ...l, quantity: +e.target.value } : l))}
                    />
                    <input
                      type="number" min={0} step={0.01} className="form-input col-span-2" placeholder="Price"
                      value={item.unit_price}
                      onChange={e => setLineItems(ls => ls.map((l, i) => i === idx ? { ...l, unit_price: +e.target.value } : l))}
                    />
                    <p className="col-span-1 text-sm font-medium text-slate-700 text-right">
                      ₹{(item.quantity * item.unit_price).toFixed(2)}
                    </p>
                    {lineItems.length > 1 && (
                      <button onClick={() => setLineItems(ls => ls.filter((_, i) => i !== idx))} className="col-span-1 p-1 text-red-400 hover:text-red-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="p-4 bg-slate-50 rounded-xl space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-900">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-slate-500">Tax</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs">₹</span>
                  <input type="number" min={0} step={0.01} className="form-input w-24 text-right text-sm py-1" value={form.tax_amount} onChange={e => setForm(f => ({ ...f, tax_amount: +e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-slate-500">Discount</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs">₹</span>
                  <input type="number" min={0} step={0.01} className="form-input w-24 text-right text-sm py-1" value={form.discount_amount} onChange={e => setForm(f => ({ ...f, discount_amount: +e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-between text-base font-bold border-t border-slate-200 pt-2">
                <span className="text-slate-900">Total</span>
                <span className="text-sky-600">₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label className="form-label">Notes</label>
              <textarea className="form-input resize-none" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Invoice'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Invoice Detail Modal */}
      {showDetail && (
        <Modal title={`Invoice — ${showDetail.invoice_number}`} onClose={() => setShowDetail(null)} size="lg">
          <div className="p-6 space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-slate-900">{showDetail.patients?.full_name}</h3>
                <p className="text-sm text-slate-400">{showDetail.patients?.patient_number}</p>
              </div>
              <div className="text-right">
                <span className={`badge ${statusColors[showDetail.status]}`}>{showDetail.status.replace('_', ' ')}</span>
                <p className="text-xs text-slate-400 mt-1">{new Date(showDetail.invoice_date).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="overflow-hidden border border-slate-100 rounded-xl">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="table-th">Description</th>
                    <th className="table-th">Category</th>
                    <th className="table-th text-right">Qty</th>
                    <th className="table-th text-right">Unit Price</th>
                    <th className="table-th text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(showDetail.invoice_items ?? []).map(item => (
                    <tr key={item.id}>
                      <td className="table-td">{item.description}</td>
                      <td className="table-td capitalize">{item.category}</td>
                      <td className="table-td text-right">{item.quantity}</td>
                      <td className="table-td text-right">₹{item.unit_price.toFixed(2)}</td>
                      <td className="table-td text-right font-medium">₹{item.total_price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>₹{showDetail.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Tax</span><span>₹{showDetail.tax_amount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Discount</span><span>-₹{showDetail.discount_amount.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-base border-t border-slate-200 pt-2">
                <span>Total</span><span className="text-sky-600">₹{showDetail.total_amount.toFixed(2)}</span>
              </div>
            </div>

            {showDetail.payments && showDetail.payments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">Payment History</p>
                <div className="space-y-2">
                  {showDetail.payments.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-emerald-800">₹{p.amount.toFixed(2)}</p>
                        <p className="text-xs text-emerald-600 capitalize">{p.payment_method}</p>
                      </div>
                      <p className="text-xs text-emerald-600">{new Date(p.payment_date).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Payment Modal */}
      {showPayModal && (
        <Modal title="Record Payment" onClose={() => setShowPayModal(null)} size="sm">
          <div className="p-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">Invoice {showPayModal.invoice_number}</p>
              <p className="text-base font-bold text-slate-900 mt-0.5">₹{showPayModal.total_amount.toFixed(2)} due</p>
            </div>
            <div>
              <label className="form-label">Amount</label>
              <input type="number" min={0} step={0.01} className="form-input" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: +e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Payment Method</label>
              <select className="form-select" value={payForm.payment_method} onChange={e => setPayForm(f => ({ ...f, payment_method: e.target.value }))}>
                {paymentMethods.map(m => <option key={m} value={m} className="capitalize">{m.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Transaction ID</label>
              <input className="form-input" value={payForm.transaction_id} onChange={e => setPayForm(f => ({ ...f, transaction_id: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Notes</label>
              <input className="form-input" value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowPayModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={handlePayment} disabled={saving} className="btn-primary disabled:opacity-60">
                {saving ? 'Processing...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
