import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ShoppingCart, Search, Menu, X, User, Heart, LogOut, LayoutDashboard, Utensils } from 'lucide-react';
import { useAuth } from '../../lib/auth.jsx';
import { useCart } from '../../lib/cart.jsx';

export default function Header() {
  const { isAuthenticated, profile, signOut, isAdmin, isOwner } = useAuth();
  const { totalItems } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/restaurants?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileOpen(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
    navigate('/');
  };

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-orange-600' : 'text-ink-600 hover:text-orange-600'}`;

  return (
    <header className="sticky top-0 z-50 bg-cream-50/90 backdrop-blur-md border-b border-ink-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center">
              <Utensils className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-extrabold font-display text-charcoal-800 hidden sm:block">
              Foodie<span className="text-orange-500">Hub</span>
            </span>
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search restaurants or cuisines..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-cream-100 border border-transparent rounded-full focus:outline-none focus:border-orange-300 focus:bg-white transition-all"
            />
          </form>

          <nav className="hidden md:flex items-center gap-6">
            <NavLink to="/" className={navLinkClass} end>Home</NavLink>
            <NavLink to="/restaurants" className={navLinkClass}>Restaurants</NavLink>
            {isAuthenticated && <NavLink to="/orders" className={navLinkClass}>My Orders</NavLink>}
            {isOwner && <NavLink to="/restaurant" className={navLinkClass}>Dashboard</NavLink>}
            {isAdmin && <NavLink to="/admin" className={navLinkClass}>Admin</NavLink>}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/cart"
              className="relative p-2.5 rounded-full hover:bg-cream-100 transition-colors"
              aria-label="Cart"
            >
              <ShoppingCart className="w-5 h-5 text-ink-700" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-scale-in">
                  {totalItems}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-cream-100 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">
                    {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-ink-700">
                    {profile?.name?.split(' ')[0] || 'Account'}
                  </span>
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-ink-100 py-2 z-50 animate-scale-in">
                      <div className="px-4 py-2 border-b border-ink-100">
                        <p className="text-sm font-semibold text-ink-800">{profile?.name}</p>
                        <p className="text-xs text-ink-400">{profile?.normalized_email}</p>
                      </div>
                      <Link to="/account" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-600 hover:bg-cream-50 transition-colors">
                        <User className="w-4 h-4" /> My Account
                      </Link>
                      <Link to="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-600 hover:bg-cream-50 transition-colors">
                        <ShoppingCart className="w-4 h-4" /> Order History
                      </Link>
                      <Link to="/favorites" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-600 hover:bg-cream-50 transition-colors">
                        <Heart className="w-4 h-4" /> Favorites
                      </Link>
                      {(isOwner || isAdmin) && (
                        <Link to={isAdmin ? "/admin" : "/restaurant"} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-600 hover:bg-cream-50 transition-colors">
                          <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </Link>
                      )}
                      <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-full hover:bg-orange-600 transition-colors"
              >
                Sign In
              </Link>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-cream-100"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-ink-100 animate-fade-in">
            <form onSubmit={handleSearch} className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search restaurants..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-cream-100 rounded-full focus:outline-none"
              />
            </form>
            <nav className="flex flex-col gap-1">
              <NavLink to="/" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-cream-100 rounded-lg" end>Home</NavLink>
              <NavLink to="/restaurants" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-cream-100 rounded-lg">Restaurants</NavLink>
              {isAuthenticated && <NavLink to="/orders" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-cream-100 rounded-lg">My Orders</NavLink>}
              {isOwner && <NavLink to="/restaurant" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-cream-100 rounded-lg">Owner Dashboard</NavLink>}
              {isAdmin && <NavLink to="/admin" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-cream-100 rounded-lg">Admin Dashboard</NavLink>}
              {!isAuthenticated && (
                <Link to="/login" onClick={() => setMobileOpen(false)} className="mt-2 px-4 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-full text-center">Sign In</Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
