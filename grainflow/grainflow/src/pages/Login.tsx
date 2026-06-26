import { useNavigate, Link } from 'react-router-dom';
import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import { login } from '../services/api';
import grainflowLogo from '../assets/grainflow_logo.svg';
import grainflow from '../assets/grainflow.svg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { ok, data } = await login(email, password);
      if (ok) {
        toast.success('Login successful!');
        navigate('/dashboard');
      } else {
        toast.error((data as { message?: string }).message || 'Login failed.');
      }
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="h-screen w-full flex items-center justify-center bg-fixed bg-cover bg-bottom overflow-hidden"
      style={{ backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.4)), url('./rice_login.png')` }}
    >
      <div className="flex flex-col lg:flex-row w-full h-full lg:h-[90vh] lg:max-w-[1400px] lg:m-8 bg-white/40 backdrop-blur-md lg:rounded-[3rem] border border-white/40 shadow-2xl overflow-hidden">
        <div className="lg:w-1/2 p-6 lg:p-10 flex flex-col items-center justify-center bg-gradient-to-br from-orange-500/10 to-transparent border-b lg:border-b-0 lg:border-r border-white/20">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="hidden lg:flex flex-col items-center">
              <img src={grainflowLogo} alt="Logo" className="w-40 h-40 object-contain drop-shadow-lg" />
              <img src={grainflow} alt="GrainFlow" className="w-80 h-auto object-contain mt-4" />
            </div>
            <div className="flex lg:hidden items-center justify-center gap-3 mb-2">
              <img src={grainflowLogo} alt="Logo" className="w-10 h-10 object-contain" />
              <img src={grainflow} alt="GrainFlow" className="w-32 h-auto object-contain" />
            </div>
            <p className="text-orange-900/60 font-black uppercase tracking-[0.25em] text-[9px] sm:text-[10px] max-w-xs">
              Rice retail POS — works offline, no server needed
            </p>
          </div>
        </div>

        <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-gray-900 italic tracking-tight">Welcome!</h2>
            <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mt-1">Sign in to your store</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
              <input
                type="email"
                placeholder="Email Address"
                className="w-full pl-11 pr-4 py-3.5 bg-white/60 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none font-bold text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
              <input
                type="password"
                placeholder="Password"
                className="w-full pl-11 pr-4 py-3.5 bg-white/60 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none font-bold text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex gap-3 p-3 bg-orange-50/80 rounded-xl border border-orange-100 items-start">
              <Store size={14} className="text-orange-600 mt-0.5 shrink-0" />
              <p className="text-[9px] text-orange-800 font-bold leading-relaxed uppercase tracking-tight">
                All data is stored on this device. Install as an app for the best experience.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[var(--primary-main)] hover:bg-[var(--secondary-main)] text-white font-black py-3.5 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs disabled:opacity-70"
            >
              {isLoading ? 'Signing in...' : 'Login'} <ArrowRight size={18} />
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-gray-600 text-xs font-medium">
              New store?{' '}
              <Link to="/signup" className="text-orange-600 font-black hover:underline uppercase tracking-tighter">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
