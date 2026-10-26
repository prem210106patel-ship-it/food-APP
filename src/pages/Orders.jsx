import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, ChevronRight, Search } from 'lucide-react';
import { supabase, formatCurrency, formatDateTime } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { ORDER_STATUSES, PAYMENT_STATUSES, PAYMENT_METHODS } from '../lib/utils.js';

export default function Orders() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user) {
      if (!authLoading) setLoading(false);
      return;
    }
    async function loadOrders() {
      const { data } = await supabase
        .from('orders')
        .select('*, restaurant:restaurants(name, slug)')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
      setOrders(data || []);
      setLoading(false);
    }
    loadOrders();
  }, [user, authLoading]);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  if (!user && !authLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-xl font-bold text-charcoal-800">Please sign in to view your orders</p>
        <Link to="/login" className="mt-4 inline-block px-5 py-2.5 bg-orange-500 text-white font-semibold rounded-xl">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-extrabold font-display text-charcoal-800 mb-6">My Orders</h1>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        <button onClick={() => setFilter('all')} className={`px-3.5 py-1.5 text-sm font-medium rounded-full whitespace-nowrap ${filter === 'all' ? 'bg-orange-500 text-white' : 'bg-white border border-ink-200 text-ink-600'}`}>All</button>
        {Object.entries(ORDER_STATUSES).map(([key, { label }]) => (
          <button key={key} onClick={() => setFilter(key)} className={`px-3.5 py-1.5 text-sm font-medium rounded-full whitespace-nowrap ${filter === key ? 'bg-orange-500 text-white' : 'bg-white border border-ink-200 text-ink-600'}`}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 skeleton rounded-xl" />)}</div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((order) => (
            <Link key={order.id} to={`/order/${order.order_number}`} className="block bg-white rounded-xl border border-ink-100 p-4 hover:border-orange-200 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="w-4 h-4 text-orange-500 shrink-0" />
                    <span className="font-semibold text-sm text-charcoal-800">{order.restaurant?.name}</span>
                  </div>
                  <p className="text-xs text-ink-400">#{order.order_number}</p>
                  <p className="text-xs text-ink-400 flex items-center gap-1 mt-1"><Clock className="w-3 h-3" /> {formatDateTime(order.created_at)}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full mb-1 ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    order.status === 'cancelled' || order.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    order.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                  }`}>{ORDER_STATUSES[order.status]?.label}</span>
                  <p className="font-bold text-orange-600 text-sm">{formatCurrency(order.total)}</p>
                  <p className="text-xs text-ink-400">{PAYMENT_METHODS[order.payment_method]}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-ink-300 shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-ink-100">
          <Search className="w-12 h-12 text-ink-200 mx-auto mb-3" />
          <p className="text-ink-500 font-medium">No orders yet</p>
          <p className="text-sm text-ink-400 mt-1">Your order history will appear here</p>
          <Link to="/restaurants" className="mt-4 inline-block px-5 py-2.5 bg-orange-500 text-white font-semibold rounded-xl">Browse Restaurants</Link>
        </div>
      )}
    </div>
  );
}
