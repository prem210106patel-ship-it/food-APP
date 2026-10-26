import { Link } from 'react-router-dom';
import { Utensils, Mail, Phone, MapPin, Instagram, Twitter, Facebook } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-charcoal-800 text-ink-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center">
                <Utensils className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-extrabold font-display text-white">
                Foodie<span className="text-orange-500">Hub</span>
              </span>
            </div>
            <p className="text-sm text-ink-400 leading-relaxed">
              Your favourite food, delivered fast. Discover restaurants, order online, or dine in with QR ordering.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Discover</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/restaurants" className="hover:text-orange-400 transition-colors">All Restaurants</Link></li>
              <li><Link to="/restaurants?sort=rating" className="hover:text-orange-400 transition-colors">Top Rated</Link></li>
              <li><Link to="/restaurants?sort=delivery" className="hover:text-orange-400 transition-colors">Fastest Delivery</Link></li>
              <li><Link to="/offers" className="hover:text-orange-400 transition-colors">Offers & Coupons</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Account</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/login" className="hover:text-orange-400 transition-colors">Sign In</Link></li>
              <li><Link to="/register" className="hover:text-orange-400 transition-colors">Create Account</Link></li>
              <li><Link to="/orders" className="hover:text-orange-400 transition-colors">Track Order</Link></li>
              <li><Link to="/restaurant" className="hover:text-orange-400 transition-colors">For Restaurants</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Contact</h3>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-orange-400" /> hello@foodiehub.app</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-orange-400" /> +91 80 4567 8900</li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-orange-400" /> Bengaluru, India</li>
            </ul>
            <div className="flex gap-3 mt-4">
              <a href="#" className="w-8 h-8 rounded-lg bg-ink-700 hover:bg-orange-500 flex items-center justify-center transition-colors" aria-label="Instagram"><Instagram className="w-4 h-4" /></a>
              <a href="#" className="w-8 h-8 rounded-lg bg-ink-700 hover:bg-orange-500 flex items-center justify-center transition-colors" aria-label="Twitter"><Twitter className="w-4 h-4" /></a>
              <a href="#" className="w-8 h-8 rounded-lg bg-ink-700 hover:bg-orange-500 flex items-center justify-center transition-colors" aria-label="Facebook"><Facebook className="w-4 h-4" /></a>
            </div>
          </div>
        </div>

        <div className="border-t border-ink-700 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-ink-400">© 2026 FoodieHub. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-ink-400">
            <a href="#" className="hover:text-orange-400">Privacy Policy</a>
            <a href="#" className="hover:text-orange-400">Terms of Service</a>
            <a href="#" className="hover:text-orange-400">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
