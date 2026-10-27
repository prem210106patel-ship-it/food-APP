import { useEffect, useState, useCallback } from 'react';
import { Check, X, Store, Loader2, Search } from 'lucide-react';
import { supabase, formatCurrency } from '../../lib/supabase.js';

export default function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('restaurants').select('*, owner:profiles(name, normalized_email)').order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('approval_status', filter);
    const { data } = await query;
    setRestaurants(data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    const { error } = await supabase.from('restaurants').update({ approval_status: status }).eq('id', id);
    if (!error) load();
  };

  const toggleAvailability = async (r) => {
    const newStatus = r.availability_status === 'open' ? 'closed' : 'open';
    await supabase.from('restaurants').update({ availability_status: newStatus }).eq('id', r.id);
    load();
  };

  const filtered = restaurants.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <h1 className="text-2xl font-extrabold font-display text-charcoal-800 mb-6">Restaurant Management</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search restaurants..." className="w-full pl-10 pr-4 py-2.5 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2.5 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400">
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-orange-500 animate-spin" /></div>
      ) : filtered.length > 0 ? (
        <div className="bg-white rounded-xl border border-ink-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 text-ink-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Restaurant</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Owner</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Cuisine</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-cream-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                          <Store className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-ink-800">{r.name}</p>
                          <p className="text-xs text-ink-400">{r.city}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-ink-600">{r.owner?.name || '—'}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-ink-500 text-xs">{(r.cuisine || []).join(', ')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        r.approval_status === 'approved' ? 'bg-green-100 text-green-700' :
                        r.approval_status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>{r.approval_status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.approval_status !== 'approved' && (
                          <button onClick={() => updateStatus(r.id, 'approved')} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100" title="Approve">
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {r.approval_status !== 'rejected' && (
                          <button onClick={() => updateStatus(r.id, 'rejected')} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Reject">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => toggleAvailability(r)} className={`px-2 py-1 text-xs rounded-lg ${r.availability_status === 'open' ? 'bg-green-100 text-green-700' : 'bg-ink-100 text-ink-500'}`}>
                          {r.availability_status === 'open' ? 'Open' : 'Closed'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-ink-100">
          <Store className="w-10 h-10 text-ink-200 mx-auto mb-2" />
          <p className="text-ink-400">No restaurants found</p>
        </div>
      )}
    </div>
  );
}
