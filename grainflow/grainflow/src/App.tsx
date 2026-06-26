import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Bell, User } from 'lucide-react';

// 🚀 IMPORT LOGO
import grainflowLogo from './assets/grainflow_logo.svg';

// Layout & Components
import BottomNav from './components/layout/BottomNav';
import ProfileDrawer from './components/layout/ProfileDrawer';
import NotificationDrawer from './components/layout/NotificationDrawer';
import {
  ProfileModal,
  SecurityModal,
  StoreSettingsModal,
  HelpCenterModal,
  PreferencesModal,
  GoalModal
} from './components/modals/AccountModals';

// Pages.
import Login from './pages/Login';
import Signup from './pages/Signup';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import POS from './pages/POS';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';

// Sales & Archive Pages
import AllSales from './pages/AllSales'; 
import FilteredSales from './pages/FilteredSales';
import DetailedArchive from './pages/DetailedArchive';
import { Toaster } from 'react-hot-toast';

// --- PRO LAYOUT CONTEXT ---
interface LayoutContextType {
  isMobile: boolean;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  isNavVisible: boolean;
  setIsNavVisible: (val: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) throw new Error('useLayout must be used within a LayoutProvider');
  return context;
};

const LayoutProvider = ({ children }: { children: React.ReactNode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isNavVisible, setIsNavVisible] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsCollapsed(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <LayoutContext.Provider value={{ isMobile, isCollapsed, setIsCollapsed, isNavVisible, setIsNavVisible }}>
      {children}
    </LayoutContext.Provider>
  );
};

const MainHeader = ({ storeName, setIsNotifOpen, setIsProfileOpen }: any) => {
  const location = useLocation();
  
  const getHeaderInfo = () => {
    switch (location.pathname) {
      case '/inventory': return { title: 'Inventory', sub: 'Stock Management' };
      case '/pos': return { title: 'POS', sub: 'Point of Sale' };
      case '/reports': return { title: 'Reports', sub: 'Audit Intelligence' };
      case '/analytics': return { title: 'Analytics', sub: 'Performance Data' };
      case '/sales/all': return { title: 'All Sales', sub: 'Transaction History' };
      default: return { title: storeName, sub: 'GrainFlow Dashboard' };
    }
  };

  const { title, sub } = getHeaderInfo();

  return (
    <header className="h-[45px] sm:h-[70px] px-4 bg-[var(--bg-card)] border-b border-[var(--border-color)] sticky top-0 z-50 flex justify-between items-center shadow-sm transition-colors duration-500">
      <div className="flex items-center gap-2">
        {/* 🚀 LOGO REPLACED WHEAT EMOJI */}
        <img 
          src={grainflowLogo} 
          alt="GrainFlow Logo" 
          className="w-6 h-6 sm:w-10 sm:h-10 object-contain"
        />
        <div className="flex flex-col justify-center">
          <h1 className="text-[13px] sm:text-[22px] font-bold text-[var(--primary-main)] leading-none">{title}</h1>
          <p className="text-[7px] sm:text-[10px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-[0.10em] mt-1">{sub}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <button onClick={() => setIsNotifOpen(true)} className="relative p-2 text-[var(--secondary-main)] opacity-60 hover:opacity-100 transition-opacity">
          <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <button onClick={() => setIsProfileOpen(true)} className="w-6 h-6 sm:w-8 sm:h-8 bg-[var(--bg-accent)] rounded-full flex items-center justify-center text-[var(--primary-main)] border border-[var(--primary-main)]/20 transition-all active:scale-90">
          <User className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </header>
  );
};

