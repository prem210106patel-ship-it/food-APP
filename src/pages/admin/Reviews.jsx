import { useEffect, useState, useCallback } from 'react';
import { Star, Check, X, Loader2 } from 'lucide-react';
import { supabase, formatDateTime } from '../../../lib/supabase.js';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('reviews').select('*, customer:profiles(name), restaurant:restaurants(name), food:foods(name)').order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('moderation_status', filter);
    const { data } = await query.limit(50);
    setReviews(data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const moderate = async (id, status) => {
    await supabase.from('reviews').update({ moderation_status: status }).eq('id', id);
    load();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-orange-500 animate-spin" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-extrabold font-display text-charcoal-800 mb-6">Review Moderation</h1>
      <div className="flex gap-2 mb-4">
        {['pending', 'approved', 'rejected', 'all'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3.5 py-1.5 text-sm font-medium rounded-full capitalize ${filter === f ? 'bg-orange-500 text-white' : 'bg-white border border-ink-200 text-ink-600'}`}>{f}</button>
        ))}
      </div>
      {reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-ink-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-ink-800">{r.customer?.name || 'Anonymous'}</span>
                    <span className="text-xs text-ink-400">on {r.restaurant?.name}</span>
                  </div>
                  <div className="flex items-center gap-0.5 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-orange-500 text-orange-500' : 'text-ink-200'}`} />)}
                  </div>
                  {r.comment && <p className="text-sm text-ink-600">{r.comment}</p>}
                  <p className="text-xs text-ink-400 mt-2">{formatDateTime(r.created_at)}</p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full text-center ${r.moderation_status === 'approved' ? 'bg-green-100 text-green-700' : r.moderation_status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{r.moderation_status}</span>
                  {r.moderation_status === 'pending' && (
                    <div className="flex gap-1">
                      <button onClick={() => moderate(r.id, 'approved')} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Check className="w-4 h-4" /></button>
                      <button onClick={() => moderate(r.id, 'rejected')} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-ink-100"><Star className="w-10 h-10 text-ink-200 mx-auto mb-2" /><p className="text-ink-400">No reviews to moderate</p></div>
      )}
    </div>
  );
}
