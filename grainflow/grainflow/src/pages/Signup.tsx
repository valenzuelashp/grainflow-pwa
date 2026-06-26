import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Store, ArrowLeft, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { register } from '../services/api';
import grainflowLogo from '../assets/grainflow_logo.svg';
import grainflow from '../assets/grainflow.svg';

const Signup = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    storeName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const isStrongPassword = (pass: string) => /^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/.test(pass);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isStrongPassword(formData.password)) {
      return toast.error('Password must be 8+ chars with both a number and a symbol.');
    }
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match.');
    }

    setIsLoading(true);
    try {
      const { ok, data } = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        store_name: formData.storeName,
      });

      if (ok) {
        toast.success('Store account created!');
        navigate('/dashboard');
      } else {
        toast.error((data as { message?: string }).message || 'Registration failed.');
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
        <div className="lg:w-1/2 p-4 lg:p-10 flex flex-col items-center justify-center bg-gradient-to-br from-orange-500/10 to-transparent border-b lg:border-b-0 lg:border-r border-white/20">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="hidden lg:flex flex-col items-center">
              <img src={grainflowLogo} alt="Logo" className="w-40 h-40 object-contain drop-shadow-lg" />
              <img src={grainflow} alt="GrainFlow" className="w-80 h-auto object-contain mt-4" />
            </div>
            <div className="flex lg:hidden items-center justify-center gap-3 mb-2">
              <img src={grainflowLogo} alt="Logo" className="w-12 h-12 object-contain" />
              <img src={grainflow} alt="GrainFlow" className="w-32 h-auto object-contain" />
            </div>
            <p className="text-orange-900/60 font-black uppercase tracking-[0.25em] text-[9px] sm:text-[10px] max-w-xs">
              Set up your rice store in minutes
            </p>
          </div>
        </div>

        <div className="lg:w-1/2 p-6 lg:p-12 flex flex-col justify-center overflow-y-auto">
          <div className="w-full max-w-md mx-auto space-y-4">
            <div className="mb-2">
              <Link to="/login" className="text-[var(--secondary-main)] hover:text-orange-600 flex items-center gap-1 mb-2 transition-colors w-fit">
                <ArrowLeft size={14} /> <span className="text-[10px] font-black uppercase tracking-widest">Back to Login</span>
              </Link>
              <h2 className="text-2xl font-black text-gray-900 italic tracking-tight leading-none">Create Account</h2>
              <p className="text-gray-500 font-bold text-[9px] uppercase tracking-widest mt-1">Start managing your bigasan today</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-2">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={16} />
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full pl-11 pr-4 py-2.5 bg-white/60 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-sm"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="relative">
                <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={16} />
                <input
                  type="text"
                  placeholder="Rice Store Name"
                  className="w-full pl-11 pr-4 py-2.5 bg-white/60 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-sm"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={16} />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full pl-11 pr-4 py-2.5 bg-white/60 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-sm"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create Password"
                  className="w-full pl-11 pr-12 py-2.5 bg-white/60 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-sm"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isLoading}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={16} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  className="w-full pl-11 pr-12 py-2.5 bg-white/60 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-sm"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={isLoading}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <p className="text-[8px] font-black text-orange-600 px-2 uppercase tracking-tighter">
                Password: 8+ characters, 1 number & 1 symbol. Data stays on this device.
              </p>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[var(--primary-main)] hover:bg-[var(--secondary-main)] text-white font-black uppercase tracking-widest py-3 rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-75 text-[10px]"
              >
                {isLoading ? 'Creating...' : 'Create Account'} <ArrowRight size={14} className="inline ml-1" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
