/**
 * UtangModal.tsx
 * This component manages the "View Utang" (Unpaid Balances) functionality.
 */

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Clock, User, Banknote, CreditCard, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCreditTransactions, updateTransactionStatus } from '../../services/api';

interface UtangModalProps {
  isOpen: boolean;     
  closeModal: () => void; 
}

const UtangModal = ({ isOpen, closeModal }: UtangModalProps) => {
  const [unpaidList, setUnpaidList] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  const [confirmData, setConfirmData] = useState<{ 
    show: boolean; 
    id: number; 
    status: 'paid' | 'cancelled';
    method?: string;
  }>({
    show: false,
    id: 0,
    status: 'paid',
    method: 'Cash'
  });

  const fetchUnpaid = async () => {
    setIsLoading(true);
    try {
      const { ok, data } = await getCreditTransactions();
      if (ok) setUnpaidList(data);
    } catch (error) {
      console.error("Failed to fetch utang records", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchUnpaid();
    } else {
      // Reset confirmation overlay when modal closes
      setConfirmData(prev => ({ ...prev, show: false }));
    }
  }, [isOpen]);

  const executeUpdate = async () => {
    try {
      const { ok } = await updateTransactionStatus(confirmData.id, {
        status: confirmData.status,
        payment_method: confirmData.method || 'Cash',
      });

      if (ok) {
        toast.success(`Utang updated successfully!`);
        fetchUnpaid();
      } else {
        toast.error("Failed to update status.");
      }
    } catch (error) {
      console.error("Error updating utang status", error);
      toast.error("Connection error while updating.");
    } finally {
      setConfirmData({ ...confirmData, show: false });
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[150]" onClose={closeModal}>
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 transition-colors duration-500">
            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-[2.5rem] bg-[var(--bg-card)] p-6 shadow-2xl transition-all relative border border-[var(--border-color)]">

              {/* --- FROSTED GLASS CONFIRMATION OVERLAY --- */}
              <Transition
                show={confirmData.show}
                enter="transition-opacity duration-200"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition-opacity duration-150"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div 
                  className="absolute inset-0 bg-[var(--bg-card)]/80 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all"
                  onClick={() => setConfirmData({ ...confirmData, show: false })}
                >
                  <div 
                    className="bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl rounded-[2.5rem] p-8 text-center w-full max-w-sm transition-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm transition-colors ${
                      confirmData.status === 'paid' 
                        ? (confirmData.method === 'Cash' ? 'bg-[var(--bg-system)] text-[var(--text-main)]' : 'bg-blue-50 text-blue-600') 
                        : 'bg-red-50 text-red-500'
                    }`}>
                      {confirmData.status === 'paid' ? <CheckCircle size={28} /> : <AlertTriangle size={28} />}
                    </div>
                    
                    <h3 className="text-xl font-black text-[var(--text-main)] mb-2 uppercase italic tracking-tight transition-colors">
                      {confirmData.status === 'paid' 
                        ? `Pay via ${confirmData.method}?` 
                        : 'Cancel this record?'}
                    </h3>
                    
                    <p className="text-xs text-[var(--secondary-main)] opacity-70 mb-8 font-medium leading-relaxed px-2 transition-colors">
                      {confirmData.status === 'paid' 
                        ? 'This will update your daily sales and mark the balance as settled in today\'s ledger.' 
                        : 'Stock will NOT be returned automatically. This action is final and cannot be undone.'}
                    </p>
                    
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setConfirmData({ ...confirmData, show: false })}
                        className="flex-1 py-3.5 font-black text-[var(--secondary-main)] bg-[var(--bg-system)] border border-[var(--border-color)] rounded-xl hover:bg-[var(--bg-accent)] transition-all text-xs uppercase tracking-widest"
                      >
                        Go Back
                      </button>
                      <button 
                        onClick={executeUpdate}
                        className={`flex-1 py-3.5 font-black text-white shadow-lg rounded-xl transition-all text-xs uppercase tracking-widest border-b-4 border-black/10 active:translate-y-1 ${
                          confirmData.status === 'paid' 
                            ? (confirmData.method === 'Cash' ? 'bg-[var(--text-main)] hover:opacity-90' : 'bg-blue-600 hover:bg-blue-700') 
                            : 'bg-red-500 hover:bg-red-600'
                        }`}
                      >
                        {confirmData.status === 'paid' ? 'Confirm' : 'Yes, Cancel'}
                      </button>
                    </div>
                  </div>
                </div>
              </Transition>

              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6 border-b border-[var(--border-color)] pb-5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[var(--bg-accent)] rounded-2xl text-[var(--primary-main)] shadow-inner transition-colors">
                    <Clock size={24} />
                  </div>
                  <div>
                    <Dialog.Title className="text-xl font-black text-[var(--text-main)] uppercase italic tracking-tighter transition-colors">
                      Utang Records
                    </Dialog.Title>
                    <p className="text-[10px] text-[var(--secondary-main)] opacity-40 font-black uppercase tracking-widest transition-colors">Settle customer store credits</p>
                  </div>
                </div>
                <button 
                  onClick={closeModal} 
                  className="p-2 bg-[var(--bg-system)] hover:bg-[var(--bg-accent)] rounded-full text-[var(--secondary-main)] opacity-40 hover:opacity-100 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Utang List Content */}
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar transition-all">
                {isLoading ? (
                  <div className="py-20 text-center transition-all">
                    <div className="w-10 h-10 border-4 border-[var(--primary-main)]/20 border-t-[var(--primary-main)] rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase text-[var(--secondary-main)] opacity-40 italic tracking-widest">Syncing Ledger...</p>
                  </div>
                ) : unpaidList.length === 0 ? (
                  <div className="text-center py-12 bg-[var(--bg-system)] rounded-[2rem] border-2 border-dashed border-[var(--border-color)] transition-all">
                    <CheckCircle className="mx-auto text-[var(--primary-main)] opacity-20 mb-3" size={48} />
                    <p className="text-[var(--text-main)] font-black uppercase text-xs tracking-widest italic">All clear!</p>
                    <p className="text-[10px] text-[var(--secondary-main)] opacity-40 uppercase font-bold mt-1">No unpaid balances found</p>
                  </div>
                ) : (
                  unpaidList.map((item) => (
                    <div key={item.id} className="bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm rounded-xl p-3 sm:p-4 flex flex-col gap-2 hover:border-[var(--primary-main)]/30 transition-all group animate-in fade-in slide-in-from-bottom-2">
                      {/* Row 1: Name and Date */}
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-black text-[var(--text-main)] flex items-center gap-1.5 uppercase text-[10px] transition-colors truncate">
                          <User size={12} className="text-[var(--primary-main)] opacity-40 shrink-0" /> {item.customer_name}
                        </p>
                        <p className="text-[7px] text-[var(--secondary-main)] font-bold uppercase tracking-tighter opacity-30 whitespace-nowrap">
                          {new Date(item.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {/* Row 2: Product Info and Price */}
                      <div className="flex justify-between items-center gap-2">
                        <p className="text-[8px] text-[var(--secondary-main)] font-black uppercase opacity-60 truncate">
                          {item.quantity} {item.product?.unit || 'kg'} • {item.product?.name || 'Unknown Rice'}
                        </p>
                        <span className="font-black text-[var(--text-main)] text-lg italic transition-colors leading-none whitespace-nowrap">
                          ₱{parseFloat(item.total_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Row 3: Action Buttons */}
                      <div className="flex gap-1.5 w-full">
                        {/* Cancel Action */}
                        <button
                          onClick={() => setConfirmData({ show: true, id: item.id, status: 'cancelled' })}
                          className="p-1.5 text-[var(--secondary-main)] opacity-30 hover:text-red-500 hover:bg-red-50 hover:opacity-100 rounded-lg transition-all border border-transparent hover:border-red-100 shrink-0"
                          title="Cancel Entry"
                        >
                          <XCircle size={16} />
                        </button>

                        {/* Settle via Cash */}
                        <button
                          onClick={() => setConfirmData({ show: true, id: item.id, status: 'paid', method: 'Cash' })}
                          className="flex-1 text-white bg-[var(--text-main)] hover:opacity-90 shadow-md rounded-lg transition-all flex items-center justify-center gap-1 text-[8px] font-black px-2.5 py-1.5 uppercase tracking-wider border-b-2 border-black/20"
                        >
                          <Banknote size={12} /> Cash
                        </button>

                        {/* Settle via Online */}
                        <button
                          onClick={() => setConfirmData({ show: true, id: item.id, status: 'paid', method: 'Online Payment' })}
                          className="flex-1 text-white bg-blue-600 hover:bg-blue-700 shadow-md rounded-lg transition-all flex items-center justify-center gap-1 text-[8px] font-black px-2.5 py-1.5 uppercase tracking-wider border-b-2 border-black/20"
                        >
                          <CreditCard size={12} /> Online
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer Indicator */}
              <div className="mt-6 pt-4 border-t border-[var(--border-color)] text-center transition-colors">
                 <p className="text-[8px] font-black text-[var(--secondary-main)] opacity-20 uppercase tracking-[0.3em]">GrainFlow Settlement Interface</p>
              </div>

            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default UtangModal;