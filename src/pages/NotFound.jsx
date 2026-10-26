import { Link } from 'react-router-dom';
import { Home as HomeIcon, Utensils } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-4">
        <Utensils className="w-8 h-8 text-orange-500" />
      </div>
      <h1 className="text-4xl font-extrabold font-display text-charcoal-800">404</h1>
      <p className="text-lg text-ink-500 mt-2">This page doesn't exist</p>
      <Link to="/" className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600">
        <HomeIcon className="w-4 h-4" /> Back Home
      </Link>
    </div>
  );
}
