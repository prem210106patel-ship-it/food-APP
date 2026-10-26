import { useEffect, useState, useCallback } from 'react';
import { Check, X, Loader2, Clock, Filter } from 'lucide-react';
import { supabase, formatCurrency, formatDateTime } from '../../../lib/supabase.js';
import { useAuth } from '../../../lib/auth.jsx';
import { ORDER_STATUSES } from '../../../lib/utils.js';

const STATUS_FLOW = {
  pending: ['confirmed', 'rejected'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready'],
  ready: ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
  rejected: [],
};

export default function RestaurantOrders() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [items, setItems] = useState([]);

  const load = useCallback(async () => {
    if (!user) return;
    if (!restaurant) {
      const { data: rest } = await supabase.from('restaurants').select('*').eq('owner_id', user.id).maybeSingle();
      if (!rest) { setLoading(false); return; }
      setRestaurant(rest);
    }
    const restId = restaurant?.id;
    if (!restId) return;
    setLoading(true);
    let query = supabase.from('orders').select('*, customer:profiles(name), table:restaurant_tables(table_number)').eq('restaurant_id', restId).order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);
    const { data } = await query.limit(30);
    setOrders(data || []);
    setLoading(false);
  }, [user, restaurant, filter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (orderId, newStatus) => {
    const order = orders.find(o => o.id === orderId);
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (!error) {
      await supabase.from('order_status_history').insert({
        order_id: orderId,
        previous_status: order.status,
        new_status: newStatus,
        changed_by: user.id,
      });
      load();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    }
  };

  const viewOrder = async (order) => {
    setSelectedOrder(order);
    const { data } = await supabase.from('order_items').select('*').eq('order_id', order.id);
    setItems(data || []);
  };

  if (loading && orders.length === 0) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-orange-500 animate-spin" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-extrabold font-display text-charcoal-800 mb-6">Orders</h1>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button onClick={() => setFilter('all')} className={`px-3.5 py-1.5 text-sm font-medium rounded-full whitespace-nowrap ${filter === 'all' ? 'bg-orange-500 text-white' : 'bg-white border border-ink-200 text-ink-600'}`}>All</button>
        {Object.entries(ORDER_STATUSES).map(([k, v]) => (
          <button key={k} onClick={() => setFilter(k)} className={`px-3.5 py-1.5 text-sm font-medium rounded-full whitespace-nowrap ${filter === k ? 'bg-orange-500 text-white' : 'bg-white border border-ink-200 text-ink-600'}`}>{v.label}</button>
        ))}
      </div>

      {orders.length > 0 ? (
        <div className="space-y-2">
          {orders.map((o) => (
            <div key={o.id} className="bg-white rounded-xl border border-ink-100 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 cursor-pointer" onClick={() => viewOrder(o)}>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-charcoal-800">#{o.order_number}</p>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${o.order_type === 'dine_in' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {o.order_type === 'dine_in' ? `Dine-in ${o.table?.table_number || ''}` : 'Delivery'}
                    </span>
                  </div>
                  <p className="text-xs text-ink-400 mt-1">{o.customer?.name || 'Guest'} • {formatDateTime(o.created_at)}</p>
                  <p className="text-xs text-ink-500 mt-1">{o.payment_method} • {o.payment_status}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-orange-600 text-sm">{formatCurrency(o.total)}</p>
                    <span className={`text-xs font-semibold ${o.status === 'delivered' ? 'text-green-600' : o.status === 'cancelled' || o.status === 'rejected' ? 'text-red-600' : 'text-amber-600'}`}>{ORDER_STATUSES[o.status]?.label}</span>
                  </div>
                  <div className="flex gap-1">
                    {(STATUS_FLOW[o.status] || []).map((next) => (
                      <button
                        key={next}
                        onClick={() => updateStatus(o.id, next)}
                        className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg ${
                          next === 'rejected' || next === 'cancelled' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {next === 'rejected' ? <X className="w-3.5 h-3.5" /> : next === 'cancelled' ? 'Cancel' : ORDER_STATUSES[next]?.label}
                      </button>
                    ))}
                    <button onClick={() => viewOrder(o)} className="px-2.5 py-1.5 text-xs bg-ink-100 text-ink-600 rounded-lg hover:bg-ink-200">Details</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-ink-100"><Clock className="w-10 h-10 text-ink-200 mx-auto mb-2" /><p className="text-ink-400">No orders found</p></div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-5 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold font-display text-charcoal-800">Order #{selectedOrder.order_number}</h2>
              <button onClick={() => setSelectedOrder(null)}><X className="w-5 h-5 text-ink-400" /></button>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm"><span className="text-ink-500">Customer</span><span className="font-medium">{selectedOrder.customer?.name || selectedOrder.customer_name_snapshot}</span></div>
              <div className="flex justify-between text-sm"><span className="text-ink-500">Phone</span><span className="font-medium">{selectedOrder.customer_phone_snapshot || '—'}</span></div>
              {selectedOrder.delivery_address_snapshot && (
                <div className="text-sm"><span className="text-ink-500 block mb-1">Address</span><span className="text-ink-700">{selectedOrder.delivery_address_snapshot.address_line}, {selectedOrder.delivery_address_snapshot.city}</span></div>
              )}
              {selectedOrder.special_instructions && <div className="text-sm"><span className="text-ink-500 block mb-1">Instructions</span><span className="text-ink-700">{selectedOrder.special_instructions}</span></div>}
            </div>
            <h3 className="font-semibold text-sm text-charcoal-800 mb-2">Items</h3>
            <div className="space-y-1.5 mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-ink-700">{item.quantity}× {item.food_name_snapshot}</span>
                  <span className="font-medium">{formatCurrency(item.line_total)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-ink-100 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-ink-500">Subtotal</span><span>{formatCurrency(selectedOrder.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Delivery</span><span>{selectedOrder.delivery_fee > 0 ? formatCurrency(selectedOrder.delivery_fee) : 'Free'}</span></div>
              {selectedOrder.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(selectedOrder.discount)}</span></div>}
              <div className="flex justify-between font-bold"><span className="text-charcoal-800">Total</span><span className="text-orange-600">{formatCurrency(selectedOrder.total)}</span></div>
            </div>
            {STATUS_FLOW[selectedOrder.status]?.length > 0 && (
              <div className="flex gap-2 mt-4">
                {STATUS_FLOW[selectedOrder.status].map((next) => (
                  <button key={next} onClick={() => { updateStatus(selectedOrder.id, next); }} className={`flex-1 py-2 text-sm font-semibold rounded-lg ${next === 'rejected' || next === 'cancelled' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                    {ORDER_STATUSES[next]?.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
