import { Fragment } from 'react';
import { getLogoUrl } from '../../utils/logo';
import { Dialog, Transition } from '@headlessui/react';
import { X, User, Settings, LogOut, Shield, HelpCircle, ChevronRight, Palette, TrendingUp } from 'lucide-react';

interface ProfileDrawerProps {
  isOpen: boolean;
  closeDrawer: () => void;
  onOpenModal: (modalName: string) => void;
  isModalActive: boolean;
}

const ProfileDrawer = ({ isOpen, closeDrawer, onOpenModal, isModalActive }: ProfileDrawerProps) => {

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    closeDrawer();
    window.location.href = '/login';
  };

  const handleMenuClick = (type: string) => {
    closeDrawer(); 
    setTimeout(() => {
        onOpenModal(type);
    }, 300);
  };

  const menuItems = [
    { icon: User, label: 'Profile Details', type: 'profile' },
    { icon: Settings, label: 'Store Settings', type: 'settings' },
    { icon: TrendingUp, label: 'Sales Target', type: 'goal' }, // 🌾 New Option
    { icon: Palette, label: 'System Preferences', type: 'preferences' },
    { icon: Shield, label: 'Security & Password', type: 'security' },
    { icon: HelpCircle, label: 'Help Center', type: 'help' },
  ];

  let userData = { name: 'Guest', email: 'Loading...', logo_path: '' };
  try {
    const userString = localStorage.getItem('user');
    if (userString && userString !== 'undefined') {
      userData = JSON.parse(userString);
    }
  } catch (error) {
    console.error("Error parsing user data", error);
  }

  const logoUrl = getLogoUrl(userData.logo_path);

  return (
    <Transition show={isOpen && !isModalActive} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={closeDrawer}>
        <Transition.Child as={Fragment} enter="ease-in-out duration-500" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in-out duration-500" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child as={Fragment} enter="transform transition ease-in-out duration-500" enterFrom="translate-x-full" enterTo="translate-x-0" leave="transform transition ease-in-out duration-500" leaveFrom="translate-x-0" leaveTo="translate-x-full">
                <Dialog.Panel className="pointer-events-auto w-screen max-w-xs transition-colors duration-500">
                  <div className="flex h-full flex-col bg-[var(--bg-system)] shadow-2xl transition-colors">

                    {/* HEADER */}
                    <div className="p-6 bg-[var(--secondary-main)] text-[var(--bg-accent)] transition-colors duration-500">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-black uppercase tracking-widest italic opacity-90">Account</h2>
                        <button onClick={closeDrawer} className="p-2 hover:bg-white/10 rounded-xl transition-all active:scale-90">
                          <X size={22} />
                        </button>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-[var(--bg-accent)] rounded-2xl flex items-center justify-center text-[var(--secondary-main)] shadow-lg border border-white/30 overflow-hidden transition-colors">
                          {logoUrl ? (
                            <img 
                              src={logoUrl} 
                              alt="Store Logo" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User size={28} />
                          )}
                        </div>
                        <div>
                          <p className="font-black text-lg leading-none tracking-tight">{userData.name}</p>
                          <p className="text-[var(--bg-accent)]/70 text-[10px] mt-1.5 font-bold uppercase tracking-wider">{userData.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* MENU */}
                    <div className="flex-1 py-4 sm:py-8 px-3 sm:px-4 space-y-0 sm:space-y-1.5 overflow-y-auto custom-scrollbar">
                      <p className="px-4 text-[9px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-[0.4em] mb-2 sm:mb-4">Management</p>
                      {menuItems.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleMenuClick(item.type)}
                          className="w-full flex items-center justify-between px-6 py-3 sm:px-4 sm:py-4 rounded-2xl bg-transparent hover:bg-[var(--bg-card)] hover:shadow-md active:scale-[0.98] transition-all group border border-transparent hover:border-[var(--border-color)]"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-xl transition-all duration-300 ${item.type === 'profile' ? 'bg-[var(--primary-main)]/10 text-[var(--primary-main)]' : 'bg-[var(--bg-accent)] text-[var(--secondary-main)] opacity-60 group-hover:opacity-100'}`}>
                                <item.icon size={18} />
                            </div>
                            <span className="font-black text-[var(--text-main)] opacity-70 group-hover:opacity-100 group-hover:text-[var(--primary-main)] transition-colors uppercase text-xs tracking-tighter">{item.label}</span>
                          </div>
                          <ChevronRight size={14} className="text-[var(--secondary-main)] opacity-20 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                        </button>
                      ))}
                    </div>

                    {/* LOGOUT */}
                    <div className="p-4 sm:p-6 border-t border-[var(--border-color)] bg-[var(--bg-card)]/50 transition-colors duration-500">
                      <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-[var(--bg-system)] text-[var(--secondary-main)] opacity-60 font-black hover:bg-red-50 hover:text-red-500 hover:opacity-100 transition-all border border-[var(--border-color)]">
                        <LogOut size={18} /> 
                        <span className="text-xs uppercase tracking-widest">Logout Session</span>
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ProfileDrawer;