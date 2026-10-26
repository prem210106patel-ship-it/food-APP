import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Clock, Bike, MapPin, Search, ArrowLeft, ShoppingBag } from 'lucide-react';
import { supabase, formatCurrency } from '../lib/supabase.js';
import FoodCard from '../components/food/FoodCard.jsx';
import { useCart } from '../lib/cart.jsx';

export default function RestaurantDetail() {
  const { slug } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [foods, setFoods] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const { items, totalItems } = useCart();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      const { data: rest, error: restErr } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (restErr || !rest) {
        setError('Restaurant not found');
        setLoading(false);
        return;
      }

      setRestaurant(rest);

      const [catRes, foodRes, reviewRes] = await Promise.all([
        supabase.from('food_categories').select('*').eq('restaurant_id', rest.id).order('sort_order'),
        supabase.from('foods').select('*').eq('restaurant_id', rest.id).order('is_popular', { ascending: false }),
        supabase.from('reviews').select('*, customer:profiles(name)').eq('restaurant_id', rest.id).eq('moderation_status', 'approved').order('created_at', { ascending: false }).limit(5),
      ]);

      if (catRes.data) setCategories(catRes.data);
      if (foodRes.data) setFoods(foodRes.data);
      if (reviewRes.data) setReviews(reviewRes.data);
      setLoading(false);
    }
    loadData();
  }, [slug]);

  const filteredFoods = foods.filter((f) => {
    const matchesSearch = !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()) || (f.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || f.category_id === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-64 skeleton rounded-2xl mb-6" />
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 skeleton rounded-xl" />)}</div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-xl font-bold text-charcoal-800">{error || 'Restaurant not found'}</p>
        <Link to="/restaurants" className="mt-4 inline-flex items-center gap-2 text-orange-600 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to restaurants
        </Link>
      </div>
    );
  }

  const isOpen = restaurant.availability_status === 'open';

  return (
    <div>
      <div className="relative h-48 sm:h-64 lg:h-72 bg-charcoal-800 overflow-hidden">
        {restaurant.cover_image_url && (
          <img src={restaurant.cover_image_url} alt={restaurant.name} className="w-full h-full object-cover opacity-70" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
            <Link to="/restaurants" className="inline-flex items-center gap-1.5 text-white/80 text-sm hover:text-white mb-3">
              <ArrowLeft className="w-4 h-4" /> All restaurants
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white shadow-lg overflow-hidden shrink-0">
                {restaurant.image_url ? (
                  <img src={restaurant.image_url} alt={restaurant.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-orange-500">{restaurant.name.charAt(0)}</div>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">{restaurant.name}</h1>
                <p className="text-white/80 text-sm mt-1">{(restaurant.cuisine || []).join(' • ')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-4 py-4 border-b border-ink-100">
          {restaurant.rating > 0 && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-ink-700">
              <Star className="w-4 h-4 fill-orange-500 text-orange-500" /> {Number(restaurant.rating).toFixed(1)}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-sm text-ink-500"><Clock className="w-4 h-4" /> {restaurant.estimated_delivery_minutes} min</span>
          <span className="flex items-center gap-1.5 text-sm text-ink-500"><Bike className="w-4 h-4" /> {restaurant.delivery_fee > 0 ? formatCurrency(restaurant.delivery_fee) : 'Free delivery'}</span>
          <span className="flex items-center gap-1.5 text-sm text-ink-500"><MapPin className="w-4 h-4" /> {restaurant.address}</span>
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${isOpen ? 'bg-green-100 text-green-700' : 'bg-ink-100 text-ink-600'}`}>
            {isOpen ? 'Open Now' : 'Closed'}
          </span>
        </div>

        {restaurant.description && (
          <p className="text-sm text-ink-500 py-4">{restaurant.description}</p>
        )}

        <div className="sticky top-16 z-30 bg-cream-50/90 backdrop-blur py-3 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search within menu..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-ink-200 rounded-xl focus:outline-none focus:border-orange-400"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${activeCategory === 'all' ? 'bg-orange-500 text-white' : 'bg-white border border-ink-200 text-ink-600 hover:border-orange-300'}`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${activeCategory === cat.id ? 'bg-orange-500 text-white' : 'bg-white border border-ink-200 text-ink-600 hover:border-orange-300'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="py-4 space-y-3">
          {filteredFoods.length > 0 ? (
            filteredFoods.map((food) => (
              <FoodCard
                key={food.id}
                food={food}
                restaurantId={restaurant.id}
                restaurantName={restaurant.name}
                deliveryFee={restaurant.delivery_fee}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-ink-400">No items match your search</p>
            </div>
          )}
        </div>

        {reviews.length > 0 && (
          <div className="py-8 border-t border-ink-100 mt-8">
            <h2 className="text-lg font-bold font-display text-charcoal-800 mb-4">Customer Reviews</h2>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-xl p-4 border border-ink-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-ink-800">{review.customer?.name || 'Anonymous'}</span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-orange-500 text-orange-500' : 'text-ink-200'}`} />
                      ))}
                    </div>
                  </div>
                  {review.comment && <p className="text-sm text-ink-500">{review.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {totalItems > 0 && items[0]?.food_id && (
        <Link
          to="/cart"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 transition-colors"
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="font-semibold text-sm">{totalItems} items in cart</span>
          <span className="font-bold">View Cart</span>
        </Link>
      )}
    </div>
  );
}
