import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Loader2, Calculator, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateProduct, createProduct } from '../../services/api';

interface OrderItem {
  id: number;
  name: string;
  category: string;
  sack_price: number;
  tubo: number;
  pricePerUnit: number;
  sack_weight: number;
  sacksToOrder: number;
  unit: string;
  sackType?: 'half' | 'full';
  stockQuantity?: number;
  reorderLevel?: number;
}

interface OrderListViewProps {
  isOpen: boolean;
  closeModal: () => void;
  orderItems: any[];
}

const OrderListView = ({ isOpen, closeModal, orderItems }: OrderListViewProps) => {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<OrderItem>>({});
  const [editSackType, setEditSackType] = useState<'half' | 'full'>('full');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      console.log('OrderListView opened. orderItems prop:', orderItems);
      
      // Try to get from localStorage if orderItems is empty
      let itemsToUse = orderItems;
      if (!itemsToUse || itemsToUse.length === 0) {
        const stored = localStorage.getItem('grainflow_order_guide');
        if (stored) {
          try {
            itemsToUse = JSON.parse(stored);
            console.log('Got items from localStorage:', itemsToUse);
          } catch (e) {
            console.error('Failed to parse localStorage:', e);
          }
        }
      }
      
      if (itemsToUse && itemsToUse.length > 0) {
        console.log('Processing items:', itemsToUse);
        // Prefill items with existing product data and set sack type
        const prefilled = itemsToUse.map(item => ({
          id: item.id || 0,
          name: item.name || '',
          category: item.category || 'Local',
          sack_price: item.sack_price || 0,
          tubo: item.tubo || 0,
          pricePerUnit: item.pricePerUnit || 0,
          sack_weight: item.sack_weight || 50,
          sacksToOrder: item.sacksToOrder || 1,
          unit: item.unit || 'kg',
          stockQuantity: item.stockQuantity || 0,
          reorderLevel: item.reorderLevel || 10,
          sackType: (item.sack_weight === 25 ? 'half' : 'full') as 'half' | 'full'
        }));
        console.log('Prefilled items:', prefilled);
        setItems(prefilled);
      } else {
        console.log('No items to display');
        setItems([]);
      }
    }
  }, [orderItems, isOpen]);

  const handleEdit = (item: OrderItem) => {
    setEditingId(item.id);
    setEditData({ ...item });
    setEditSackType(item.sackType || (item.sack_weight === 25 ? 'half' : 'full'));
  };

  const handleSackTypeChange = (type: 'half' | 'full') => {
    setEditSackType(type);
    const newWeight = type === 'full' ? 50 : 25;
    setEditData({ ...editData, sack_weight: newWeight });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editData) return;
    
    setIsSubmitting(true);
    try {
      const updatedItem = { 
        ...items.find(i => i.id === editingId), 
        ...editData,
        sackType: editSackType
      } as OrderItem;
      setItems(items.map(i => i.id === editingId ? updatedItem : i));
      
      // Update localStorage
      const allGuide = JSON.parse(localStorage.getItem('grainflow_order_guide') || '[]');
      const updated = allGuide.map((i: OrderItem) => i.id === editingId ? updatedItem : i);
      localStorage.setItem('grainflow_order_guide', JSON.stringify(updated));
      
      setEditingId(null);
      toast.success('Item updated successfully!');
    } catch (error) {
      toast.error('Failed to update item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Remove this item from the order?')) {
      const updatedItems = items.filter(i => i.id !== id);
      setItems(updatedItems);
      
      // Update localStorage
      const allGuide = JSON.parse(localStorage.getItem('grainflow_order_guide') || '[]');
      const updated = allGuide.filter((i: OrderItem) => i.id !== id);
      localStorage.setItem('grainflow_order_guide', JSON.stringify(updated));
      
      toast.success('Item removed');
    }
  };

  const handleAddToSystem = async () => {
    if (items.length === 0) return;
    
    setIsSubmitting(true);
    try {
      for (const item of items) {
        const sacksToOrder = Math.max(1, item.sacksToOrder || 1);
        const totalKgInStock = sacksToOrder * item.sack_weight;
        const payload = {
          name: item.name,
          category: item.category,
          unit: 'kg',
          reorderLevel: item.reorderLevel || 10,
          sack_price: item.sack_price,
          tubo: item.tubo,
          pricePerUnit: item.pricePerUnit,
          sack_weight: item.sack_weight,
        };

        if (item.id && item.id > 0) {
          const currentStock = Number(item.stockQuantity || 0);
          if (currentStock === 0) {
            await updateProduct(item.id, { ...payload, stockQuantity: totalKgInStock, is_archived: false } as any);
          } else {
            await updateProduct(item.id, { ...payload, stockQuantity: currentStock + totalKgInStock, is_archived: true } as any);
          }
        } else {
          await createProduct({ ...payload, stockQuantity: totalKgInStock, reorderLevel: 10 });
        }
      }
      
      // Clear the order guide from localStorage
      localStorage.removeItem('grainflow_order_guide');
      
      // Clear manually added items from localStorage
      localStorage.removeItem('grainflow_manual_low_stock');
      
      toast.success('All items registered to system successfully!');
      closeModal();
      window.location.reload();
    } catch (error) {
      console.error('Error adding items:', error);
      toast.error('Failed to register items to system');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[160]" onClose={closeModal}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4 transition-colors duration-500">
            <Transition.Child as={Fragment} enter="ease-out duration-350" enterFrom="opacity-0 translate-y-full sm:translate-y-8 scale-95" enterTo="opacity-100 translate-y-0 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 scale-100" leaveTo="opacity-0 translate-y-full sm:translate-y-8 scale-95">
              <Dialog.Panel className="w-full sm:max-w-2xl rounded-t-[2.5rem] sm:rounded-[2.5rem] bg-[var(--bg-card)] p-6 shadow-2xl border border-[var(--border-color)] transition-colors duration-500">
                
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-[var(--bg-accent)] p-2.5 rounded-xl text-[var(--primary-main)] shadow-inner">
                      <Package size={20} />
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-black text-[var(--text-main)] leading-none uppercase italic">Add Rice to System</Dialog.Title>
                      <p className="text-[10px] text-[var(--secondary-main)] opacity-40 font-bold uppercase tracking-widest mt-1">Review and commit your inbound stock</p>
                    </div>
                  </div>
                  <button onClick={closeModal} className="p-2 bg-[var(--bg-system)] rounded-full text-[var(--secondary-main)] opacity-40 hover:opacity-100 transition-all active:scale-90">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 mb-6 custom-scrollbar transition-all">
                  {items.length === 0 ? (
                    <div className="text-center py-12 bg-[var(--bg-system)] rounded-[2rem] border-2 border-dashed border-[var(--border-color)] transition-all">
                      <p className="text-[var(--secondary-main)] opacity-40 font-black uppercase text-xs italic tracking-widest leading-relaxed">No submitted orders from the low stock list.</p>
                    </div>
                  ) : (
                    items.map((item) => (
                      <div key={item.id} className="bg-[var(--bg-card)] border border-[var(--border-color)] p-5 rounded-[2rem] shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2">
                        {editingId === item.id ? (
                          // Edit Mode
                          <div className="space-y-4 transition-all">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[9px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-widest ml-1">Rice Variety</label>
                                <input
                                  type="text"
                                  value={editData.name || ''}
                                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                  className="w-full p-3 bg-[var(--bg-system)] border-2 border-transparent focus:border-[var(--primary-main)] rounded-xl text-sm font-black text-[var(--text-main)] outline-none transition-all uppercase italic"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-widest ml-1">Category</label>
                                <select
                                  value={editData.category || 'Local'}
                                  onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                                  className="w-full p-3 bg-[var(--bg-system)] border-2 border-transparent focus:border-[var(--primary-main)] rounded-xl text-sm font-black text-[var(--text-main)] outline-none transition-all uppercase"
                                >
                                  <option value="Local">Local</option>
                                  <option value="Imported">Imported</option>
                                  <option value="Glutinous">Glutinous</option>
                                </select>
                              </div>
                            </div>

                            <div className="bg-[var(--bg-system)] p-4 rounded-2xl border-2 border-[var(--border-color)] space-y-4 transition-all">
                              <div className="flex justify-between items-center mb-1">
                                <p className="text-[10px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-[0.2em] flex items-center gap-2">
                                  <Calculator size={12} /> Pricing Strategy
                                </p>
                                <div className="flex bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-color)] shadow-inner">
                                  {(['half', 'full'] as const).map((type) => (
                                    <button
                                      key={type}
                                      type="button"
                                      onClick={() => handleSackTypeChange(type)}
                                      className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${editSackType === type ? 'bg-[var(--primary-main)] text-white shadow-md' : 'text-[var(--secondary-main)] opacity-40'}`}
                                    >
                                      {type === 'half' ? '25kg' : '50kg'}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-tighter block ml-1">Sack (₱)</label>
                                  <input
                                    type="number"
                                    step="any"
                                    value={editData.sack_price || ''}
                                    onChange={(e) => setEditData({ ...editData, sack_price: parseFloat(e.target.value) })}
                                    className="w-full p-2 bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-lg text-xs font-black text-[var(--text-main)] outline-none focus:border-[var(--primary-main)] transition-all"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-tighter block ml-1">Tubo (₱/kg)</label>
                                  <input
                                    type="number"
                                    step="any"
                                    value={editData.tubo || ''}
                                    onChange={(e) => setEditData({ ...editData, tubo: parseFloat(e.target.value) })}
                                    className="w-full p-2 bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-lg text-xs font-black text-[var(--text-main)] outline-none focus:border-[var(--primary-main)] transition-all"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-tighter block ml-1">Sacks</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={editData.sacksToOrder || ''}
                                    onChange={(e) => setEditData({ ...editData, sacksToOrder: parseInt(e.target.value) })}
                                    className="w-full p-2 bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-lg text-xs font-black text-[var(--text-main)] outline-none focus:border-[var(--primary-main)] transition-all"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="bg-[var(--bg-accent)]/50 p-3 rounded-xl border border-[var(--primary-main)]/10 flex justify-between items-center transition-all">
                              <p className="text-[10px] font-black text-[var(--primary-main)] uppercase tracking-[0.2em]">Live Pricing Yield</p>
                              <p className="text-lg font-black text-[var(--primary-main)] italic">₱{((editData.sack_price || 0) / (editData.sack_weight || 50) + (editData.tubo || 0)).toFixed(2)} /kg</p>
                            </div>

                            <div className="flex gap-2 transition-all">
                              <button
                                onClick={() => setEditingId(null)}
                                className="flex-1 px-4 py-3 bg-[var(--bg-system)] text-[var(--secondary-main)] opacity-60 font-black text-[10px] rounded-xl uppercase tracking-widest border border-[var(--border-color)] active:scale-95 transition-all"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSaveEdit}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-3 bg-[var(--primary-main)] text-white font-black text-[10px] rounded-xl uppercase tracking-widest shadow-lg shadow-[var(--primary-main)]/20 active:scale-95 transition-all flex items-center justify-center gap-2 border-b-4 border-black/10"
                              >
                                {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                                Save Entry
                              </button>
                            </div>
                          </div>
                        ) : (
                          // View Mode
                          <div className="flex items-center justify-between transition-all">
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-[var(--text-main)] text-base uppercase italic truncate leading-none">{item.name}</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                                <p className="text-[10px] text-[var(--secondary-main)] font-black uppercase opacity-40 tracking-tighter"><span className="opacity-60">Category:</span> {item.category}</p>
                                <p className="text-[10px] text-[var(--secondary-main)] font-black uppercase opacity-40 tracking-tighter"><span className="opacity-60">Sack:</span> ₱{item.sack_price}</p>
                                <p className="text-[10px] text-[var(--secondary-main)] font-black uppercase opacity-40 tracking-tighter"><span className="opacity-60">Tubo:</span> ₱{item.tubo}/kg</p>
                                <p className="text-[10px] text-[var(--secondary-main)] font-black uppercase opacity-40 tracking-tighter"><span className="opacity-60">Batch:</span> {item.sacksToOrder} sacks ({item.sacksToOrder * item.sack_weight}kg)</p>
                              </div>
                              <div className="mt-3 bg-[var(--bg-accent)] border border-[var(--primary-main)]/10 px-3 py-1.5 rounded-lg inline-flex items-center gap-2 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-main)] animate-pulse" />
                                <p className="text-[11px] font-black text-[var(--primary-main)] italic">Sale Point: ₱{item.pricePerUnit}/kg</p>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-3 bg-[var(--bg-system)] text-[var(--secondary-main)] opacity-40 hover:opacity-100 hover:bg-[var(--bg-accent)] hover:text-[var(--primary-main)] rounded-xl transition-all active:scale-90 border border-transparent hover:border-[var(--primary-main)]/20"
                                title="Modify Entry"
                              >
                                <Save size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-3 bg-[var(--bg-system)] text-[var(--secondary-main)] opacity-40 hover:opacity-100 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all active:scale-90 border border-transparent hover:border-red-100"
                                title="Remove Item"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleAddToSystem}
                    disabled={items.length === 0 || isSubmitting}
                    className="w-full bg-[var(--text-main)] text-[var(--bg-card)] font-black py-4.5 rounded-[1.5rem] shadow-2xl active:scale-[0.98] transition-all uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-3 disabled:opacity-30 border-b-4 border-black/20"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="animate-spin" size={18} /> Registering...</>
                    ) : (
                      <><Plus size={18} /> Done</>
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default OrderListView;