function AppContent() {
  const { isMobile, isCollapsed } = useLayout();
  const isAuthenticated = localStorage.getItem('token') !== null;

  useEffect(() => {
    const themes: any = {
      classic: { primary: '#fa9d6a', secondary: '#8B5E3C', accent: '#F5F5DC', card: '#ffffff', system: '#F9FAFB', border: '#E5E7EB', text: '#111827', overlay: 'rgba(249, 250, 251, 0.4)' },
      forest: { primary: '#A8BBA3', secondary: '#4A5D45', accent: '#f1f5f0', card: '#ffffff', system: '#f7f9f7', border: '#e2e8e1', text: '#2d3a2a', overlay: 'rgba(247, 249, 247, 0.6)' },
      ocean: { primary: '#7ba7bd', secondary: '#455a64', accent: '#f0f4f7', card: '#ffffff', system: '#f4f7f9', border: '#dae1e7', text: '#263238', overlay: 'rgba(244, 247, 249, 0.6)' },
      silk: { primary: '#C2A378', secondary: '#5C5448', accent: '#FAF9F6', card: '#ffffff', system: '#F5F5F0', border: '#E8E6E1', text: '#4A463F', overlay: 'rgba(255, 255, 255, 0.75)' },
      peach: { primary: '#DC9B9B', secondary: '#7D4F4F', accent: '#fff5f5', card: '#ffffff', system: '#fffafa', border: '#f7e4e4', text: '#4a3232', overlay: 'rgba(255, 250, 250, 0.7)' },
    };
    const savedThemeId = localStorage.getItem('system-theme') || 'classic';
    const theme = themes[savedThemeId] || themes.classic;
    const root = document.documentElement;
    root.style.setProperty('--primary-main', theme.primary);
    root.style.setProperty('--secondary-main', theme.secondary);
    root.style.setProperty('--bg-accent', theme.accent);
    root.style.setProperty('--bg-card', theme.card);
    root.style.setProperty('--bg-system', theme.system);
    root.style.setProperty('--border-color', theme.border);
    root.style.setProperty('--text-main', theme.text);
    root.style.setProperty('--bg-overlay', theme.overlay);
  }, []);

  const getStoreName = () => {
    try {
      const userString = localStorage.getItem('user');
      if (userString && userString !== 'undefined') {
        const user = JSON.parse(userString);
        return user?.store_name || user?.name || 'GrainFlow';
      }
      return 'GrainFlow';
    } catch (error) { return 'GrainFlow'; }
  };

  const [storeName, setStoreName] = useState(getStoreName);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const closeCurrentModal = () => {
    setActiveModal(null);
    setStoreName(getStoreName());
    setTimeout(() => setIsProfileOpen(true), 200);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-system)] font-sans text-[var(--text-main)] transition-colors duration-500 bg-fixed bg-cover bg-center"
      style={{ backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.4)), url('/rice.png')`, backgroundAttachment: 'fixed', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />} />       
         <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/*" element={
            isAuthenticated ? (
              <div className="flex flex-col md:flex-row min-h-screen">
                <BottomNav />
                
                <div className={`flex-1 flex flex-col transition-all duration-500 ease-in-out ${!isMobile ? (isCollapsed ? 'ml-24' : 'ml-64') : 'ml-0 pb-0 sm:pb-16'}`}>
                  <MainHeader storeName={storeName} setIsNotifOpen={setIsNotifOpen} setIsProfileOpen={setIsProfileOpen} />
                  <NotificationDrawer isOpen={isNotifOpen} closeDrawer={() => setIsNotifOpen(false)} />
                  <ProfileDrawer isOpen={isProfileOpen} closeDrawer={() => setIsProfileOpen(false)} onOpenModal={(name) => setActiveModal(name)} isModalActive={!!activeModal} />
                  
                  {activeModal && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" onClick={closeCurrentModal} />
                      <div className="bg-[var(--bg-card)] w-full max-w-md rounded-[2.5rem] p-8 relative shadow-2xl z-10 border border-[var(--border-color)]">
                        {activeModal === 'profile' && <ProfileModal onClose={closeCurrentModal} />}
                        {activeModal === 'settings' && <StoreSettingsModal onClose={closeCurrentModal} />}
                        {activeModal === 'security' && <SecurityModal onClose={closeCurrentModal} />}
                        {activeModal === 'help' && <HelpCenterModal onClose={closeCurrentModal} />}
                        {activeModal === 'preferences' && <PreferencesModal onClose={closeCurrentModal} />}
                        {activeModal === 'goal' && <GoalModal onClose={closeCurrentModal} />}
                      </div>
                    </div>
                  )}

                  <main className="flex-1 overflow-x-hidden">
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/inventory" element={<Inventory />} />
                      <Route path="/pos" element={<POS/>} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/sales/all" element={<AllSales />} />
                      <Route path="/sales/:period" element={<FilteredSales />} /> 
                      <Route path="/archive/:period" element={<DetailedArchive />} />
                      
                      {/* 2. Make sure ALL fallbacks go to /dashboard, not / */}
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </main>
                </div>
              </div>
            ) : ( <Navigate to="/login" replace /> )
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <LayoutProvider>
      <Router><AppContent /></Router>
      <Toaster position="top-right" reverseOrder={false} />
    </LayoutProvider>
  );
}

export default App;