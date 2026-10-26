import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Tag, CheckCircle, Wallet, QrCode, Banknote, MapPin } from 'lucide-react';
import { useCart } from '../lib/cart.jsx';
import { useAuth } from '../lib/auth.jsx';
import { supabase, formatCurrency } from '../lib/supabase.js';
import { generateOrderNumber, hashToken, generateToken, calculateDiscount } from '../lib/utils.js';

export default function Checkout() {
  const { items, restaurantId, restaurantName, restaurantDeliveryFee, subtotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [customerName, setCustomerName] = useState(profile?.name || '');
  const [customerPhone, setCustomerPhone] = useState(profile?.phone || '');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);

  const [newAddress, setNewAddress] = useState({ label: 'Home', recipient_name: '', phone: '', address_line: '', city: 'Bengaluru', state: 'Karnataka', postal_code: '' });
  const [showNewAddress, setShowNewAddress] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
      return;
    }
    if (!user) {
      navigate('/login?redirect=/checkout');
      return;
    }
    if (profile?.name) setCustomerName(profile.name);
    if (profile?.phone) setCustomerPhone(profile.phone || '');
  }, [items, user, profile, navigate]);

  useEffect(() => {
    if (user) {
      supabase.from('addresses').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        .then(({ data }) => {
          setAddresses(data || []);
          if (data && data.length > 0) setSelectedAddressId(data[0].id);
          else setShowNewAddress(true);
        });
    }
  }, [user]);

  const discount = appliedCoupon ? calculateDiscount(appliedCoupon, subtotal) : 0;
  const total = subtotal + (items.length > 0 ? restaurantDeliveryFee : 0) - discount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError('');
    setAppliedCoupon(null);

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.trim().toUpperCase())
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) {
      setCouponError('Invalid or expired coupon code');
      return;
    }
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      setCouponError('This coupon has expired');
      return;
    }
    if (data.restaurant_id && data.restaurant_id !== restaurantId) {
      setCouponError('This coupon is not valid for this restaurant');
      return;
    }
    if (subtotal < data.minimum_order_amount) {
      setCouponError(`Minimum order amount is ${formatCurrency(data.minimum_order_amount)}`);
      return;
    }
    setAppliedCoupon(data);
  };

  const handlePlaceOrder = async () => {
    setError(null);
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Please provide your name and phone number');
      return;
    }
    if (paymentMethod === 'cod' || paymentMethod === 'upi_qr') {
      let selectedAddress = addresses.find(a => a.id === selectedAddressId);
      if (!selectedAddress && showNewAddress) {
        if (!newAddress.address_line.trim() || !newAddress.postal_code.trim()) {
          setError('Please complete your delivery address');
          return;
        }
        if (user) {
          const { data, error: addrErr } = await supabase.from('addresses').insert({
            ...newAddress,
            user_id: user.id,
          }).select().single();
          if (addrErr) {
            setError('Failed to save address');
            return;
          }
          selectedAddress = data;
        }
      }
      if (!selectedAddress) {
        setError('Please select or add a delivery address');
        return;
      }

      setPlacing(true);
      try {
        const trackingToken = generateToken();
        const trackingTokenHash = await hashToken(trackingToken);
        const orderNumber = generateOrderNumber();

        const orderInsert = {
          order_number: orderNumber,
          customer_id: user.id,
          restaurant_id: restaurantId,
          order_type: 'delivery',
          status: 'pending',
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'cod' ? 'unpaid' : 'pending',
          subtotal,
          delivery_fee: restaurantDeliveryFee,
          discount,
          total,
          currency: 'INR',
          customer_name_snapshot: customerName,
          customer_phone_snapshot: customerPhone,
          delivery_address_snapshot: selectedAddress ? {
            label: selectedAddress.label,
            recipient_name: selectedAddress.recipient_name,
            phone: selectedAddress.phone,
            address_line: selectedAddress.address_line,
            city: selectedAddress.city,
            state: selectedAddress.state,
            postal_code: selectedAddress.postal_code,
          } : null,
          special_instructions: specialInstructions,
          tracking_token_hash: trackingTokenHash,
          coupon_code: appliedCoupon?.code || null,
        };

        const { data: order, error: orderErr } = await supabase.from('orders').insert(orderInsert).select().single();
        if (orderErr) throw new Error(orderErr.message);

        const orderItemsInsert = items.map(item => ({
          order_id: order.id,
          food_id: item.food_id,
          food_name_snapshot: item.name,
          unit_price: item.price,
          quantity: item.quantity,
          line_total: item.price * item.quantity,
          customization_data: item.customization || null,
          special_instructions: item.customization?.special_instructions || null,
        }));
        const { error: itemsErr } = await supabase.from('order_items').insert(orderItemsInsert);
        if (itemsErr) throw new Error(itemsErr.message);

        await supabase.from('order_status_history').insert({
          order_id: order.id,
          new_status: 'pending',
          changed_by: user.id,
        });

        await supabase.from('payments').insert({
          order_id: order.id,
          provider: paymentMethod,
          amount: total,
          currency: 'INR',
          status: paymentMethod === 'cod' ? 'pending' : 'pending',
        });

        if (appliedCoupon) {
          await supabase.from('coupon_redemptions').insert({
            coupon_id: appliedCoupon.id,
            order_id: order.id,
            user_id: user.id,
            discount_amount: discount,
          });
        }

        clearCart();
        navigate(`/order/${orderNumber}?token=${trackingToken}`);
      } catch (err) {
        setError(err.message || 'Failed to place order. Please try again.');
      } finally {
        setPlacing(false);
      }
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/cart" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-orange-600 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to cart
      </Link>
      <h1 className="text-2xl font-extrabold font-display text-charcoal-800 mb-6">Checkout</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-5">
        <div className="bg-white rounded-xl border border-ink-100 p-5">
          <h2 className="font-bold font-display text-charcoal-800 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-500" /> Contact Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full name" className="px-3 py-2.5 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400" />
            <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone number" className="px-3 py-2.5 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-ink-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold font-display text-charcoal-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-500" /> Delivery Address
            </h2>
            {addresses.length > 0 && (
              <button onClick={() => setShowNewAddress(!showNewAddress)} className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                {showNewAddress ? 'Select saved' : 'Add new'}
              </button>
            )}
          </div>
          {!showNewAddress && addresses.length > 0 ? (
            <div className="space-y-2">
              {addresses.map((addr) => (
                <label key={addr.id} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${selectedAddressId === addr.id ? 'border-orange-400 bg-orange-50' : 'border-ink-200 hover:border-orange-300'}`}>
                  <input type="radio" name="address" checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)} className="mt-1 accent-orange-500" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ink-800">{addr.label} — {addr.recipient_name}</p>
                    <p className="text-xs text-ink-500 mt-0.5">{addr.address_line}, {addr.city}, {addr.state} - {addr.postal_code}</p>
                    <p className="text-xs text-ink-400">{addr.phone}</p>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={newAddress.label} onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })} placeholder="Label (Home, Work)" className="px-3 py-2.5 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400" />
                <input type="text" value={newAddress.recipient_name} onChange={(e) => setNewAddress({ ...newAddress, recipient_name: e.target.value })} placeholder="Recipient name" className="px-3 py-2.5 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400" />
              </div>
              <input type="tel" value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} placeholder="Phone" className="w-full px-3 py-2.5 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400" />
              <input type="text" value={newAddress.address_line} onChange={(e) => setNewAddress({ ...newAddress, address_line: e.target.value })} placeholder="Address line" className="w-full px-3 py-2.5 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400" />
              <div className="grid grid-cols-3 gap-3">
                <input type="text" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} placeholder="City" className="px-3 py-2.5 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400" />
                <input type="text" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} placeholder="State" className="px-3 py-2.5 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400" />
                <input type="text" value={newAddress.postal_code} onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })} placeholder="PIN code" className="px-3 py-2.5 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400" />
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-ink-100 p-5">
          <h2 className="font-bold font-display text-charcoal-800 mb-3">Payment Method</h2>
          <div className="space-y-2">
            <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-orange-400 bg-orange-50' : 'border-ink-200 hover:border-orange-300'}`}>
              <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="accent-orange-500" />
              <Banknote className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-semibold text-ink-800">Cash on Delivery</p>
                <p className="text-xs text-ink-400">Pay with cash when your order arrives</p>
              </div>
            </label>
            <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'upi_qr' ? 'border-orange-400 bg-orange-50' : 'border-ink-200 hover:border-orange-300'}`}>
              <input type="radio" name="payment" checked={paymentMethod === 'upi_qr'} onChange={() => setPaymentMethod('upi_qr')} className="accent-orange-500" />
              <QrCode className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-semibold text-ink-800">UPI QR Payment</p>
                <p className="text-xs text-ink-400">Pay via UPI — order stays pending until verified</p>
              </div>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-ink-100 p-5">
          <h2 className="font-bold font-display text-charcoal-800 mb-3 flex items-center gap-2"><Tag className="w-4 h-4 text-orange-500" /> Coupon</h2>
          {appliedCoupon ? (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-sm text-green-700 font-medium flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {appliedCoupon.code} applied — {formatCurrency(discount)} off</span>
              <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="text-sm text-red-500">Remove</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Enter coupon code" className="flex-1 px-3 py-2.5 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400 uppercase" />
              <button onClick={handleApplyCoupon} className="px-4 py-2.5 bg-charcoal-800 text-white text-sm font-semibold rounded-lg hover:bg-charcoal-700">Apply</button>
            </div>
          )}
          {couponError && <p className="text-xs text-red-500 mt-2">{couponError}</p>}
        </div>

        <div className="bg-white rounded-xl border border-ink-100 p-5">
          <h2 className="font-bold font-display text-charcoal-800 mb-3">Special Instructions</h2>
          <textarea value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} placeholder="Any notes for the restaurant? (e.g. leave at door, call on arrival)" rows={2} className="w-full px-3 py-2.5 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400 resize-none" />
        </div>

        <div className="bg-white rounded-xl border border-ink-100 p-5 space-y-3">
          <h2 className="font-bold font-display text-charcoal-800 mb-2">Order Summary</h2>
          <div className="flex justify-between text-sm"><span className="text-ink-500">Subtotal</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-ink-500">Delivery fee</span><span className="font-medium">{restaurantDeliveryFee > 0 ? formatCurrency(restaurantDeliveryFee) : 'Free'}</span></div>
          {discount > 0 && <div className="flex justify-between text-sm"><span className="text-green-600">Discount</span><span className="font-medium text-green-600">-{formatCurrency(discount)}</span></div>}
          <div className="border-t border-ink-100 pt-3 flex justify-between"><span className="font-bold text-charcoal-800">Total</span><span className="font-bold text-lg text-orange-600">{formatCurrency(total)}</span></div>
        </div>

        <button
          onClick={handlePlaceOrder}
          disabled={placing}
          className="w-full py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {placing ? <><Loader2 className="w-5 h-5 animate-spin" /> Placing Order...</> : <><Wallet className="w-5 h-5" /> Place Order ({formatCurrency(total)})</>}
        </button>
      </div>
    </div>
  );
}
