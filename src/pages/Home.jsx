import { Search, MapPin, Star, ArrowRight, Bike, Clock, Tag, Sparkles, MessageCircle, Leaf, Flame } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase, formatCurrency } from '../lib/supabase.js';
import { CUISINES } from '../lib/utils.js';
import RestaurantCard from '../components/restaurant/RestaurantCard.jsx';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredRestaurants, setFeaturedRestaurants] = useState([]);
  const [popularFoods, setPopularFoods] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recDietary, setRecDietary] = useState('');
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      const [restRes, foodRes, couponRes] = await Promise.all([
        supabase
          .from('restaurants')
          .select('*')
          .eq('approval_status', 'approved')
          .order('is_featured', { ascending: false })
          .order('rating', { ascending: false })
          .limit(8),
        supabase
          .from('foods')
          .select('*, restaurant:restaurants(id,name,slug,delivery_fee)')
          .eq('is_available', true)
          .eq('is_popular', true)
          .limit(6),
        supabase
          .from('coupons')
          .select('*')
          .eq('is_active', true)
          .limit(3),
      ]);

      if (restRes.data) setFeaturedRestaurants(restRes.data);
      if (foodRes.data) setPopularFoods(foodRes.data);
      if (couponRes.data) setCoupons(couponRes.data);
      setLoading(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ limit: '8' });
    if (recDietary) params.set('dietary', recDietary);
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/recommendations?${params}`, {
      headers: { 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
    })
      .then(res => res.json())
      .then(data => setRecommendations(data.recommendations || []))
      .catch(() => setRecommendations([]));
  }, [recDietary]);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/restaurants${searchQuery.trim() ? `?q=${encodeURIComponent(searchQuery.trim())}` : ''}`);
  };

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-cream-100 via-cream-50 to-orange-50">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 right-10 w-72 h-72 bg-orange-200 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-cream-200 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur rounded-full text-sm font-medium text-orange-700 mb-6">
              <Sparkles className="w-4 h-4" /> AI-powered food recommendations
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold font-display text-charcoal-800 leading-tight">
              Order food from the best <span className="text-orange-500">restaurants</span> near you
            </h1>
            <p className="mt-4 text-lg text-ink-500 max-w-xl">
              Discover, order, and track. Cash on Delivery, UPI QR, or dine-in with table QR ordering.
            </p>

            <form onSubmit={handleSearch} className="mt-8 flex gap-2 bg-white rounded-2xl p-2 shadow-lg shadow-orange-100/50 max-w-lg">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search restaurants, cuisines, or dishes..."
                  className="w-full pl-11 pr-4 py-3 text-sm bg-transparent focus:outline-none"
                />
              </div>
              <button type="submit" className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors">
                Search
              </button>
            </form>

            <div className="mt-6 flex items-center gap-4 text-sm text-ink-500">
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-orange-500" /> Bengaluru</span>
              <span className="flex items-center gap-1.5"><Bike className="w-4 h-4 text-orange-500" /> Free delivery options</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-orange-500" /> 30 min avg</span>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-lg font-bold font-display text-charcoal-800 mb-5">Browse by cuisine</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {CUISINES.slice(0, 8).map((cuisine) => (
            <Link
              key={cuisine}
              to={`/restaurants?cuisine=${encodeURIComponent(cuisine)}`}
              className="group flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-ink-100 hover:border-orange-200 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-orange-50 group-hover:bg-orange-100 flex items-center justify-center text-lg font-bold text-orange-600 transition-colors">
                {cuisine.charAt(0)}
              </div>
              <span className="text-xs font-medium text-ink-600 group-hover:text-orange-600 text-center">{cuisine}</span>
            </Link>
          ))}
        </div>
      </section>

      {coupons.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white">
                <Tag className="w-6 h-6 mb-2 opacity-80" />
                <p className="text-2xl font-bold font-display">
                  {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `${formatCurrency(coupon.discount_value)} OFF`}
                </p>
                <p className="text-sm text-orange-50 mt-1">{coupon.description || 'On your next order'}</p>
                <p className="text-xs text-orange-100 mt-2">Use code: <span className="font-bold bg-white/20 px-2 py-0.5 rounded">{coupon.code}</span></p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold font-display text-charcoal-800">Featured restaurants</h2>
          <Link to="/restaurants" className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-ink-100">
                <div className="h-44 skeleton" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-3/4 skeleton rounded" />
                  <div className="h-3 w-1/2 skeleton rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : featuredRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredRestaurants.map((r) => <RestaurantCard key={r.id} restaurant={r} />)}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-ink-100">
            <p className="text-ink-400">No restaurants available yet. Check back soon!</p>
          </div>
        )}
      </section>

      {popularFoods.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-xl font-bold font-display text-charcoal-800 mb-6">Popular dishes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {popularFoods.map((food) => (
              <Link
                key={food.id}
                to={`/restaurants/${food.restaurant?.slug}`}
                className="group bg-white rounded-2xl overflow-hidden border border-ink-100 hover:shadow-md transition-all flex"
              >
                <div className="w-28 h-28 shrink-0 bg-cream-100">
                  {food.image_url && <img src={food.image_url} alt={food.name} className="w-full h-full object-cover" loading="lazy" />}
                </div>
                <div className="p-3 flex-1">
                  <h3 className="font-display font-semibold text-sm text-charcoal-800 group-hover:text-orange-600 line-clamp-2">{food.name}</h3>
                  <p className="text-xs text-ink-400 mt-0.5">{food.restaurant?.name}</p>
                  <p className="font-bold text-orange-600 mt-2">{formatCurrency(food.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {recommendations.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold font-display text-charcoal-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-500" /> Recommended for you
              </h2>
              <p className="text-sm text-ink-400 mt-0.5">Personalized picks based on popularity and rating</p>
            </div>
            <div className="flex gap-2">
              {['', 'vegetarian', 'vegan'].map((d) => (
                <button key={d || 'all'} onClick={() => setRecDietary(d)} className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap ${recDietary === d ? 'bg-orange-500 text-white' : 'bg-white border border-ink-200 text-ink-600'}`}>
                  {d === 'vegetarian' ? <span className="flex items-center gap-1"><Leaf className="w-3 h-3" /> Veg</span> : d === 'vegan' ? 'Vegan' : 'All'}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recommendations.map((food) => (
              <Link
                key={food.id}
                to={`/restaurants/${food.restaurant?.slug}`}
                className="group bg-white rounded-2xl overflow-hidden border border-ink-100 hover:shadow-md transition-all"
              >
                <div className="h-32 bg-cream-100">
                  {food.image_url ? <img src={food.image_url} alt={food.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-ink-200">{food.name.charAt(0)}</div>}
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="font-display font-semibold text-sm text-charcoal-800 group-hover:text-orange-600 line-clamp-2">{food.name}</h3>
                    {food.dietary_labels?.includes('vegetarian') && <Leaf className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-ink-400 mt-0.5">{food.restaurant?.name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="font-bold text-orange-600 text-sm">{formatCurrency(food.price)}</p>
                    {food.restaurant?.rating > 0 && <span className="flex items-center gap-0.5 text-xs text-ink-500"><Star className="w-3 h-3 fill-orange-500 text-orange-500" />{Number(food.restaurant.rating).toFixed(1)}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-ink-100 text-center">
            <div className="w-12 h-12 bg-orange-50 rounded-xl mx-auto flex items-center justify-center mb-3">
              <Bike className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="font-bold font-display text-charcoal-800">Fast Delivery</h3>
            <p className="text-sm text-ink-400 mt-1">Get your food delivered in 30 minutes on average.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-ink-100 text-center">
            <div className="w-12 h-12 bg-orange-50 rounded-xl mx-auto flex items-center justify-center mb-3">
              <Star className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="font-bold font-display text-charcoal-800">Top Rated</h3>
            <p className="text-sm text-ink-400 mt-1">Curated restaurants with the best ratings and reviews.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-ink-100 text-center">
            <div className="w-12 h-12 bg-orange-50 rounded-xl mx-auto flex items-center justify-center mb-3">
              <MessageCircle className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="font-bold font-display text-charcoal-800">AI Assistant</h3>
            <p className="text-sm text-ink-400 mt-1">Get personalized food recommendations from our AI.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
