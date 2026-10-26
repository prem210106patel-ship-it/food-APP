import { useEffect, useState } from 'react';
import { Users, Store, ShoppingCart, TrendingUp, Loader2 } from 'lucide-react';
import { supabase, formatCurrency } from '../../../lib/supabase.js';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [usersRes, restRes, ordersRes, pendingRes, recentRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('restaurants').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending'),
        supabase.from('orders').select('*, restaurant:restaurants(name), customer:profiles(name)').order('created_at', { ascending: false }).limit(8),
      ]);

      setStats({
        users: usersRes.count || 0,
        restaurants: restRes.count || 0,
        orders: ordersRes.count || 0,
        pendingApprovals: pendingRes.count || 0,
      });
      setRecentOrders(recentRes.data || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-orange-500 animate-spin" /></div>;

  const cards = [
    { label: 'Total Users', value: stats.users, icon: Users, color: 'bg-blue-500' },
    { label: 'Restaurants', value: stats.restaurants, icon: Store, color: 'bg-orange-500' },
    { label: 'Total Orders', value: stats.orders, icon: ShoppingCart, color: 'bg-green-500' },
    { label: 'Pending Approvals', value: stats.pendingApprovals, icon: TrendingUp, color: 'bg-amber-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold font-display text-charcoal-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-ink-100 p-5">
            <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold font-display text-charcoal-800">{card.value}</p>
            <p className="text-xs text-ink-400 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-ink-100 p-5">
        <h2 className="font-bold font-display text-charcoal-800 mb-4">Recent Orders</h2>
        {recentOrders.length > 0 ? (
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-ink-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-ink-800">#{order.order_number}</p>
                  <p className="text-xs text-ink-400">{order.restaurant?.name} • {order.customer?.name || 'Guest'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-orange-600 text-sm">{formatCurrency(order.total)}</p>
                  <p className="text-xs text-ink-400 capitalize">{order.status}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-400 text-center py-6">No orders yet</p>
        )}
      </div>
    </div>
  );
}
