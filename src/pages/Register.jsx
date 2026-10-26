import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Loader2, Utensils } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, name);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-cream-100 to-orange-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-ink-100 p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-orange-500 rounded-2xl mx-auto flex items-center justify-center mb-3">
              <Utensils className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-extrabold font-display text-charcoal-800">Create account</h1>
            <p className="text-sm text-ink-400 mt-1">Join FoodieHub and start ordering</p>
          </div>

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-ink-600 block mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="w-full pl-10 pr-4 py-2.5 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-600 block mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full pl-10 pr-4 py-2.5 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-600 block mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="w-full pl-10 pr-10 py-2.5 text-sm border border-ink-200 rounded-lg focus:outline-none focus:border-orange-400" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-ink-400 mt-6">
            Already have an account? <Link to="/login" className="text-orange-600 font-semibold hover:text-orange-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
