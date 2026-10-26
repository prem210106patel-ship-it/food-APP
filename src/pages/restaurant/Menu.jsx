import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Edit3, X, Loader2, Utensils, FolderPlus } from 'lucide-react';
import { supabase, formatCurrency } from '../../../lib/supabase.js';
import { useAuth } from '../../../lib/auth.jsx';
import { DIETARY_LABELS, slugify } from '../../../lib/utils.js';

export default function RestaurantMenu() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFoodForm, setShowFoodForm] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [foodForm, setFoodForm] = useState({ name: '', description: '', price: '', category_id: '', dietary_labels: [], allergen_information: [], spice_level: 0, preparation_time: 15, is_available: true, is_popular: false, image_url: '' });
  const [catForm, setCatForm] = useState({ name: '', sort_order: 0 });

  const load = useCallback(async () => {
    if (!user) return;
    if (!restaurant) {
      const { data: rest } = await supabase.from('restaurants').select('*').eq('owner_id', user.id).maybeSingle();
      if (!rest) { setLoading(false); return; }
      setRestaurant(rest);
    }
    const restId = restaurant?.id;
    if (!restId) return;
    const [catRes, foodRes] = await Promise.all([
      supabase.from('food_categories').select('*').eq('restaurant_id', restId).order('sort_order'),
      supabase.from('foods').select('*').eq('restaurant_id', restId).order('is_popular', { ascending: false }),
    ]);
    setCategories(catRes.data || []);
    setFoods(foodRes.data || []);
    setLoading(false);
  }, [user, restaurant]);

  useEffect(() => { load(); }, [load]);

  const handleSaveFood = async () => {
    if (!foodForm.name || !foodForm.price) return;
    const payload = {
      restaurant_id: restaurant.id,
      category_id: foodForm.category_id || null,
      name: foodForm.name,
      slug: slugify(foodForm.name) + '-' + Date.now().toString(36),
      description: foodForm.description || null,
      price: Number(foodForm.price) * 100,
      image_url: foodForm.image_url || null,
      dietary_labels: foodForm.dietary_labels,
      allergen_information: foodForm.allergen_information,
      spice_level: Number(foodForm.spice_level),
      preparation_time: Number(foodForm.preparation_time),
      is_available: foodForm.is_available,
      is_popular: foodForm.is_popular,
    };
    if (editingFood) {
      await supabase.from('foods').update({ ...payload, slug: editingFood.slug }).eq('id', editingFood.id);
    } else {
      await supabase.from('foods').insert(payload);
    }
    setShowFoodForm(false);
    setEditingFood(null);
    setFoodForm({ name: '', description: '', price: '', category_id: '', dietary_labels: [], allergen_information: [], spice_level: 0, preparation_time: 15, is_available: true, is_popular: false, image_url: '' });
    load();
  };

  const handleSaveCategory = async () => {
    if (!catForm.name) return;
    await supabase.from('food_categories').insert({ restaurant_id: restaurant.id, name: catForm.name, sort_order: Number(catForm.sort_order) });
    setShowCatForm(false);
    setCatForm({ name: '', sort_order: 0 });
    load();
  };

  const handleDeleteFood = async (id) => {
    if (!confirm('Delete this menu item?')) return;
    await supabase.from('foods').delete().eq('id', id);
    load();
  };

  const handleEditFood = (food) => {
    setEditingFood(food);
    setFoodForm({
      name: food.name,
      description: food.description || '',
      price: (food.price / 100).toString(),
      category_id: food.category_id || '',
      dietary_labels: food.dietary_labels || [],
      allergen_information: food.allergen_information || [],
      spice_level: food.spice_level,
      preparation_time: food.preparation_time,
      is_available: food.is_available,
      is_popular: food.is_popular,
      image_url: food.image_url || '',
    });
    setShowFoodForm(true);
  };

  const toggleDietary = (label) => {
    setFoodForm(prev => ({
      ...prev,
      dietary_labels: prev.dietary_labels.includes(label)
        ? prev.dietary_labels.filter(l => l !== label)
        : [label],
    }));
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-orange-500 animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold font-display text-charcoal-800">Menu Management</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowCatForm(!showCatForm)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-ink-200 rounded-lg hover:bg-cream-50">
            <FolderPlus className="w-4 h-4" /> Category
          </button>
          <button onClick={() => { setEditingFood(null); setShowFoodForm(!showFoodForm); }} className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {showCatForm && (
        <div className="bg-white rounded-xl border border-ink-100 p-4 mb-4 animate-fade-in flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs font-medium text-ink-500 block mb-1">Category Name</label>
            <input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} placeholder="e.g. Starters, Main Course" className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg" />
          </div>
          <button onClick={handleSaveCategory} className="px-4 py-2 bg-charcoal-800 text-white text-sm font-semibold rounded-lg">Add</button>
        </div>
      )}

      {showFoodForm && (
        <div className="bg-white rounded-xl border border-ink-100 p-5 mb-4 animate-fade-in space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold font-display text-charcoal-800">{editingFood ? 'Edit Item' : 'New Menu Item'}</h2>
            <button onClick={() => { setShowFoodForm(false); setEditingFood(null); }}><X className="w-5 h-5 text-ink-400" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={foodForm.name} onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })} placeholder="Item name" className="px-3 py-2 text-sm border border-ink-200 rounded-lg" />
            <input type="number" value={foodForm.price} onChange={(e) => setFoodForm({ ...foodForm, price: e.target.value })} placeholder="Price in ₹" className="px-3 py-2 text-sm border border-ink-200 rounded-lg" />
          </div>
          <textarea value={foodForm.description} onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })} placeholder="Description" rows={2} className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg resize-none" />
          <input value={foodForm.image_url} onChange={(e) => setFoodForm({ ...foodForm, image_url: e.target.value })} placeholder="Image URL (optional)" className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg" />
          <div className="grid grid-cols-2 gap-3">
            <select value={foodForm.category_id} onChange={(e) => setFoodForm({ ...foodForm, category_id: e.target.value })} className="px-3 py-2 text-sm border border-ink-200 rounded-lg">
              <option value="">No category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={foodForm.spice_level} onChange={(e) => setFoodForm({ ...foodForm, spice_level: e.target.value })} className="px-3 py-2 text-sm border border-ink-200 rounded-lg">
              <option value="0">Not spicy</option>
              <option value="1">Mild</option>
              <option value="2">Medium</option>
              <option value="3">Spicy</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-ink-500 block mb-1.5">Dietary</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(DIETARY_LABELS).map(([key, val]) => (
                <button key={key} onClick={() => toggleDietary(key)} className={`px-3 py-1 text-xs rounded-lg ${foodForm.dietary_labels.includes(key) ? 'bg-orange-500 text-white' : 'bg-cream-50 border border-ink-200 text-ink-600'}`}>{val.label}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={foodForm.is_available} onChange={(e) => setFoodForm({ ...foodForm, is_available: e.target.checked })} className="accent-orange-500" /> Available</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={foodForm.is_popular} onChange={(e) => setFoodForm({ ...foodForm, is_popular: e.target.checked })} className="accent-orange-500" /> Popular</label>
          </div>
          <button onClick={handleSaveFood} className="px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600">{editingFood ? 'Update' : 'Add'} Item</button>
        </div>
      )}

      {categories.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {categories.map(c => <span key={c.id} className="px-3 py-1 bg-cream-100 text-ink-600 text-xs font-medium rounded-lg">{c.name}</span>)}
        </div>
      )}

      {foods.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {foods.map((food) => (
            <div key={food.id} className="bg-white rounded-xl border border-ink-100 p-3 flex gap-3">
              <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-cream-100">
                {food.image_url ? <img src={food.image_url} alt={food.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Utensils className="w-5 h-5 text-ink-300" /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-sm text-charcoal-800">{food.name}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => handleEditFood(food)} className="p-1 text-ink-400 hover:text-orange-600"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDeleteFood(food.id)} className="p-1 text-ink-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <p className="font-bold text-orange-600 text-sm">{formatCurrency(food.price)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-1.5 py-0.5 text-xs rounded ${food.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{food.is_available ? 'Available' : 'Unavailable'}</span>
                  {food.dietary_labels?.[0] && <span className="text-xs text-ink-400">{DIETARY_LABELS[food.dietary_labels[0]]?.label}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-ink-100"><Utensils className="w-10 h-10 text-ink-200 mx-auto mb-2" /><p className="text-ink-400">No menu items yet. Add your first dish!</p></div>
      )}
    </div>
  );
}
