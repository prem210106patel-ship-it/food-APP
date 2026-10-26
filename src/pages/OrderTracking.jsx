import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle, Loader2, AlertCircle, Store } from 'lucide-react';
import { supabase, formatCurrency, formatDateTime } from '../lib/supabase.js';
import { ORDER_STATUSES, PAYMENT_METHODS, hashToken } from '../lib/utils.js';

export default function OrderTracking() {
  const { token } = useParams();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOrder = useCallback(async () => {
    if (!token) {
      setError('Invalid tracking link');
      setLoading(false);
      return;
    }
    const tokenHash = await hashToken(token);
    const { data, err } = await supabase
      .from('orders')
      .select('*, restaurant:restaurants(name, slug)')
      .eq('tracking_token_hash', tokenHash)
      .maybeSingle();

    if (err || !data) {
      setError('Order not found or tracking link is invalid');
      setLoading(false);
      return;
    }
    setOrder(data);

    const [itemsRes, histRes] = await Promise.all([
      supabase.from('order_items').select('*').eq('order_id', data.id),
      supabase.from('order_status_history').select('*').eq('order_id', data.id).order('created_at', { ascending: true }),
    ]);
    setItems(itemsRes.data || []);
    setHistory(histRes.data || []);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    loadOrder();
    const interval = setInterval(loadOrder, 10000);
    return () => clearInterval(interval);
  }, [loadOrder]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-xl font-bold text-charcoal-800">{error}</p>
        <Link to="/" className="mt-4 inline-block text-orange-600 font-medium">Go home</Link>
      </div>
    );
  }

  const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
  const currentIdx = statusOrder.indexOf(order.status);
  const isCancelled = order.status === 'cancelled' || order.status === 'rejected';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl border border-ink-100 p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-extrabold font-display text-charcoal-800">Track Order</h1>
            <p className="text-sm text-ink-400">#{order.order_number}</p>
          </div>
          <span className={`px-3 py-1.5 text-sm font-semibold rounded-full ${
            order.status === 'delivered' ? 'bg-green-100 text-green-700' :
            isCancelled ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
          }`}>{ORDER_STATUSES[order.status]?.label}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-ink-500">
          <Store className="w-4 h-4 text-orange-500" /> {order.restaurant?.name}
        </div>
      </div>

      {!isCancelled ? (
        <div className="bg-white rounded-2xl border border-ink-100 p-6 mb-4">
          <h2 className="font-bold font-display text-charcoal-800 mb-4">Order Progress</h2>
          <div className="space-y-0">
            {statusOrder.map((status, idx) => {
              const isDone = idx <= currentIdx;
              const isCurrent = idx === currentIdx;
              const histEntry = history.find(h => h.new_status === status);
              return (
                <div key={status} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isDone ? 'bg-green-500 text-white' : 'bg-ink-100 text-ink-300'
                    } ${isCurrent ? 'ring-4 ring-green-100' : ''}`}>
                      {isDone ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    {idx < statusOrder.length - 1 && (
                      <div className={`w-0.5 h-8 ${idx < currentIdx ? 'bg-green-500' : 'bg-ink-100'}`} />
                    )}
                  </div>
                  <div className="pt-1 pb-8">
                    <p className={`text-sm font-medium ${isDone ? 'text-charcoal-800' : 'text-ink-400'}`}>
                      {ORDER_STATUSES[status]?.label}
                    </p>
                    {histEntry && (
                      <p className="text-xs text-ink-400 mt-0.5">{formatDateTime(histEntry.created_at)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-red-50 rounded-2xl border border-red-200 p-6 mb-4 text-center">
          <XCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
          <p className="font-bold text-red-700">This order was {order.status === 'rejected' ? 'rejected' : 'cancelled'}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-ink-100 p-6 mb-4">
        <h2 className="font-bold font-display text-charcoal-800 mb-3">Items</h2>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-ink-700">{item.quantity}× {item.food_name_snapshot}</span>
              <span className="font-medium">{formatCurrency(item.line_total)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-ink-100 mt-3 pt-3 flex justify-between">
          <span className="font-bold text-charcoal-800">Total</span>
          <span className="font-bold text-orange-600">{formatCurrency(order.total)}</span>
        </div>
        <p className="text-xs text-ink-400 mt-2">{PAYMENT_METHODS[order.payment_method]} • Payment: {order.payment_status}</p>
      </div>

      <p className="text-xs text-ink-400 text-center">
        <Package className="w-3 h-3 inline mr-1" /> Placed {formatDateTime(order.created_at)} • Auto-refreshes every 10s
      </p>
    </div>
  );
}
