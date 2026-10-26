import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../lib/cart.jsx';
import { formatCurrency } from '../lib/supabase.js';

export default function Cart() {
  const { items, restaurantName, restaurantDeliveryFee, subtotal, totalItems, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

  const total = subtotal + (items.length > 0 ? restaurantDeliveryFee : 0);

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-cream-100 rounded-full mx-auto flex items-center justify-center mb-4">
          <ShoppingBag className="w-10 h-10 text-ink-300" />
        </div>
        <h1 className="text-xl font-bold font-display text-charcoal-800">Your cart is empty</h1>
        <p className="text-sm text-ink-400 mt-2">Browse restaurants and add items to your cart</p>
        <Link to="/restaurants" className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors">
          Browse Restaurants <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold font-display text-charcoal-800">Your Cart</h1>
          <p className="text-sm text-ink-400 mt-0.5">From {restaurantName}</p>
        </div>
        <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1.5">
          <Trash2 className="w-4 h-4" /> Clear
        </button>
      </div>

      <div className="space-y-3 mb-6">
        {items.map((item, idx) => (
          <div key={`${item.food_id}-${idx}`} className="bg-white rounded-xl border border-ink-100 p-3 flex gap-3">
            <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-cream-100">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl font-bold text-ink-200">{item.name.charAt(0)}</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-charcoal-800">{item.name}</h3>
              <p className="text-xs text-orange-600 font-medium mt-0.5">{formatCurrency(item.price)}</p>
              {item.customization && (
                <p className="text-xs text-ink-400 mt-0.5">
                  {item.customization.spice_level > 0 && `Spice: ${['', 'Mild', 'Medium', 'Spicy'][item.customization.spice_level]}`}
                  {item.customization.special_instructions && `${item.customization.special_instructions ? ' • ' : ''}${item.customization.special_instructions}`}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end justify-between">
              <button onClick={() => removeItem(item.food_id, item.customization)} className="text-ink-300 hover:text-red-500" aria-label="Remove">
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 bg-orange-50 rounded-lg p-1">
                <button onClick={() => updateQuantity(item.food_id, item.quantity - 1, item.customization)} className="w-7 h-7 flex items-center justify-center text-orange-600 hover:bg-white rounded-md">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-bold text-sm text-orange-700 w-5 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.food_id, item.quantity + 1, item.customization)} className="w-7 h-7 flex items-center justify-center text-orange-600 hover:bg-white rounded-md">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-ink-100 p-5 space-y-3">
        <h2 className="font-bold font-display text-charcoal-800 mb-2">Order Summary</h2>
        <div className="flex justify-between text-sm">
          <span className="text-ink-500">Subtotal ({totalItems} items)</span>
          <span className="font-medium text-ink-800">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink-500">Delivery fee</span>
          <span className="font-medium text-ink-800">{restaurantDeliveryFee > 0 ? formatCurrency(restaurantDeliveryFee) : 'Free'}</span>
        </div>
        <div className="border-t border-ink-100 pt-3 flex justify-between">
          <span className="font-bold text-charcoal-800">Total</span>
          <span className="font-bold text-lg text-orange-600">{formatCurrency(total)}</span>
        </div>
      </div>

      <button
        onClick={() => navigate('/checkout')}
        className="w-full mt-6 py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
      >
        Proceed to Checkout <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}
