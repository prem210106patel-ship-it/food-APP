import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';
import { supabase, formatCurrency } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { useCart } from '../lib/cart.jsx';

export default function Favorites() {
  const { user } = useAuth();
  const { toggleFavorite } = useCart();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const { data } = await supabase
        .from('favorites')
        .select('food:foods(*, restaurant:restaurants(id, name, slug, delivery_fee))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setFavorites(data || []);
      setLoading(false);
    }
    load();
  }, [user]);

  const handleRemove = async (foodId) => {
    await supabase.from('favorites').delete().eq('user_id', user.id).eq('food_id', foodId);
    setFavorites(favorites.filter(f => f.food?.id !== foodId));
    toggleFavorite(foodId);
  };

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8 space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 skeleton rounded-xl" />)}</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-extrabold font-display text-charcoal-800 mb-6">My Favorites</h1>
      {favorites.length > 0 ? (
        <div className="space-y-3">
          {favorites.map((fav) => {
            const food = fav.food;
            if (!food) return null;
            return (
              <div key={food.id} className="bg-white rounded-xl border border-ink-100 p-3 flex gap-3 items-center">
                <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-cream-100">
                  {food.image_url && <img src={food.image_url} alt={food.name} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-charcoal-800">{food.name}</h3>
                  <p className="text-xs text-ink-400">{food.restaurant?.name}</p>
                  <p className="font-bold text-orange-600 text-sm mt-1">{formatCurrency(food.price)}</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Link to={`/restaurants/${food.restaurant?.slug}`} className="px-3 py-1.5 bg-orange-500 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 flex items-center gap-1">
                    Order <ArrowRight className="w-3 h-3" />
                  </Link>
                  <button onClick={() => handleRemove(food.id)} className="text-xs text-red-500 hover:text-red-600 flex items-center justify-center gap-1">
                    <Heart className="w-3 h-3 fill-orange-500 text-orange-500" /> Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-ink-100">
          <Heart className="w-12 h-12 text-ink-200 mx-auto mb-3" />
          <p className="text-ink-500 font-medium">No favorites yet</p>
          <p className="text-sm text-ink-400 mt-1">Tap the heart icon on dishes to save them</p>
          <Link to="/restaurants" className="mt-4 inline-block px-5 py-2.5 bg-orange-500 text-white font-semibold rounded-xl">Browse Restaurants</Link>
        </div>
      )}
    </div>
  );
}
