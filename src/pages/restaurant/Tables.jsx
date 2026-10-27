import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, QrCode, Download, Loader2, Table2, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../../lib/supabase.js';
import { useAuth } from '../../../lib/auth.jsx';
import { generateToken, hashToken } from '../../../lib/utils.js';

export default function RestaurantTables() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ table_number: '', seats: 4 });
  const [qrTable, setQrTable] = useState(null);
  const [qrToken, setQrToken] = useState(null);

  const load = useCallback(async () => {
    if (!user) return;
    if (!restaurant) {
      const { data: rest } = await supabase.from('restaurants').select('*').eq('owner_id', user.id).maybeSingle();
      if (!rest) { setLoading(false); return; }
      setRestaurant(rest);
    }
    const restId = restaurant?.id;
    if (!restId) return;
    const { data } = await supabase.from('restaurant_tables').select('*').eq('restaurant_id', restId).order('table_number');
    setTables(data || []);
    setLoading(false);
  }, [user, restaurant]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.table_number) return;
    const rawToken = generateToken();
    const tokenHash = await hashToken(rawToken);
    await supabase.from('restaurant_tables').insert({
      restaurant_id: restaurant.id,
      table_number: form.table_number,
      seats: Number(form.seats),
      public_token_hash: tokenHash,
      is_active: true,
    });
    setShowForm(false);
    setForm({ table_number: '', seats: 4 });
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this table?')) return;
    await supabase.from('restaurant_tables').delete().eq('id', id);
    load();
  };

  const toggleActive = async (t) => {
    await supabase.from('restaurant_tables').update({ is_active: !t.is_active }).eq('id', t.id);
    load();
  };

  const showQR = async (t) => {
    const rawToken = generateToken();
    const tokenHash = await hashToken(rawToken);
    await supabase.from('restaurant_tables').update({ public_token_hash: tokenHash }).eq('id', t.id);
    setQrTable(t);
    setQrToken(rawToken);
  };

  const downloadQR = () => {
    const svg = document.getElementById('qr-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `table-${qrTable.table_number}-qr.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-orange-500 animate-spin" /></div>;

  const qrUrl = qrToken ? `${window.location.origin}/qr/table/${qrToken}` : '';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold font-display text-charcoal-800">Tables & QR Ordering</h1>
          <p className="text-sm text-ink-400 mt-0.5">Generate QR codes for dine-in ordering</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600">
          {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Add Table</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-ink-100 p-4 mb-4 animate-fade-in flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs font-medium text-ink-500 block mb-1">Table Number / Label</label>
            <input value={form.table_number} onChange={(e) => setForm({ ...form, table_number: e.target.value })} placeholder="e.g. T1, Patio-2" className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg" />
          </div>
          <div className="w-24">
            <label className="text-xs font-medium text-ink-500 block mb-1">Seats</label>
            <input type="number" value={form.seats} onChange={(e) => setForm({ ...form, seats: e.target.value })} className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg" />
          </div>
          <button onClick={handleCreate} className="px-4 py-2 bg-charcoal-800 text-white text-sm font-semibold rounded-lg">Add Table</button>
        </div>
      )}

      {tables.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-ink-100 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Table2 className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-charcoal-800">Table {t.table_number}</p>
                    <p className="text-xs text-ink-400">{t.seats} seats</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-ink-100 text-ink-500'}`}>{t.is_active ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => showQR(t)} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-orange-50 text-orange-600 text-xs font-semibold rounded-lg hover:bg-orange-100">
                  <QrCode className="w-4 h-4" /> Show QR
                </button>
                <button onClick={() => toggleActive(t)} className="px-2.5 py-2 text-xs bg-ink-100 text-ink-600 rounded-lg">{t.is_active ? 'Disable' : 'Enable'}</button>
                <button onClick={() => handleDelete(t.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-ink-100"><Table2 className="w-10 h-10 text-ink-200 mx-auto mb-2" /><p className="text-ink-400">No tables yet. Add a table to generate QR codes for dine-in ordering.</p></div>
      )}

      {qrTable && qrToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => { setQrTable(null); setQrToken(null); }}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold font-display text-charcoal-800">Table {qrTable.table_number} QR</h2>
              <button onClick={() => { setQrTable(null); setQrToken(null); }}><X className="w-5 h-5 text-ink-400" /></button>
            </div>
            <div className="inline-block p-4 bg-white border-2 border-orange-200 rounded-xl mb-3">
              <QRCodeSVG id="qr-svg" value={qrUrl} size={200} level="M" />
            </div>
            <p className="text-sm text-ink-500 mb-3">Customers scan this to view the menu and place a dine-in order at Table {qrTable.table_number}.</p>
            <button onClick={downloadQR} className="flex items-center justify-center gap-2 w-full py-2.5 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600">
              <Download className="w-4 h-4" /> Download QR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
