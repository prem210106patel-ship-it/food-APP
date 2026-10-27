import { useEffect, useState, useCallback } from 'react';
import { Save, Loader2, QrCode, Store, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase, formatCurrency } from '../../lib/supabase.js';
import { useAuth } from '../../lib/auth.jsx';

export default function RestaurantSettings() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    delivery_fee: 0,
    estimated_delivery_minutes: 30,
    image_url: '',
    cover_image_url: '',
    upi_vpa: '',
    availability_status: 'closed',
  });

  const load = useCallback(async () => {
    if (!user) return;
    const { data: rest } = await supabase.from('restaurants').select('*').eq('owner_id', user.id).maybeSingle();
    if (rest) {
      setRestaurant(rest);
      setForm({
        name: rest.name || '',
        description: rest.description || '',
        address: rest.address || '',
        city: rest.city || '',
        delivery_fee: rest.delivery_fee || 0,
        estimated_delivery_minutes: rest.estimated_delivery_minutes || 30,
        image_url: rest.image_url || '',
        cover_image_url: rest.cover_image_url || '',
        upi_vpa: rest.upi_vpa || '',
        availability_status: rest.availability_status || 'closed',
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await supabase.from('restaurants').update({
      name: form.name,
      description: form.description || null,
      address: form.address,
      city: form.city,
      delivery_fee: Number(form.delivery_fee),
      estimated_delivery_minutes: Number(form.estimated_delivery_minutes),
      image_url: form.image_url || null,
      cover_image_url: form.cover_image_url || null,
      upi_vpa: form.upi_vpa || null,
      availability_status: form.availability_status,
    }).eq('id', restaurant.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-orange-500 animate-spin" /></div>;
  if (!restaurant) return <div className="text-center py-20"><Store className="w-12 h-12 text-ink-200 mx-auto mb-3" /><p className="text-ink-400">No restaurant assigned to your account.</p></div>;

  return (
    <div>
      <h1 className="text-2xl font-extrabold font-display text-charcoal-800 mb-6">Restaurant Settings</h1>

      {saved && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4" /> Settings saved successfully
        </div>
      )}

      <div className="space-y-5">
        <div className="bg-white rounded-xl border border-ink-100 p-5 space-y-3">
          <h2 className="font-bold font-display text-charcoal-800">Basic Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-ink-500 block mb-1">Restaurant Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-500 block mb-1">City</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-ink-500 block mb-1">Address</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-500 block mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg resize-none focus:outline-none focus:border-orange-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-ink-100 p-5 space-y-3">
          <h2 className="font-bold font-display text-charcoal-800">Delivery & Availability</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-ink-500 block mb-1">Delivery Fee (₹)</label>
              <input type="number" value={form.delivery_fee / 100} onChange={(e) => setForm({ ...form, delivery_fee: Number(e.target.value) * 100 })} className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-500 block mb-1">Est. Delivery (min)</label>
              <input type="number" value={form.estimated_delivery_minutes} onChange={(e) => setForm({ ...form, estimated_delivery_minutes: e.target.value })} className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-ink-500 block mb-1">Availability</label>
            <select value={form.availability_status} onChange={(e) => setForm({ ...form, availability_status: e.target.value })} className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400">
              <option value="open">Open for orders</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-ink-100 p-5 space-y-3">
          <h2 className="font-bold font-display text-charcoal-800 flex items-center gap-2"><QrCode className="w-5 h-5 text-orange-500" /> UPI Payment</h2>
          <div>
            <label className="text-xs font-medium text-ink-500 block mb-1">UPI VPA (Merchant ID)</label>
            <input value={form.upi_vpa} onChange={(e) => setForm({ ...form, upi_vpa: e.target.value })} placeholder="e.g. spicegarden@okaxis" className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400 font-mono" />
            <p className="text-xs text-ink-400 mt-1">This is the UPI ID customers will pay to when they choose UPI QR payment.</p>
          </div>
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">UPI payments are marked as pending until you verify receipt in the Orders page. Never mark a payment as paid without confirming the money has arrived in your account.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-ink-100 p-5 space-y-3">
          <h2 className="font-bold font-display text-charcoal-800">Images</h2>
          <div>
            <label className="text-xs font-medium text-ink-500 block mb-1">Logo Image URL</label>
            <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-500 block mb-1">Cover Image URL</label>
            <input value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400" />
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="w-full py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : <><Save className="w-5 h-5" /> Save Settings</>}
        </button>
      </div>
    </div>
  );
}
