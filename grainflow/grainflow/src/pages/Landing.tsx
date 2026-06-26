import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import grainflowLogo from '../assets/grainflow_logo.svg';
import grainflow from '../assets/grainflow.svg';

const Landing = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
      return;
    }

    // Redirect to login on desktop view
    if (!isMobile) {
      navigate('/login');
      return;
    }

    // Hide mascot on landing page
    const savedMascotVisibility = localStorage.getItem('mascot-visible');
    localStorage.setItem('mascot-visible', 'false');

    // Restore mascot visibility when leaving landing page
    return () => {
      if (savedMascotVisibility !== null) {
        localStorage.setItem('mascot-visible', savedMascotVisibility);
      } else {
        localStorage.setItem('mascot-visible', 'true');
      }
      // Dispatch event to update mascot visibility
      window.dispatchEvent(new CustomEvent('mascot-settings-changed', { detail: { visible: JSON.parse(savedMascotVisibility || 'true') } }));
    };
  }, [navigate, isMobile]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        navigate('/login');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [navigate]);

  const handleCreateAccount = () => {
    navigate('/signup');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-between px-6 py-8 sm:py-12 bg-fixed bg-cover bg-bottom"
      style={{ 
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.4)), url('/rice_login.png')` 
      }}
    >
      {/* Top Section - Logo */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
        {/* Logo and Grainflow - Stacked */}
        <div className="flex flex-col items-center gap-1 sm:gap-6 mb-2 sm:mb-12">
          <img src={grainflowLogo} alt="Logo" className="w-50 h-50 sm:w-32 sm:h-32 object-contain" />
          <img src={grainflow} alt="Grainflow" className="w-62 h-26 sm:w-48 sm:h-24 object-contain" />
        </div>
      </div>

      {/* Bottom Section - Content & Buttons */}
      <div className="flex flex-col items-center justify-end w-full max-w-md space-y-4 sm:space-y-6 pb-4 sm:pb-8">
        <p className="text-xs sm:text-sm text-gray-600 font-medium text-center leading-relaxed">
           Growing your business, one grain at a time.
        </p>

        {/* Buttons Container */}
        <div className="w-full space-y-2 sm:space-y-3 pt-2 sm:pt-4">
          {/* Create Account Button */}
          <button
            onClick={handleCreateAccount}
            className="w-full bg-[var(--primary-main)] hover:bg-[var(--secondary-main)] text-white font-black py-3 sm:py-4 rounded-2xl sm:rounded-3xl shadow-lg shadow-orange-200 active:scale-95 transition-all uppercase tracking-widest text-xs sm:text-sm"
          >
            Create Account
          </button>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-black py-3 sm:py-4 rounded-2xl sm:rounded-3xl shadow-lg shadow-gray-900/30 active:scale-95 transition-all uppercase tracking-widest text-xs sm:text-sm"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
