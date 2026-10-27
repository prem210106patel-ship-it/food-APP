import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Utensils, Search, Plus, Minus, ShoppingBag, Loader2, AlertCircle, Store } from 'lucide-react';
import { supabase, formatCurrency } from '../../lib/supabase.js';
import { hashToken, generateOrderNumber, generateToken } from '../../lib/utils.js';

export default function QrTableMenu() {
  const { token } = useParams();
  const [table, setTable] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [foods, setFoods] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [showCart, setShowCart] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  const load = useCallback(async () => {
    if (!token) { setError('Invalid QR code'); setLoading(false); return; }
    const tokenHash = await hashToken(token);
    const { data: tbl, error: tblErr } = await supabase
      .from('restaurant_tables')
      .select('*, restaurant:restaurants(*)')
      .eq('public_token_hash', tokenHash)
      .maybeSingle();
    if (tblErr || !tbl) { setError('Table not found. Please scan the QR code again.'); setLoading(false); return; }
    if (!tbl.is_active) { setError('This table is currently inactive.'); setLoading(false); return; }
    setTable(tbl);
    setRestaurant(tbl.restaurant);
    const [catRes, foodRes] = await Promise.all([
      supabase.from('food_categories').select('*').eq('restaurant_id', tbl.restaurant.id).order('sort_order'),
      supabase.from('foods').select('*').eq('restaurant_id', tbl.restaurant.id).eq('is_available', true).order('is_popular', { ascending: false }),
    ]);
    setCategories(catRes.data || []);
    setFoods(foodRes.data || []);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const addToCart = (food) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.food_id === food.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 }; return next; }
      return [...prev, { food_id: food.id, name: food.name, price: food.price, quantity: 1 }];
    });
  };

  const updateQty = (foodId, delta) => {
    setCart(prev => prev.map(i => i.food_id === foodId ? { ...i, quantity: i.quantity + delta } : i).filter(i => i.quantity > 0));
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setPlacing(true);
    try {
      const trackingToken = generateToken();
      const trackingTokenHash = await hashToken(trackingToken);
      const orderNumber = generateOrderNumber();
      const { data: order, error: orderErr } = await supabase.from('orders').insert({
        order_number: orderNumber,
        restaurant_id: restaurant.id,
        order_type: 'dine_in',
        table_id: table.id,
        status: 'pending',
        payment_method: 'cod',
        payment_status: 'unpaid',
        subtotal,
        delivery_fee: 0,
        discount: 0,
        total: subtotal,
        currency: 'INR',
        tracking_token_hash: trackingTokenHash,
      }).select().single();
      if (orderErr) throw new Error(orderErr.message);

      await supabase.from('order_items').insert(cart.map(i => ({
        order_id: order.id,
        food_id: i.food_id,
        food_name_snapshot: i.name,
        unit_price: i.price,
        quantity: i.quantity,
        line_total: i.price * i.quantity,
      })));
      await supabase.from('order_status_history').insert({ order_id: order.id, new_status: 'pending' });
      await supabase.from('payments').insert({ order_id: order.id, provider: 'cod', amount: subtotal, status: 'pending' });
      setOrderResult({ orderNumber, trackingToken });
      setCart([]);
      setShowCart(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-cream-50"><Loader2 className="w-8 h-8 text-orange-500 animate-spin" /></div>;
  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream-50 p-4 text-center">
      <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
      <p className="text-lg font-bold text-charcoal-800">{error}</p>
    </div>
  );

  if (orderResult) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream-50 p-4 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"><Utensils className="w-8 h-8 text-green-600" /></div>
      <h1 className="text-2xl font-extrabold font-display text-charcoal-800">Order Placed!</h1>
      <p className="text-sm text-ink-500 mt-2">Order #{orderResult.orderNumber}</p>
      <p className="text-sm text-ink-400 mt-1">The kitchen has been notified. Your food will be prepared shortly.</p>
      <a href={`/track/${orderResult.trackingToken}`} className="mt-6 px-5 py-2.5 bg-orange-500 text-white font-semibold rounded-xl">Track Order</a>
      <button onClick={() => { setOrderResult(null); load(); }} className="mt-3 text-sm text-orange-600 font-medium">Order More</button>
    </div>
  );

  const filteredFoods = foods.filter(f => (activeCat === 'all' || f.category_id === activeCat) && (!search || f.name.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="min-h-screen bg-cream-50 pb-20">
      <div className="bg-charcoal-800 text-white px-4 py-4 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <Store className="w-4 h-4 text-orange-400" />
            <span className="font-bold font-display">{restaurant.name}</span>
          </div>
          <p className="text-xs text-ink-300">Table {table.table_number} • Dine-in Menu</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search menu..." className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-ink-200 rounded-xl focus:outline-none focus:border-orange-400" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 mb-3">
          <button onClick={() => setActiveCat('all')} className={`px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap ${activeCat === 'all' ? 'bg-orange-500 text-white' : 'bg-white border border-ink-200 text-ink-600'}`}>All</button>
          {categories.map(c => <button key={c.id} onClick={() => setActiveCat(c.id)} className={`px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap ${activeCat === c.id ? 'bg-orange-500 text-white' : 'bg-white border border-ink-200 text-ink-600'}`}>{c.name}</button>)}
        </div>

        <div className="space-y-2">
          {filteredFoods.map(food => {
            const cartItem = cart.find(i => i.food_id === food.id);
            return (
              <div key={food.id} className="bg-white rounded-xl border border-ink-100 p-3 flex gap-3">
                <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-cream-100">
                  {food.image_url ? <img src={food.image_url} alt={food.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl font-bold text-ink-200">{food.name.charAt(0)}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-charcoal-800">{food.name}</h3>
                  {food.description && <p className="text-xs text-ink-400 line-clamp-2 mt-0.5">{food.description}</p>}
                  <p className="font-bold text-orange-600 text-sm mt-1">{formatCurrency(food.price)}</p>
                </div>
                <div className="flex items-center shrink-0">
                  {cartItem ? (
                    <div className="flex items-center gap-2 bg-orange-50 rounded-lg p-1">
                      <button onClick={() => updateQty(food.id, -1)} className="w-7 h-7 flex items-center justify-center text-orange-600"><Minus className="w-4 h-4" /></button>
                      <span className="font-bold text-sm text-orange-700 w-5 text-center">{cartItem.quantity}</span>
                      <button onClick={() => updateQty(food.id, 1)} className="w-7 h-7 flex items-center justify-center text-orange-600"><Plus className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <button onClick={() => addToCart(food)} className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600"><Plus className="w-3.5 h-3.5" /> Add</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-ink-100 p-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium text-ink-700">{cart.reduce((s, i) => s + i.quantity, 0)} items</span>
              <span className="font-bold text-orange-600">{formatCurrency(subtotal)}</span>
            </div>
            <button onClick={() => setShowCart(true)} className="px-4 py-2 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600">Review Order</button>
          </div>
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowCart(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-5 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold font-display text-charcoal-800 mb-4">Your Order — Table {table.table_number}</h2>
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {cart.map(i => (
                <div key={i.food_id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(i.food_id, -1)} className="w-6 h-6 bg-orange-50 rounded text-orange-600 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                    <span className="font-medium">{i.quantity}× {i.name}</span>
                    <button onClick={() => updateQty(i.food_id, 1)} className="w-6 h-6 bg-orange-50 rounded text-orange-600 flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                  </div>
                  <span className="font-medium">{formatCurrency(i.price * i.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-ink-100 pt-3 mb-4">
              <div className="flex justify-between font-bold"><span className="text-charcoal-800">Total</span><span className="text-orange-600">{formatCurrency(subtotal)}</span></div>
              <p className="text-xs text-ink-400 mt-1">Pay by cash when food arrives</p>
            </div>
            <button onClick={placeOrder} disabled={placing} className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50">
              {placing ? 'Placing...' : 'Place Dine-in Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
