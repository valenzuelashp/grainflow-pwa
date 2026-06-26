import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect} from 'react';
import { X, Plus, Trash2, CalendarDays, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCustomers, createTransaction } from '../../services/api';

interface PastSaleItem {
  product_id: number;
  name: string;
  quantity: number;
  price: number;
  unit: string;
}

interface PastSalesModalProps {
  isOpen: boolean;
  closeModal: () => void;
  products: any[];
  onSuccess: () => void;
  onSavePastSale?: (method: 'Cash' | 'Online Payment' | 'Utang', manualDate?: string) => Promise<void>;
}

const PastSalesModal = ({ isOpen, closeModal, products, onSuccess }: PastSalesModalProps) => {
  const today = new Date().toISOString().split('T')[0];
  const [saleDate, setSaleDate] = useState(today);
  const [items, setItems] = useState<PastSaleItem[]>([]);
  
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Online Payment' | 'Utang'>('Cash');
  const [customerName, setCustomerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateError, setDateError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  // --- INVENTORY-STYLE PREDICTION LOGIC ---
  const [allCustomers, setAllCustomers] = useState<string[]>([]);
  const [prediction, setPrediction] = useState('');

  // Fetch customers when modal opens
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { ok, data } = await getCustomers();
        if (ok) setAllCustomers(Array.from(new Set(data)));
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };

    if (isOpen) fetchCustomers();
  }, [isOpen]);

  // Inventory-style search handlers
  const handleCustomerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomerName(value);
    
    if (value.length > 0) {
      const match = allCustomers.find(name => 
        name.toLowerCase().startsWith(value.toLowerCase())
      );
      setPrediction(match ? match : '');
    } else {
      setPrediction('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Tab' || e.key === 'ArrowRight') && prediction) {
      e.preventDefault();
      setCustomerName(prediction);
      setPrediction('');
    }
  };

  const handleDateChange = (val: string) => {
    setSaleDate(val);
    if (val > today) {
      setDateError('Date cannot be in the future.');
    } else {
      setDateError('');
    }
  };

  const addItem = () => {
    if (products.length === 0) return;
    const first = products[0];
    setItems(prev => [...prev, {
      product_id: first.id,
      name: first.name,
      quantity: 1,
      price: first.price,
      unit: first.unit,
    }]);
  };

  const updateItem = (idx: number, field: keyof PastSaleItem, value: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      if (field === 'product_id') {
        const found = products.find(p => p.id === Number(value));
        return found
          ? { ...item, product_id: found.id, name: found.name, price: found.price, unit: found.unit }
          : item;
      }
      return { ...item, [field]: field === 'quantity' ? parseFloat(value) || 0 : value };
    }));
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handlePreSubmitCheck = () => {
    if (items.length === 0) {
      toast.error('Add at least one item.');
      return;
    }
    if (dateError) return;
    if (paymentMethod === 'Utang' && !customerName.trim()) {
      toast.error('Customer name is required for Utang.');
      return;
    }
    setShowConfirm(true);
  };

  const executeSubmission = async () => {
    setIsSubmitting(true);
    try {
      for (const item of items) {
        const { ok, data } = await createTransaction({
          product_id: item.product_id,
          quantity: item.quantity,
          payment_method: paymentMethod,
          customer_name: customerName || 'Walk-In',
          discount_applied: 0,
          created_at: saleDate,
        });

        if (!ok) {
          throw new Error((data as { message?: string }).message || `Failed to save ${item.name}`);
        }
      }
      toast.success('Past sales recorded successfully!');
      setItems([]);
      setCustomerName('');
      setSaleDate(today);
      onSuccess();
      closeModal();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record past sales');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeModal}>
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center transition-colors duration-500">
            <Dialog.Panel className="w-full max-w-md rounded-t-[2.5rem] bg-[var(--bg-card)] p-6 shadow-2xl relative overflow-hidden border-t border-[var(--border-color)]">
              
              {/* Confirmation Overlay */}
              <Transition
                show={showConfirm}
                enter="transition-opacity duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition-opacity duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div 
                  className="absolute inset-0 bg-[var(--bg-card)]/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all"
                  onClick={() => setShowConfirm(false)}
                >
                  <div 
                    className="bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl rounded-[2.5rem] p-8 text-center w-full max-w-[90%] transition-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600 shadow-sm transition-colors">
                      <AlertTriangle size={28} />
                    </div>
                    <h3 className="text-xl font-black text-[var(--text-main)] mb-2 italic uppercase">Record entries?</h3>
                    <p className="text-xs text-[var(--secondary-main)] mb-8 font-medium leading-relaxed opacity-80">
                      Stock will be deducted for <span className="font-black text-[var(--primary-main)] underline">{saleDate}</span>. This action is final in the ledger.
                    </p>
                    <div className="flex gap-3">
                      <button onClick={() => setShowConfirm(false)} className="flex-1 py-3.5 font-black text-[var(--secondary-main)] bg-[var(--bg-system)] border border-[var(--border-color)] rounded-xl hover:bg-[var(--bg-accent)] text-xs uppercase tracking-widest transition-all">Cancel</button>
                      <button 
                        onClick={() => { setShowConfirm(false); executeSubmission(); }}
                        className="flex-1 py-3.5 font-black text-white bg-[var(--primary-main)] shadow-lg shadow-[var(--primary-main)]/20 rounded-xl text-xs uppercase tracking-widest transition-all border-b-4 border-black/10 active:translate-y-1"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              </Transition>

              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[var(--bg-accent)] rounded-xl text-[var(--primary-main)] shadow-sm">
                    <CalendarDays size={22} />
                  </div>
                  <Dialog.Title className="text-lg font-black text-[var(--text-main)] uppercase italic tracking-tight transition-colors">Past Sale Entry</Dialog.Title>
                </div>
                <button onClick={closeModal} className="p-2 bg-[var(--bg-system)] rounded-full text-[var(--secondary-main)] opacity-40 hover:opacity-100 transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5 pb-6">
                {/* Date Input */}
                <div>
                  <label className="text-[10px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-[0.2em] block mb-2 transition-colors ml-1">Archive Date</label>
                  <input
                    type="date"
                    value={saleDate}
                    max={today}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full p-4 bg-[var(--bg-system)] border-2 border-[var(--border-color)] rounded-2xl font-black text-[var(--text-main)] outline-none focus:border-[var(--primary-main)] text-sm transition-all"
                  />
                  {dateError && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">{dateError}</p>}
                </div>

                {/* Items Section */}
                <div className="bg-[var(--bg-system)]/50 p-4 rounded-3xl border-2 border-[var(--border-color)] transition-all">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-[10px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-[0.2em] ml-1 transition-colors">Line Items</label>
                    <button
                      onClick={addItem}
                      className="flex items-center gap-1.5 text-[9px] font-black text-[var(--primary-main)] uppercase bg-[var(--bg-card)] border border-[var(--primary-main)]/20 px-3 py-1.5 rounded-lg active:scale-95 transition-all shadow-sm"
                    >
                      <Plus size={12} /> Add Rice
                    </button>
                  </div>

                  {items.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-[var(--border-color)] rounded-2xl transition-all">
                      <p className="text-[10px] text-[var(--secondary-main)] opacity-30 font-black uppercase tracking-widest italic">No Items Selected</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                      {items.map((item, idx) => (
                        <div key={idx} className="bg-[var(--bg-card)] p-3 rounded-2xl flex gap-2 items-center border border-[var(--border-color)] shadow-sm animate-in slide-in-from-top-2">
                          <select
                            value={item.product_id}
                            onChange={(e) => updateItem(idx, 'product_id', e.target.value)}
                            className="flex-1 bg-transparent border-none p-1 text-xs font-black text-[var(--text-main)] outline-none uppercase italic"
                          >
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                          <div className="flex items-center bg-[var(--bg-system)] rounded-xl px-2 border border-[var(--border-color)]">
                            <input
                              type="number"
                              min="0.25"
                              step="0.25"
                              value={item.quantity}
                              onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                              className="w-12 bg-transparent p-2 text-xs font-black text-center text-[var(--text-main)] outline-none"
                            />
                            <span className="text-[9px] text-[var(--secondary-main)] opacity-40 font-black uppercase pr-1">{item.unit}</span>
                          </div>
                          <button onClick={() => removeItem(idx)} className="p-2 text-stone-300 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {items.length > 0 && (
                  <div className="flex justify-between items-center px-2 py-1 transition-all">
                    <span className="text-[10px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-widest">Grand Total</span>
                    <span className="text-2xl font-black text-[var(--text-main)] italic">₱{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                {/* CUSTOMER PREDICTION */}
                <div>
                  <label className="text-[10px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-[0.2em] block mb-2 ml-1 transition-colors">Client Details</label>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center px-4 border-2 border-transparent text-[13px] font-black text-[var(--text-main)] opacity-20 pointer-events-none select-none uppercase z-0 tracking-tight">
                      {prediction}
                    </div>
                    
                    <input
                      type="text"
                      value={customerName}
                      onChange={handleCustomerNameChange}
                      onKeyDown={handleKeyDown}
                      placeholder={prediction ? "" : "Walk-in Buyer"}
                      className="w-full p-4 bg-transparent border-2 border-[var(--border-color)] rounded-2xl font-black text-[var(--text-main)] outline-none focus:border-[var(--primary-main)] text-sm uppercase transition-all relative z-10"
                    />
                    
                    {prediction && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase text-[var(--primary-main)] opacity-60 bg-[var(--bg-accent)] px-1.5 py-0.5 rounded-md tracking-tighter z-10 shadow-sm">
                        Tab ⇥
                      </span>
                    )}
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="text-[10px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-[0.2em] block mb-3 ml-1 transition-colors">Mode of Payment</label>
                  <div className="flex gap-2 p-1 bg-[var(--bg-system)] rounded-2xl border border-[var(--border-color)]">
                    {(['Cash', 'Online Payment', 'Utang'] as const).map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                          paymentMethod === m
                            ? m === 'Utang' ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'bg-[var(--secondary-main)] text-white shadow-lg'
                            : 'bg-transparent text-[var(--secondary-main)] opacity-40 hover:opacity-100'
                        }`}
                      >
                        {m === 'Online Payment' ? 'Online' : m}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handlePreSubmitCheck}
                  disabled={isSubmitting || !!dateError || items.length === 0}
                  className="w-full bg-[var(--primary-main)] text-white font-black py-4 rounded-[1.5rem] shadow-xl shadow-[var(--primary-main)]/20 active:scale-95 transition-all uppercase tracking-widest border-b-4 border-black/10 disabled:opacity-30 disabled:scale-100 disabled:shadow-none text-xs"
                >
                  {isSubmitting ? 'Syncing...' : 'Validate & Record Sale'}
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default PastSalesModal;