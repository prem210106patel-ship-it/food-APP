import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, TrendingUp, Clock, Utensils, AlertCircle, Store } from 'lucide-react';
import { supabase, formatCurrency, formatDateTime } from '../../../lib/supabase.js';
import { useAuth } from '../../../lib/auth.jsx';
import { ORDER_STATUSES } from '../../../lib/utils.js';

export default function RestaurantDashboard() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [stats, setStats] = useState({ todayOrders: 0, todayRevenue: 0, pendingOrders: 0, totalFoods: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noRestaurant, setNoRestaurant] = useState(false);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const { data: rest } = await supabase.from('restaurants').select('*').eq('owner_id', user.id).maybeSingle();
      if (!rest) {
        setNoRestaurant(true);
        setLoading(false);
        return;
      }
      setRestaurant(rest);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [ordersRes, todayRes, pendingRes, foodsRes] = await Promise.all([
        supabase.from('orders').select('*, customer:profiles(name)').eq('restaurant_id', rest.id).order('created_at', { ascending: false }).limit(6),
        supabase.from('orders').select('total').eq('restaurant_id', rest.id).gte('created_at', today.toISOString()),
        supabase.from('orders').select('id').eq('restaurant_id', rest.id).eq('status', 'pending'),
        supabase.from('foods').select('id', { count: 'exact', head: true }).eq('restaurant_id', rest.id),
      ]);

      const todayOrders = todayRes.data || [];
      setStats({
        todayOrders: todayOrders.length,
        todayRevenue: todayOrders.reduce((s, o) => s + o.total, 0),
        pendingOrders: pendingRes.data?.length || 0,
        totalFoods: foodsRes.count || 0,
      });
      setRecentOrders(ordersRes.data || []);
      setLoading(false);
    }
    load();
  }, [user]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

  if (noRestaurant) {
    return (
      <div className="text-center py-20">
        <Store className="w-12 h-12 text-ink-200 mx-auto mb-3" />
        <p className="text-lg font-bold text-charcoal-800">No restaurant assigned</p>
        <p className="text-sm text-ink-400 mt-1">Contact the admin to assign a restaurant to your account.</p>
      </div>
    );
  }

  const cards = [
    { label: 'Today\'s Orders', value: stats.todayOrders, icon: ShoppingCart, color: 'bg-blue-500' },
    { label: 'Today\'s Revenue', value: formatCurrency(stats.todayRevenue), icon: TrendingUp, color: 'bg-green-500' },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: 'bg-amber-500' },
    { label: 'Menu Items', value: stats.totalFoods, icon: Utensils, color: 'bg-orange-500' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold font-display text-charcoal-800">{restaurant.name}</h1>
        <p className="text-sm text-ink-400 mt-0.5">Dashboard overview</p>
        <span className={`inline-block mt-2 px-2.5 py-1 text-xs font-semibold rounded-full ${restaurant.approval_status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
          {restaurant.approval_status === 'approved' ? 'Approved' : 'Pending approval'}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-ink-100 p-5">
            <div className={`w-10 h-10 ${c.color} rounded-lg flex items-center justify-center mb-3`}>
              <c.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-xl font-bold font-display text-charcoal-800">{c.value}</p>
            <p className="text-xs text-ink-400 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {restaurant.approval_status !== 'approved' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">Your restaurant is pending admin approval. Customers can't see it yet.</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-ink-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold font-display text-charcoal-800">Recent Orders</h2>
          <Link to="/restaurant/orders" className="text-sm text-orange-600 font-medium">View all</Link>
        </div>
        {recentOrders.length > 0 ? (
          <div className="space-y-2">
            {recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between py-2 border-b border-ink-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-ink-800">#{o.order_number}</p>
                  <p className="text-xs text-ink-400">{o.customer?.name || 'Guest'} • {formatDateTime(o.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${o.status === 'delivered' ? 'bg-green-100 text-green-700' : o.status === 'cancelled' || o.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {ORDER_STATUSES[o.status]?.label}
                  </span>
                  <span className="font-bold text-orange-600 text-sm">{formatCurrency(o.total)}</span>
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
