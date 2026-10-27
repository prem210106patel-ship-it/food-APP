import { useEffect, useState, useCallback } from 'react';
import { ShoppingCart, Loader2, Search } from 'lucide-react';
import { supabase, formatCurrency, formatDateTime } from '../../lib/supabase.js';
import { ORDER_STATUSES, PAYMENT_METHODS } from '../../lib/utils.js';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('orders').select('*, restaurant:restaurants(name), customer:profiles(name)').order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);
    const { data } = await query.limit(50);
    setOrders(data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter(o => !search || o.order_number?.includes(search) || o.restaurant?.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <h1 className="text-2xl font-extrabold font-display text-charcoal-800 mb-6">Order Oversight</h1>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by order number or restaurant..." className="w-full pl-10 pr-4 py-2.5 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2.5 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400">
          <option value="all">All Status</option>
          {Object.entries(ORDER_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-orange-500 animate-spin" /></div>
      ) : filtered.length > 0 ? (
        <div className="bg-white rounded-xl border border-ink-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-50 text-ink-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Order</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Restaurant</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Customer</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Payment</th>
                <th className="text-right px-4 py-3 font-medium">Total</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-cream-50/50">
                  <td className="px-4 py-3 font-medium text-ink-800">#{o.order_number}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-ink-600">{o.restaurant?.name}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-ink-500">{o.customer?.name || 'Guest'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${o.status === 'delivered' ? 'bg-green-100 text-green-700' : o.status === 'cancelled' || o.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{ORDER_STATUSES[o.status]?.label}</span></td>
                  <td className="px-4 py-3 text-xs text-ink-500">{PAYMENT_METHODS[o.payment_method]}<br/><span className="text-ink-400">{o.payment_status}</span></td>
                  <td className="px-4 py-3 text-right font-bold text-orange-600">{formatCurrency(o.total)}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-ink-400">{formatDateTime(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-ink-100"><ShoppingCart className="w-10 h-10 text-ink-200 mx-auto mb-2" /><p className="text-ink-400">No orders found</p></div>
      )}
    </div>
  );
}
