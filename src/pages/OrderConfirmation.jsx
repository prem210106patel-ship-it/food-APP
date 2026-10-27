import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Package, Clock, MapPin, ArrowRight, QrCode as QrIcon, Download, Loader2, Info } from 'lucide-react';
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
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTrackQR, setShowTrackQR] = useState(false);

  const loadOrder = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, restaurant:restaurants(*)')
      .eq('order_number', orderNumber)
      .maybeSingle();

    if (data) {
      setOrder(data);
      setRestaurant(data.restaurant);
      const [itemsRes, payRes] = await Promise.all([
        supabase.from('order_items').select('*').eq('order_id', data.id),
        supabase.from('payments').select('*').eq('order_id', data.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);
      setItems(itemsRes.data || []);
      if (payRes.data) setPayment(payRes.data);
    }
    setLoading(false);
  }, [orderNumber]);

  useEffect(() => {
    loadOrder();
    const interval = setInterval(loadOrder, 8000);
    return () => clearInterval(interval);
  }, [loadOrder]);

  const downloadQR = (svgId, filename) => {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

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
  const isUpi = order.payment_method === 'upi_qr';
  const isPaid = order.payment_status === 'paid';
  const upiVpa = restaurant?.upi_vpa;
  const upiAmount = (order.total / 100).toFixed(2);
  const upiId = upiVpa || 'foodiehub@upi';
  const upiNote = `FoodieHub Order ${order.order_number}`;
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(restaurant?.name || 'FoodieHub')}&am=${upiAmount}&cu=INR&tn=${encodeURIComponent(upiNote)}`;
  const paymentStatusBadge = isPaid
    ? { text: 'Payment Verified', cls: 'bg-green-100 text-green-700' }
    : { text: 'Payment Pending Verification', cls: 'bg-amber-100 text-amber-700' };

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
          <div className="flex justify-between items-center">
            <span className="text-ink-500">Payment status</span>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${paymentStatusBadge.cls}`}>{paymentStatusBadge.text}</span>
          </div>
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

      {isUpi && (
        <div className="bg-white rounded-xl border border-ink-100 p-5 mb-4">
          <h2 className="font-bold font-display text-charcoal-800 mb-3 flex items-center gap-2"><QrIcon className="w-5 h-5 text-orange-500" /> UPI Payment</h2>
          {isPaid ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-700">Payment verified</p>
                <p className="text-xs text-green-600 mt-0.5">The restaurant confirmed your UPI payment. You'll receive your order shortly.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-white border-2 border-orange-200 rounded-xl">
                  <QRCodeSVG id="upi-qr-svg" value={upiDeepLink} size={170} level="M" />
                </div>
                <button onClick={() => downloadQR('upi-qr-svg', `upi-payment-${order.order_number}.svg`)} className="flex items-center gap-1.5 text-xs text-orange-600 font-medium">
                  <Download className="w-3.5 h-3.5" /> Download QR
                </button>
              </div>
              <div className="flex-1 w-full">
                <div className="space-y-1.5 text-sm mb-3">
                  <div className="flex justify-between"><span className="text-ink-500">Amount</span><span className="font-bold text-orange-600">{formatCurrency(order.total)}</span></div>
                  <div className="flex justify-between"><span className="text-ink-500">Pay to</span><span className="font-mono text-xs text-ink-700">{upiId}</span></div>
                  <div className="flex justify-between"><span className="text-ink-500">Reference</span><span className="font-mono text-xs text-ink-700">{order.order_number}</span></div>
                </div>
                <a href={upiDeepLink} className="block text-center w-full py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 mb-2">
                  Open in UPI App
                </a>
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Pay using any UPI app (GPay, PhonePe, Paytm). Your payment stays <strong>pending</strong> until the restaurant verifies it. Do not share OTPs — FoodieHub will never ask for one.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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
            <button onClick={() => setShowTrackQR(!showTrackQR)} className="text-sm text-orange-600 font-medium">{showTrackQR ? 'Hide' : 'Show QR'}</button>
          </div>
          {showTrackQR && (
            <div className="flex flex-col items-center gap-3 animate-fade-in">
              <div className="p-4 bg-white border-2 border-orange-200 rounded-xl">
                <QRCodeSVG id="track-qr-svg" value={trackingUrl} size={180} level="M" />
              </div>
              <p className="text-xs text-ink-400 text-center max-w-xs">Scan this QR code to track your order status. The link is secure and tied to this order only.</p>
              <div className="flex gap-3">
                <button onClick={() => downloadQR('track-qr-svg', `track-${order.order_number}.svg`)} className="text-sm text-orange-600 font-medium flex items-center gap-1">
                  <Download className="w-4 h-4" /> Download
                </button>
                <a href={trackingUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-orange-600 font-medium flex items-center gap-1">
                  Open tracking page <ArrowRight className="w-4 h-4" />
                </a>
              </div>
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
