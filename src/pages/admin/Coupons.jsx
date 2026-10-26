import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Loader2, Ticket, Edit3, X } from 'lucide-react';
import { supabase, formatCurrency } from '../../../lib/supabase.js';
import { CUISINES } from '../../../lib/utils.js';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', description: '', discount_type: 'percentage', discount_value: 10, minimum_order_amount: 0, maximum_discount: 0, expires_at: '', restaurant_id: '', is_active: true });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('coupons').select('*, restaurant:restaurants(name)').order('created_at', { ascending: false });
    setCoupons(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.code || !form.discount_value) return;
    const payload = {
      code: form.code.toUpperCase().trim(),
      description: form.description || null,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value) * 100,
      minimum_order_amount: Number(form.minimum_order_amount) * 100,
      maximum_discount: Number(form.maximum_discount) * 100,
      expires_at: form.expires_at || null,
      restaurant_id: form.restaurant_id || null,
      is_active: form.is_active,
    };
    await supabase.from('coupons').insert(payload);
    setShowForm(false);
    setForm({ code: '', description: '', discount_type: 'percentage', discount_value: 10, minimum_order_amount: 0, maximum_discount: 0, expires_at: '', restaurant_id: '', is_active: true });
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    await supabase.from('coupons').delete().eq('id', id);
    load();
  };

  const toggleActive = async (c) => {
    await supabase.from('coupons').update({ is_active: !c.is_active }).eq('id', c.id);
    load();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-orange-500 animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold font-display text-charcoal-800">Coupon Management</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600">
          {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> New Coupon</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-ink-100 p-5 mb-4 animate-fade-in space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Coupon code (e.g. SAVE20)" className="px-3 py-2.5 text-sm border border-ink-200 rounded-lg uppercase" />
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="px-3 py-2.5 text-sm border border-ink-200 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })} className="px-3 py-2.5 text-sm border border-ink-200 rounded-lg">
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
            <input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} placeholder="Value (₹ or %)" className="px-3 py-2.5 text-sm border border-ink-200 rounded-lg" />
            <input type="number" value={form.minimum_order_amount} onChange={(e) => setForm({ ...form, minimum_order_amount: e.target.value })} placeholder="Min order ₹" className="px-3 py-2.5 text-sm border border-ink-200 rounded-lg" />
            <input type="number" value={form.maximum_discount} onChange={(e) => setForm({ ...form, maximum_discount: e.target.value })} placeholder="Max discount ₹" className="px-3 py-2.5 text-sm border border-ink-200 rounded-lg" />
          </div>
          <input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="px-3 py-2.5 text-sm border border-ink-200 rounded-lg" />
          <button onClick={handleCreate} className="px-5 py-2.5 bg-charcoal-800 text-white text-sm font-semibold rounded-lg hover:bg-charcoal-700">Create Coupon</button>
        </div>
      )}

      {coupons.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {coupons.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-ink-100 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Ticket className="w-4 h-4 text-orange-500" />
                    <span className="font-bold font-display text-charcoal-800">{c.code}</span>
                  </div>
                  <p className="text-sm text-orange-600 font-medium">
                    {c.discount_type === 'percentage' ? `${c.discount_value / 100}% off` : `${formatCurrency(c.discount_value)} off`}
                  </p>
                  {c.description && <p className="text-xs text-ink-400 mt-1">{c.description}</p>}
                  {c.restaurant && <p className="text-xs text-ink-400 mt-0.5">Valid at {c.restaurant.name}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-ink-400">
                    {c.minimum_order_amount > 0 && <span>Min: {formatCurrency(c.minimum_order_amount)}</span>}
                    {c.expires_at && <span>Expires: {new Date(c.expires_at).toLocaleDateString('en-IN')}</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <button onClick={() => toggleActive(c)} className={`px-2 py-1 text-xs rounded-lg ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-ink-100 text-ink-500'}`}>{c.is_active ? 'Active' : 'Inactive'}</button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-ink-100"><Ticket className="w-10 h-10 text-ink-200 mx-auto mb-2" /><p className="text-ink-400">No coupons yet. Create one to offer discounts.</p></div>
      )}
    </div>
  );
}
