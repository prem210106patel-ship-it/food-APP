import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Store, Users, ShoppingCart, Star, Ticket, LogOut, Utensils } from 'lucide-react';
import { useAuth } from '../../lib/auth.jsx';

export default function AdminLayout() {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-orange-500 text-white' : 'text-ink-200 hover:bg-ink-700'
    }`;

  return (
    <div className="min-h-screen bg-ink-900 flex">
      <aside className="w-60 bg-ink-800 text-white flex flex-col fixed h-full z-30 hidden md:flex">
        <div className="p-5 border-b border-ink-700">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center">
              <Utensils className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-bold font-display text-sm">FoodieHub</p>
              <p className="text-xs text-ink-400">Admin Panel</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavLink to="/admin" end className={linkClass}><LayoutDashboard className="w-4 h-4" /> Dashboard</NavLink>
          <NavLink to="/admin/restaurants" className={linkClass}><Store className="w-4 h-4" /> Restaurants</NavLink>
          <NavLink to="/admin/users" className={linkClass}><Users className="w-4 h-4" /> Users</NavLink>
          <NavLink to="/admin/orders" className={linkClass}><ShoppingCart className="w-4 h-4" /> Orders</NavLink>
          <NavLink to="/admin/reviews" className={linkClass}><Star className="w-4 h-4" /> Reviews</NavLink>
          <NavLink to="/admin/coupons" className={linkClass}><Ticket className="w-4 h-4" /> Coupons</NavLink>
        </nav>
        <div className="p-3 border-t border-ink-700">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-white">{profile?.name}</p>
            <p className="text-xs text-ink-400">{profile?.normalized_email}</p>
          </div>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink-200 hover:bg-ink-700 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 md:ml-60 min-h-screen">
        <header className="md:hidden bg-ink-800 text-white p-4 flex items-center justify-between sticky top-0 z-20">
          <span className="font-bold font-display">FoodieHub Admin</span>
          <button onClick={handleSignOut} className="text-sm"><LogOut className="w-5 h-5" /></button>
        </header>
        <div className="md:hidden bg-ink-800 px-4 pb-3 flex gap-2 overflow-x-auto border-b border-ink-700">
          <NavLink to="/admin" end className={({isActive}) => `px-3 py-1.5 text-xs rounded-lg whitespace-nowrap ${isActive ? 'bg-orange-500 text-white' : 'text-ink-200'}`}>Dashboard</NavLink>
          <NavLink to="/admin/restaurants" className={({isActive}) => `px-3 py-1.5 text-xs rounded-lg whitespace-nowrap ${isActive ? 'bg-orange-500 text-white' : 'text-ink-200'}`}>Restaurants</NavLink>
          <NavLink to="/admin/users" className={({isActive}) => `px-3 py-1.5 text-xs rounded-lg whitespace-nowrap ${isActive ? 'bg-orange-500 text-white' : 'text-ink-200'}`}>Users</NavLink>
          <NavLink to="/admin/orders" className={({isActive}) => `px-3 py-1.5 text-xs rounded-lg whitespace-nowrap ${isActive ? 'bg-orange-500 text-white' : 'text-ink-200'}`}>Orders</NavLink>
          <NavLink to="/admin/reviews" className={({isActive}) => `px-3 py-1.5 text-xs rounded-lg whitespace-nowrap ${isActive ? 'bg-orange-500 text-white' : 'text-ink-200'}`}>Reviews</NavLink>
          <NavLink to="/admin/coupons" className={({isActive}) => `px-3 py-1.5 text-xs rounded-lg whitespace-nowrap ${isActive ? 'bg-orange-500 text-white' : 'text-ink-200'}`}>Coupons</NavLink>
        </div>
        <main className="p-4 sm:p-6 lg:p-8 bg-cream-50 min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
