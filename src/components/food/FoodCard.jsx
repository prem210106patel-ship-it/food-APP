import { useState } from 'react';
import { Plus, Minus, Heart, Leaf, Flame } from 'lucide-react';
import { formatCurrency } from '../../lib/supabase.js';
import { DIETARY_LABELS } from '../../lib/utils.js';
import { useCart } from '../../lib/cart.jsx';

export default function FoodCard({ food, restaurantId, restaurantName, deliveryFee }) {
  const { addToCart, items, updateQuantity, toggleFavorite, isFavorite } = useCart();
  const [showCustomize, setShowCustomize] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [spiceLevel, setSpiceLevel] = useState(0);

  const cartItem = items.find(i => i.food_id === food.id && !i.customization);
  const currentQty = cartItem?.quantity || 0;

  const handleAdd = () => {
    if (specialInstructions || spiceLevel > 0) {
      addToCart(food, restaurantId, restaurantName, deliveryFee, 1, {
        special_instructions: specialInstructions,
        spice_level: spiceLevel,
      });
      setShowCustomize(false);
      setSpecialInstructions('');
      setSpiceLevel(0);
    } else {
      addToCart(food, restaurantId, restaurantName, deliveryFee, 1);
    }
  };

  const dietary = food.dietary_labels?.[0];
  const dietaryInfo = dietary ? DIETARY_LABELS[dietary] : null;
  const isVeg = dietary === 'vegetarian' || dietary === 'vegan';

  return (
    <div className="bg-white rounded-xl border border-ink-100 hover:border-orange-200 hover:shadow-sm transition-all overflow-hidden">
      <div className="flex gap-3 p-3">
        <div className="relative shrink-0">
          {food.image_url ? (
            <img
              src={food.image_url}
              alt={food.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg bg-cream-100 flex items-center justify-center">
              <span className="text-2xl font-display font-bold text-ink-200">
                {food.name?.charAt(0)}
              </span>
            </div>
          )}
          {dietaryInfo && (
            <div className={`absolute -top-1 -left-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${
              isVeg ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {isVeg ? <Leaf className="w-3 h-3 text-white" /> : <Flame className="w-3 h-3 text-white" />}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-display font-semibold text-sm text-charcoal-800 line-clamp-2">
              {food.name}
            </h4>
            <button
              onClick={() => toggleFavorite(food.id)}
              className="shrink-0 p-1 -mt-0.5 -mr-0.5"
              aria-label="Toggle favorite"
            >
              <Heart
                className={`w-4 h-4 ${isFavorite(food.id) ? 'fill-orange-500 text-orange-500' : 'text-ink-300 hover:text-orange-400'}`}
              />
            </button>
          </div>

          {food.description && (
            <p className="text-xs text-ink-400 mt-0.5 line-clamp-2">{food.description}</p>
          )}

          <div className="flex items-center gap-2 mt-1.5">
            <span className="font-display font-bold text-sm text-orange-600">
              {formatCurrency(food.price)}
            </span>
            {food.preparation_time > 0 && (
              <span className="text-xs text-ink-400">{food.preparation_time} min</span>
            )}
          </div>

          {food.spice_level > 0 && (
            <div className="flex items-center gap-0.5 mt-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <Flame
                  key={i}
                  className={`w-3 h-3 ${i < food.spice_level ? 'text-orange-500 fill-orange-500' : 'text-ink-200'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-3 pb-3">
        {!showCustomize && currentQty === 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowCustomize(true)}
              className="flex-1 py-1.5 text-xs font-medium text-ink-600 border border-ink-200 rounded-lg hover:bg-cream-50 transition-colors"
            >
              Customize
            </button>
            <button
              onClick={handleAdd}
              disabled={!food.is_available}
              className="flex-1 py-1.5 text-xs font-bold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-ink-200 disabled:cursor-not-allowed"
            >
              {food.is_available ? 'Add' : 'Unavailable'}
            </button>
          </div>
        )}

        {!showCustomize && currentQty > 0 && (
          <div className="flex items-center justify-between bg-orange-50 rounded-lg p-1">
            <button
              onClick={() => updateQuantity(food.id, currentQty - 1)}
              className="w-8 h-8 flex items-center justify-center text-orange-600 hover:bg-white rounded-md transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-bold text-sm text-orange-700">{currentQty}</span>
            <button
              onClick={() => updateQuantity(food.id, currentQty + 1)}
              className="w-8 h-8 flex items-center justify-center text-orange-600 hover:bg-white rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}

        {showCustomize && (
          <div className="space-y-2.5 animate-fade-in">
            <div>
              <label className="text-xs font-medium text-ink-600 block mb-1">Spice Level</label>
              <div className="flex gap-1.5">
                {['Mild', 'Medium', 'Spicy'].map((label, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSpiceLevel(spiceLevel === idx + 1 ? 0 : idx + 1)}
                    className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                      spiceLevel === idx + 1
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-ink-200 text-ink-500 hover:border-orange-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-600 block mb-1">Special Instructions</label>
              <input
                type="text"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g. less oil, no onions"
                className="w-full px-2.5 py-1.5 text-xs border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCustomize(false)}
                className="flex-1 py-1.5 text-xs font-medium text-ink-500 border border-ink-200 rounded-lg hover:bg-cream-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 py-1.5 text-xs font-bold text-white bg-orange-500 rounded-lg hover:bg-orange-600"
              >
                Add Item
              </button>
            </div>
          </div>
        )}

        {food.allergen_information?.length > 0 && (
          <p className="text-xs text-ink-400 mt-2">
            Contains: {food.allergen_information.join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}
