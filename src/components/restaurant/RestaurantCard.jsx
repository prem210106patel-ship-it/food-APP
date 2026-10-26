import { Link } from 'react-router-dom';
import { Star, Clock, Bike, MapPin } from 'lucide-react';
import { formatCurrency } from '../../lib/supabase.js';

export default function RestaurantCard({ restaurant }) {
  const isOpen = restaurant.availability_status === 'open';
  const imageUrl = restaurant.image_url || restaurant.cover_image_url;

  return (
    <Link
      to={`/restaurants/${restaurant.slug}`}
      className="group bg-white rounded-2xl overflow-hidden border border-ink-100 hover:border-orange-200 hover:shadow-lg transition-all duration-300"
    >
      <div className="relative h-44 overflow-hidden bg-cream-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl font-display font-bold text-ink-200">
              {restaurant.name?.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          {restaurant.is_featured && (
            <span className="px-2.5 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full">
              Featured
            </span>
          )}
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${isOpen ? 'bg-green-500 text-white' : 'bg-ink-500 text-white'}`}>
            {isOpen ? 'Open' : 'Closed'}
          </span>
        </div>
        {restaurant.rating > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur rounded-full">
            <Star className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
            <span className="text-xs font-bold text-ink-800">{Number(restaurant.rating).toFixed(1)}</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-display font-bold text-base text-charcoal-800 group-hover:text-orange-600 transition-colors line-clamp-2">
          {restaurant.name}
        </h3>
        <p className="text-xs text-ink-400 mt-0.5">
          {(restaurant.cuisine || []).join(' • ')}
        </p>

        <div className="flex items-center gap-3 mt-3 text-xs text-ink-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {restaurant.estimated_delivery_minutes} min
          </span>
          <span className="flex items-center gap-1">
            <Bike className="w-3.5 h-3.5" />
            {restaurant.delivery_fee > 0 ? formatCurrency(restaurant.delivery_fee) : 'Free'}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {restaurant.city}
          </span>
        </div>
      </div>
    </Link>
  );
}
