import { useEffect, useState } from 'react';
import { Users as UsersIcon, Loader2, Search } from 'lucide-react';
import { supabase } from '../../../lib/supabase.js';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setUsers(data || []); setLoading(false); });
  }, []);

  const filtered = users.filter(u => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.normalized_email?.includes(search.toLowerCase()));

  const updateRole = async (id, role) => {
    await supabase.from('profiles').update({ role }).eq('id', id);
    setUsers(users.map(u => u.id === id ? { ...u, role } : u));
  };

  const toggleStatus = async (u) => {
    const newStatus = u.account_status === 'active' ? 'suspended' : 'active';
    await supabase.from('profiles').update({ account_status: newStatus }).eq('id', u.id);
    setUsers(users.map(x => x.id === u.id ? { ...x, account_status: newStatus } : x));
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-orange-500 animate-spin" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-extrabold font-display text-charcoal-800 mb-6">User Management</h1>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="w-full sm:max-w-md pl-10 pr-4 py-2.5 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400" />
      </div>
      <div className="bg-white rounded-xl border border-ink-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-50 text-ink-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-cream-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">{u.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                      <span className="font-medium text-ink-800">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-ink-500">{u.normalized_email}</td>
                  <td className="px-4 py-3">
                    <select value={u.role} onChange={(e) => updateRole(u.id, e.target.value)} className="px-2 py-1 text-xs border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400">
                      <option value="customer">Customer</option>
                      <option value="restaurant_owner">Owner</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleStatus(u)} className={`px-2.5 py-1 text-xs font-semibold rounded-full ${u.account_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.account_status}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {filtered.length === 0 && <div className="text-center py-12 text-ink-400"><UsersIcon className="w-10 h-10 mx-auto mb-2 text-ink-200" />No users found</div>}
    </div>
  );
}
