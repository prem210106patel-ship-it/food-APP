import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { CUISINES } from '../lib/utils.js';
import RestaurantCard from '../components/restaurant/RestaurantCard.jsx';

export default function Restaurants() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 12;

  const q = searchParams.get('q') || '';
  const cuisine = searchParams.get('cuisine') || '';
  const sort = searchParams.get('sort') || 'rating';
  const minRating = searchParams.get('rating') || '';
  const maxFee = searchParams.get('fee') || '';

  const fetchRestaurants = useCallback(async (pageNum, replace = false) => {
    setLoading(true);
    let query = supabase
      .from('restaurants')
      .select('*')
      .eq('approval_status', 'approved');

    if (q) query = query.or(`name.ilike.%${q}%,cuisine.cs.{${q}}`);
    if (cuisine) query = query.contains('cuisine', [cuisine]);
    if (minRating) query = query.gte('rating', Number(minRating));
    if (maxFee) query = query.lte('delivery_fee', Number(maxFee) * 100);

    if (sort === 'rating') query = query.order('rating', { ascending: false });
    if (sort === 'delivery') query = query.order('estimated_delivery_minutes', { ascending: true });
    if (sort === 'name') query = query.order('name', { ascending: true });

    query = query.range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching restaurants:', error);
    } else {
      if (replace || pageNum === 0) {
        setRestaurants(data);
      } else {
        setRestaurants(prev => [...prev, ...data]);
      }
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoading(false);
  }, [q, cuisine, sort, minRating, maxFee]);

  useEffect(() => {
    setPage(0);
    fetchRestaurants(0, true);
  }, [fetchRestaurants]);

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params);
  };

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchRestaurants(next);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold font-display text-charcoal-800">Restaurants</h1>
        <p className="text-sm text-ink-400 mt-1">Discover great food near you</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            type="text"
            defaultValue={q}
            key={q}
            placeholder="Search by name or cuisine..."
            onChange={(e) => updateParam('q', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-ink-200 rounded-xl focus:outline-none focus:border-orange-400"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border border-ink-200 rounded-xl hover:bg-cream-50 transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" /> Filters
        </button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl border border-ink-100 p-4 mb-6 animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-charcoal-800">Filters & Sorting</h3>
            <button onClick={() => setShowFilters(false)}><X className="w-4 h-4 text-ink-400" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-ink-500 block mb-1.5">Cuisine</label>
              <select value={cuisine} onChange={(e) => updateParam('cuisine', e.target.value)} className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400">
                <option value="">All cuisines</option>
                {CUISINES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-500 block mb-1.5">Sort by</label>
              <select value={sort} onChange={(e) => updateParam('sort', e.target.value)} className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400">
                <option value="rating">Top Rated</option>
                <option value="delivery">Fastest Delivery</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-500 block mb-1.5">Min Rating</label>
              <select value={minRating} onChange={(e) => updateParam('rating', e.target.value)} className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400">
                <option value="">Any</option>
                <option value="3">3.0+</option>
                <option value="3.5">3.5+</option>
                <option value="4">4.0+</option>
                <option value="4.5">4.5+</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-500 block mb-1.5">Max Delivery Fee</label>
              <select value={maxFee} onChange={(e) => updateParam('fee', e.target.value)} className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400">
                <option value="">Any</option>
                <option value="0">Free</option>
                <option value="20">₹20</option>
                <option value="40">₹40</option>
                <option value="60">₹60</option>
              </select>
            </div>
          </div>
          <button onClick={() => { setSearchParams(new URLSearchParams()); }} className="text-sm text-orange-600 hover:text-orange-700 font-medium">
            Clear all filters
          </button>
        </div>
      )}

      {(q || cuisine || minRating || maxFee) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {q && <span className="px-3 py-1 bg-orange-50 text-orange-700 text-xs rounded-full">Search: {q}</span>}
          {cuisine && <span className="px-3 py-1 bg-orange-50 text-orange-700 text-xs rounded-full">Cuisine: {cuisine}</span>}
          {minRating && <span className="px-3 py-1 bg-orange-50 text-orange-700 text-xs rounded-full">Rating: {minRating}+</span>}
          {maxFee && <span className="px-3 py-1 bg-orange-50 text-orange-700 text-xs rounded-full">Fee: ≤ ₹{maxFee}</span>}
        </div>
      )}

      {loading && restaurants.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-ink-100">
              <div className="h-44 skeleton" />
              <div className="p-4 space-y-2"><div className="h-4 w-3/4 skeleton rounded" /><div className="h-3 w-1/2 skeleton rounded" /></div>
            </div>
          ))}
        </div>
      ) : restaurants.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {restaurants.map((r) => <RestaurantCard key={r.id} restaurant={r} />)}
          </div>
          {hasMore && (
            <div className="text-center mt-8">
              <button onClick={handleLoadMore} disabled={loading} className="px-6 py-2.5 bg-white border border-orange-200 text-orange-600 font-semibold rounded-xl hover:bg-orange-50 disabled:opacity-50">
                {loading ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-ink-100">
          <Search className="w-12 h-12 text-ink-200 mx-auto mb-3" />
          <p className="text-ink-500 font-medium">No restaurants found</p>
          <p className="text-sm text-ink-400 mt-1">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
