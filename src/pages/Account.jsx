import { useState, useEffect } from 'react';
import { User, Phone, Save, MapPin, Plus, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';

export default function Account() {
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [newAddr, setNewAddr] = useState({ label: 'Home', recipient_name: '', phone: '', address_line: '', city: 'Bengaluru', state: 'Karnataka', postal_code: '' });

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      supabase.from('addresses').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        .then(({ data }) => setAddresses(data || []));
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ name, phone }).eq('id', user.id);
    if (!error) {
      await refreshProfile();
      setSavedMsg('Profile updated');
      setTimeout(() => setSavedMsg(''), 2000);
    }
    setSaving(false);
  };

  const handleAddAddress = async () => {
    if (!newAddr.address_line || !newAddr.postal_code) return;
    const { data } = await supabase.from('addresses').insert({ ...newAddr, user_id: user.id }).select().single();
    if (data) {
      setAddresses([data, ...addresses]);
      setNewAddr({ label: 'Home', recipient_name: '', phone: '', address_line: '', city: 'Bengaluru', state: 'Karnataka', postal_code: '' });
      setShowAddAddr(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    await supabase.from('addresses').delete().eq('id', id);
    setAddresses(addresses.filter(a => a.id !== id));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-extrabold font-display text-charcoal-800 mb-6">My Account</h1>

      <div className="bg-white rounded-xl border border-ink-100 p-5 mb-4">
        <h2 className="font-bold font-display text-charcoal-800 mb-4">Profile</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-ink-600 block mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-ink-600 block mb-1.5">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-ink-600 block mb-1.5">Email</label>
            <input type="email" value={profile?.normalized_email || ''} disabled className="w-full px-3 py-2.5 text-sm bg-cream-50 border border-ink-200 rounded-lg text-ink-400" />
          </div>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
          </button>
          {savedMsg && <p className="text-sm text-green-600">{savedMsg}</p>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-ink-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold font-display text-charcoal-800 flex items-center gap-2"><MapPin className="w-4 h-4 text-orange-500" /> Saved Addresses</h2>
          <button onClick={() => setShowAddAddr(!showAddAddr)} className="text-sm text-orange-600 font-medium flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        {showAddAddr && (
          <div className="mb-4 p-3 border border-ink-200 rounded-lg space-y-2 animate-fade-in">
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={newAddr.label} onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })} placeholder="Label" className="px-3 py-2 text-sm border border-ink-200 rounded-lg" />
              <input type="text" value={newAddr.recipient_name} onChange={(e) => setNewAddr({ ...newAddr, recipient_name: e.target.value })} placeholder="Recipient" className="px-3 py-2 text-sm border border-ink-200 rounded-lg" />
            </div>
            <input type="tel" value={newAddr.phone} onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })} placeholder="Phone" className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg" />
            <input type="text" value={newAddr.address_line} onChange={(e) => setNewAddr({ ...newAddr, address_line: e.target.value })} placeholder="Address line" className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg" />
            <div className="grid grid-cols-3 gap-2">
              <input type="text" value={newAddr.city} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} placeholder="City" className="px-3 py-2 text-sm border border-ink-200 rounded-lg" />
              <input type="text" value={newAddr.state} onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })} placeholder="State" className="px-3 py-2 text-sm border border-ink-200 rounded-lg" />
              <input type="text" value={newAddr.postal_code} onChange={(e) => setNewAddr({ ...newAddr, postal_code: e.target.value })} placeholder="PIN" className="px-3 py-2 text-sm border border-ink-200 rounded-lg" />
            </div>
            <button onClick={handleAddAddress} className="px-4 py-2 bg-charcoal-800 text-white text-sm font-medium rounded-lg">Save Address</button>
          </div>
        )}
        {addresses.length > 0 ? (
          <div className="space-y-2">
            {addresses.map((addr) => (
              <div key={addr.id} className="flex items-start justify-between p-3 border border-ink-100 rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-ink-800">{addr.label} — {addr.recipient_name}</p>
                  <p className="text-xs text-ink-500 mt-0.5">{addr.address_line}, {addr.city}, {addr.state} - {addr.postal_code}</p>
                  <p className="text-xs text-ink-400">{addr.phone}</p>
                </div>
                <button onClick={() => handleDeleteAddress(addr.id)} className="text-ink-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-400 text-center py-4">No saved addresses</p>
        )}
      </div>
    </div>
  );
}
