import { useState, useEffect } from 'react';
import { Package, ShoppingCart, Home, LineChart, BarChart3, ChevronLeft, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useLayout } from '../../App';

// SVG ASSETS
import grainflowLogo from '../../assets/grainflow_logo.svg';
import grainflowName from '../../assets/grainflow.svg';

const BottomNav = () => {
  const location = useLocation();
  const { isMobile, isCollapsed, setIsCollapsed } = useLayout();
  
  // State to track visibility for scroll-to-hide
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const navItems = [
    { name: 'Inventory', path: '/inventory', icon: Package },
    { name: 'POS', path: '/pos', icon: ShoppingCart },
    { name: 'Home', path: '/', icon: Home, isCenter: true },
    { name: 'Analytics', path: '/analytics', icon: LineChart },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
  ];

  // --- SCROLL LOGIC FOR MOBILE ---
  useEffect(() => {
    if (!isMobile) return;

    const controlNavbar = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true);
      } 
      else if (currentScrollY > lastScrollY && currentScrollY > 70) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', controlNavbar);
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [lastScrollY, isMobile]);

  // --- 1. DESKTOP SIDEBAR ---
  if (!isMobile) {
    return (
      <nav 
        className={`fixed top-0 left-0 h-full flex flex-col items-center pt-10 pb-8 shadow-[10px_0_40px_rgba(0,0,0,0.05)] z-50 border-r border-white/40 transition-all duration-700 ease-in-out backdrop-blur-[18px] ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
        style={{ 
          background: `linear-gradient(135deg, rgba(245, 241, 235, 0.8) 0%, rgba(230, 224, 214, 0.7) 100%)`,
          boxShadow: 'inset -2px 0 10px rgba(255, 255, 255, 0.5), 10px 0 50px rgba(0, 0, 0, 0.03)'
        }}
      >
        <div className="mb-10 flex flex-col items-center w-full px-4">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="mb-8 p-2.5 rounded-2xl bg-white/40 border border-white/60 text-[#4A443F] hover:bg-[#C5A47E] hover:text-white transition-all shadow-sm active:scale-95"
          >
            {isCollapsed ? <Menu size={22} /> : <ChevronLeft size={22} />}
          </button>

          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-white/60 backdrop-blur-xl rounded-[2rem] flex items-center justify-center shadow-[0_15px_35px_rgba(0,0,0,0.08)] shrink-0 border border-white/80 overflow-hidden p-3 transform transition-transform hover:rotate-3">
              <img src={grainflowLogo} alt="Logo" className="w-full h-full object-contain" />
            </div>

            {!isCollapsed && (
              <div className="animate-in fade-in zoom-in-95 duration-700">
                <img 
                  src={grainflowName} 
                  alt="GrainFlow" 
                  className="h-12 w-auto opacity-90" 
                  style={{ filter: 'sepia(0.2) saturate(1.2)' }} 
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center p-3.5 rounded-2xl transition-all duration-500 relative w-[85%] ${
                  isActive 
                    ? 'bg-[#C5A47E] shadow-[0_10px_20px_rgba(197,164,126,0.3)] scale-105' 
                    : 'bg-white/20 hover:bg-white/50 border border-white/30'
                }`}
              >
                {isActive && (
                  <div className="absolute -left-2 w-1.5 h-6 rounded-full bg-[#A16207] shadow-[0_0_15px_#A16207]" />
                )}
                
                <div className={`flex justify-center ${isCollapsed ? 'w-full' : 'mr-4 shrink-0'}`}>
                  <Icon 
                    className={isActive ? 'text-white' : 'text-[#4A443F]'}
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />
                </div>
                
                {!isCollapsed && (
                  <span 
                    className={`text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap ${
                      isActive ? 'text-white' : 'text-[#4A443F]'
                    }`}
                  >
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  // --- 2. MOBILE BOTTOM NAV (SLIMMED VERSION) ---
  return (
    <nav 
      className={`fixed bottom-0 left-0 right-0 px-4 z-50 border-t border-white/50 rounded-t-[2.5rem] pb-2 pt-1 backdrop-blur-2xl shadow-[0_-15px_40px_rgba(0,0,0,0.05)] transition-transform duration-500 ease-in-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{ 
        background: 'linear-gradient(to top, rgba(245, 241, 235, 0.95), rgba(255, 255, 255, 0.8))'
      }}
    >
      <div className="flex justify-around items-end max-w-md mx-auto relative z-10 h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center transition-all duration-300 ${item.isCenter ? 'mb-1' : 'mb-2'}`}
            >
              <div 
                className={`transition-all duration-500 flex items-center justify-center ${
                  item.isCenter 
                    ? 'w-14 h-14 rounded-[1.2rem] bg-[#C5A47E] shadow-[0_10px_25px_rgba(197,164,126,0.3)] border-4 border-white scale-105 -translate-y-3' 
                    : `w-10 h-10 rounded-xl ${isActive ? 'bg-[#C5A47E]/10 border border-[#C5A47E]/10' : ''}`
                }`}
              >
                <Icon 
                    className={item.isCenter || isActive ? 'text-[#4A443F]' : 'text-[#8B8178]'}
                    size={item.isCenter ? 26 : 20}
                    strokeWidth={isActive ? 2.5 : 1.5}
                />
              </div>
              {!item.isCenter && (
                <span className={`text-[8px] font-bold uppercase tracking-tight mt-0.5 ${isActive ? 'text-[#C5A47E]' : 'text-[#8B8178]'}`}>
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;