import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Package, Clock, MapPin, ArrowRight, QrCode as QrIcon, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase, formatCurrency, formatDateTime } from '../lib/supabase.js';
import { ORDER_STATUSES, PAYMENT_METHODS } from '../lib/utils.js';

export default function OrderConfirmation() {
  const { orderNumber } = useParams();
  const [searchParams] = useSearchParams();
  const trackingToken = searchParams.get('token');
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      const { data, error } = await supabase
        .from('orders')
        .select('*, restaurant:restaurants(*)')
        .eq('order_number', orderNumber)
        .maybeSingle();

      if (data) {
        setOrder(data);
        setRestaurant(data.restaurant);
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', data.id);
        setItems(itemsData || []);
      }
      setLoading(false);
    }
    loadOrder();
  }, [orderNumber]);

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-20"><div className="h-48 skeleton rounded-2xl" /></div>;
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-xl font-bold text-charcoal-800">Order not found</p>
        <Link to="/orders" className="mt-4 inline-block text-orange-600 font-medium">View your orders</Link>
      </div>
    );
  }

  const trackingUrl = trackingToken ? `${window.location.origin}/track/${trackingToken}` : null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-6 animate-fade-in-up">
        <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-3">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-extrabold font-display text-charcoal-800">Order Placed Successfully!</h1>
        <p className="text-sm text-ink-500 mt-1">Order #{order.order_number}</p>
      </div>

      <div className="bg-white rounded-xl border border-ink-100 p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <Package className="w-5 h-5 text-orange-500" />
          <h2 className="font-bold font-display text-charcoal-800">Order Details</h2>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-ink-500">Restaurant</span><span className="font-medium text-ink-800">{restaurant?.name}</span></div>
          <div className="flex justify-between"><span className="text-ink-500">Status</span><span className="font-medium text-orange-600">{ORDER_STATUSES[order.status]?.label}</span></div>
          <div className="flex justify-between"><span className="text-ink-500">Payment</span><span className="font-medium text-ink-800">{PAYMENT_METHODS[order.payment_method]}</span></div>
          <div className="flex justify-between"><span className="text-ink-500">Placed at</span><span className="font-medium text-ink-800">{formatDateTime(order.created_at)}</span></div>
          {order.delivery_address_snapshot && (
            <div className="pt-2 border-t border-ink-100">
              <p className="text-ink-500 flex items-center gap-1 mb-1"><MapPin className="w-3.5 h-3.5" /> Delivery to</p>
              <p className="text-ink-800 font-medium">{order.delivery_address_snapshot.address_line}</p>
              <p className="text-ink-500 text-xs">{order.delivery_address_snapshot.city}, {order.delivery_address_snapshot.state} - {order.delivery_address_snapshot.postal_code}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-ink-100 p-5 mb-4">
        <h2 className="font-bold font-display text-charcoal-800 mb-3">Items</h2>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-ink-700">{item.quantity}× {item.food_name_snapshot}</span>
              <span className="font-medium">{formatCurrency(item.line_total)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-ink-100 mt-3 pt-3 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-ink-500">Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-ink-500">Delivery</span><span>{order.delivery_fee > 0 ? formatCurrency(order.delivery_fee) : 'Free'}</span></div>
          {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(order.discount)}</span></div>}
          <div className="flex justify-between font-bold text-base pt-1"><span className="text-charcoal-800">Total</span><span className="text-orange-600">{formatCurrency(order.total)}</span></div>
        </div>
      </div>

      {trackingUrl && (
        <div className="bg-white rounded-xl border border-ink-100 p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold font-display text-charcoal-800 flex items-center gap-2"><QrIcon className="w-5 h-5 text-orange-500" /> Track Your Order</h2>
            <button onClick={() => setShowQR(!showQR)} className="text-sm text-orange-600 font-medium">{showQR ? 'Hide' : 'Show QR'}</button>
          </div>
          {showQR && (
            <div className="flex flex-col items-center gap-3 animate-fade-in">
              <div className="p-4 bg-white border-2 border-orange-200 rounded-xl">
                <QRCodeSVG value={trackingUrl} size={180} level="M" />
              </div>
              <p className="text-xs text-ink-400 text-center max-w-xs">Scan this QR code to track your order status. The link is secure and tied to this order only.</p>
              <a href={trackingUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-orange-600 font-medium flex items-center gap-1">
                Open tracking page <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <Link to="/orders" className="flex-1 py-3 bg-charcoal-800 text-white font-semibold rounded-xl hover:bg-charcoal-700 text-center text-sm">
          View All Orders
        </Link>
        <Link to="/restaurants" className="flex-1 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 text-center text-sm">
          Continue Ordering
        </Link>
      </div>
    </div>
  );
}
