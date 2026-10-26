import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/auth.jsx';
import StoreLayout from './components/layout/StoreLayout.jsx';
import Home from './pages/Home.jsx';
import Restaurants from './pages/Restaurants.jsx';
import RestaurantDetail from './pages/RestaurantDetail.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderConfirmation from './pages/OrderConfirmation.jsx';
import OrderTracking from './pages/OrderTracking.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Orders from './pages/Orders.jsx';
import Account from './pages/Account.jsx';
import Favorites from './pages/Favorites.jsx';
import Offers from './pages/Offers.jsx';
import NotFound from './pages/NotFound.jsx';
import AdminLayout from './components/admin/AdminLayout.jsx';
import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminRestaurants from './pages/admin/Restaurants.jsx';
import AdminUsers from './pages/admin/Users.jsx';
import AdminOrders from './pages/admin/Orders.jsx';
import AdminReviews from './pages/admin/Reviews.jsx';
import AdminCoupons from './pages/admin/Coupons.jsx';
import RestaurantLayout from './components/restaurant-dashboard/RestaurantLayout.jsx';
import RestaurantDashboard from './pages/restaurant/Dashboard.jsx';
import RestaurantOrders from './pages/restaurant/Orders.jsx';
import RestaurantMenu from './pages/restaurant/Menu.jsx';
import RestaurantTables from './pages/restaurant/Tables.jsx';
import QrTableMenu from './pages/qr/TableMenu.jsx';
import QrOrderTrack from './pages/qr/OrderTrack.jsx';
import QrScan from './pages/qr/Scan.jsx';

function ProtectedRoute({ children, requireOwner = false, requireAdmin = false }) {
  const { isAuthenticated, isOwner, isAdmin, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireOwner && !isOwner && !isAdmin) return <Navigate to="/" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<StoreLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/restaurants" element={<Restaurants />} />
        <Route path="/restaurants/:slug" element={<RestaurantDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order/:orderNumber" element={<OrderConfirmation />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
        <Route path="/offers" element={<Offers />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="restaurants" element={<AdminRestaurants />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="coupons" element={<AdminCoupons />} />
      </Route>

      <Route path="/restaurant" element={<ProtectedRoute requireOwner><RestaurantLayout /></ProtectedRoute>}>
        <Route index element={<RestaurantDashboard />} />
        <Route path="orders" element={<RestaurantOrders />} />
        <Route path="menu" element={<RestaurantMenu />} />
        <Route path="tables" element={<RestaurantTables />} />
      </Route>

      <Route path="/qr/table/:token" element={<QrTableMenu />} />
      <Route path="/qr/order/:token" element={<QrOrderTrack />} />
      <Route path="/qr/scan" element={<QrScan />} />
      <Route path="/track/:token" element={<OrderTracking />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
