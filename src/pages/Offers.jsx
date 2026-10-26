import { useEffect, useState } from 'react';
import { Tag, Calendar, Percent } from 'lucide-react';
import { supabase, formatCurrency } from '../lib/supabase.js';

export default function Offers() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('coupons')
      .select('*, restaurant:restaurants(name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const now = new Date();
        setCoupons((data || []).filter(c => !c.expires_at || new Date(c.expires_at) > now));
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-extrabold font-display text-charcoal-800 mb-6">Offers & Coupons</h1>
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 skeleton rounded-xl" />)}</div>
      ) : coupons.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {coupons.map((coupon) => (
            <div key={coupon.id} className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8" />
              <Tag className="w-7 h-7 mb-3 opacity-80" />
              <p className="text-2xl font-bold font-display">
                {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `${formatCurrency(coupon.discount_value)} OFF`}
              </p>
              {coupon.description && <p className="text-sm text-orange-50 mt-1">{coupon.description}</p>}
              {coupon.restaurant && <p className="text-xs text-orange-100 mt-1">Valid at {coupon.restaurant.name}</p>}
              <div className="mt-4 flex items-center gap-3">
                <span className="font-bold bg-white/20 px-3 py-1 rounded-lg text-sm">{coupon.code}</span>
                {coupon.minimum_order_amount > 0 && <span className="text-xs text-orange-100">Min order {formatCurrency(coupon.minimum_order_amount)}</span>}
              </div>
              {coupon.expires_at && (
                <p className="text-xs text-orange-100 mt-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Expires {new Date(coupon.expires_at).toLocaleDateString('en-IN')}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-ink-100">
          <Percent className="w-12 h-12 text-ink-200 mx-auto mb-3" />
          <p className="text-ink-500 font-medium">No active offers right now</p>
          <p className="text-sm text-ink-400 mt-1">Check back later for deals</p>
        </div>
      )}
    </div>
  );
}
