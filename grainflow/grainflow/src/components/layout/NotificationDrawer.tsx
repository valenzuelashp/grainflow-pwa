import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Package, Shield, BellOff, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, getProducts } from '../../services/api';

interface NotificationDrawerProps {
  isOpen: boolean;      
  closeDrawer: () => void; 
}

const NotificationDrawer = ({ isOpen, closeDrawer }: NotificationDrawerProps) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const [statsRes, productsRes] = await Promise.all([
        getDashboardStats({}),
        getProducts(),
      ]);

      if (statsRes.ok && productsRes.ok) {
        const statsData = statsRes.data;
        const activeProducts = productsRes.data;

        // Create a Set of active IDs for O(1) lookup
        const activeIds = new Set(activeProducts.map((p: any) => p.id));

        // Filter: ONLY show items that are in the lowStock list AND present in the active products list
        const inventoryAlerts = (statsData.lowStockItems ?? [])
          .filter((item: any) => {
            // Check 1: Is it explicitly marked as archived in the object?
            const isArchivedInObj = item.is_archived === true || item.is_archived === 1 || item.is_archived === '1';
            
            // Check 2: Is it actually missing from the active products list?
            const isMissingFromActive = !activeIds.has(item.id);

            return !isArchivedInObj && !isMissingFromActive;
          })
          .map((item: any) => ({
            id: `stock-${item.id}`,
            type: 'CRITICAL',
            title: 'Critical Stock',
            message: `${item.name} is down to ${item.current_stock ?? item.stockQuantity}${item.unit}.`,
            time: 'Live',
            icon: Package,
            color: 'bg-[var(--primary-main)]/10 text-[var(--primary-main)]', 
            path: '/inventory',
            canDelete: false 
          }));

        const infoAlerts = [
          {
            id: 'login-1',
            type: 'INFO',
            title: 'Security Alert',
            message: 'New login from Chrome on Windows.',
            time: '2h ago',
            icon: Shield,
            color: 'bg-[var(--bg-accent)] text-[var(--secondary-main)]',
            path: '/security',
            canDelete: true
          }
        ];

        setNotifications([...inventoryAlerts, ...infoAlerts]);
      }
    } catch (error) {
      console.error("Failed to load alerts", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchAlerts();
  }, [isOpen]);

  const removeNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[150]" onClose={closeDrawer}>
        <Transition.Child as={Fragment} enter="ease-in-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in-out duration-300" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child as={Fragment} enter="transform transition ease-in-out duration-300" enterFrom="translate-x-full" enterTo="translate-x-0" leave="transform transition ease-in-out duration-300" leaveFrom="translate-x-0" leaveTo="translate-x-full">
                <Dialog.Panel className="pointer-events-auto w-screen max-w-xs transition-colors duration-500">
                  <div className="flex h-full flex-col bg-[var(--bg-system)] shadow-2xl">

                    {/* Header: Aggressively themed with Primary Color */}
                    <div className="p-6 bg-[var(--secondary-main)] text-[var(--bg-accent)] flex items-center justify-between border-b border-black/10 transition-colors duration-500">
                      <div>
                        <h2 className="text-lg font-black italic tracking-widest opacity-90 uppercase">Activity</h2>
                        <p className="text-[10px] text-[var(--bg-accent)]/70 font-bold uppercase tracking-widest mt-0.5">
                          {notifications.length} Active Alerts
                        </p>
                      </div>
                      <button 
                        onClick={closeDrawer} 
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-[var(--bg-accent)] transition-all active:scale-90"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar transition-colors">
                      {loading ? (
                        <div className="text-center py-10 opacity-50 font-black text-[10px] uppercase text-[var(--secondary-main)] animate-pulse">Synchronizing...</div>
                      ) : notifications.length === 0 ? (
                        <div className="text-center py-20 opacity-20 text-[var(--secondary-main)]">
                          <BellOff size={48} className="mx-auto mb-2" />
                          <p className="text-xs font-black uppercase tracking-[0.2em]">All Clear</p>
                        </div>
                      ) : (
                        notifications.map((notif) => {
                          const Icon = notif.icon;
                          return (
                            <div
                              key={notif.id}
                              onClick={() => { navigate(notif.path); closeDrawer(); }}
                              className={`group relative p-4 rounded-3xl border shadow-sm flex gap-3 items-start cursor-pointer transition-all duration-300 ${
                                notif.type === 'CRITICAL' 
                                ? 'bg-[var(--bg-card)] border-[var(--primary-main)]/20 hover:border-[var(--primary-main)]' 
                                : 'bg-[var(--bg-card)]/50 border-[var(--border-color)] hover:border-[var(--secondary-main)]/50'
                              }`}
                            >
                              {notif.canDelete && (
                                <button
                                  onClick={(e) => removeNotification(notif.id, e)}
                                  className="absolute top-3 right-3 p-1.5 opacity-0 group-hover:opacity-100 bg-[var(--bg-system)] text-[var(--text-main)] opacity-40 hover:text-red-600 rounded-lg transition-all"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}

                              <div className={`p-2 rounded-xl shrink-0 ${notif.color} transition-colors duration-500`}>
                                <Icon size={18} />
                              </div>

                              <div className="flex-1 pr-4">
                                <div className="flex items-center gap-2">
                                  <p className={`font-black text-xs leading-tight transition-colors ${notif.type === 'CRITICAL' ? 'text-[var(--primary-main)]' : 'text-[var(--text-main)]'}`}>
                                    {notif.title}
                                  </p>
                                  {notif.type === 'CRITICAL' && (
                                    <span className="w-1.5 h-1.5 bg-[var(--primary-main)] rounded-full animate-pulse shadow-[0_0_8px_var(--primary-main)]"></span>
                                  )}
                                </div>
                                <p className="text-[10px] text-[var(--secondary-main)] mt-1 font-medium leading-relaxed opacity-80">{notif.message}</p>
                                <p className="text-[9px] text-[var(--secondary-main)] mt-2 font-black uppercase tracking-widest opacity-30">{notif.time}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Footer markup */}
                    <div className="p-4 bg-[var(--bg-card)] border-t border-[var(--border-color)] transition-colors duration-500">
                      <button
                        onClick={() => setNotifications(prev => prev.filter(n => !n.canDelete))}
                        className="w-full py-3 text-[10px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-widest hover:opacity-100 hover:text-[var(--primary-main)] transition-all"
                      >
                        Clear Read Messages
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

export default NotificationDrawer;