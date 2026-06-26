import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { X, Trash2, Check, Plus, Package, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProducts, getArchivedProducts, archiveProduct } from '../../services/api';

interface LowStockItem {
  id: number;
  name: string;
  stockQuantity: number;
  reorderLevel: number;
  unit: string;
  sacksToOrder: number;
  pricePerUnit?: number;
  isLowStock?: boolean; 
}

interface LowStockModalProps {
  isOpen: boolean;
  closeModal: () => void;
  products: any[]; 
  onRefresh: () => void;
}

const LowStockModal = ({ isOpen, closeModal, products: initialProducts, onRefresh }: LowStockModalProps) => {
  const [reorderList, setReorderList] = useState<LowStockItem[]>([]);
  const [isOrdering, setIsOrdering] = useState(false);
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [pickerProductId, setPickerProductId] = useState<number | ''>('');
  const [isInternalLoading, setIsInternalLoading] = useState(false);

  // 🚀 CORE LOGIC: Fetch low stock and empty items from API
  const synchronizeReorderList = async () => {
    setIsInternalLoading(true);
    try {
      const [activeRes, archivedRes] = await Promise.all([
        getProducts(),
        getArchivedProducts(),
      ]);

      if (activeRes.ok && archivedRes.ok) {
        const active = activeRes.data;
        const archived = archivedRes.data;
        const allItems = [...active, ...archived];

        // Filter for low stock and empty items
        // Include ONLY: non-archived low stock items + non-archived empty items
        // Archived items should NOT appear in the low stock list (they go to Archive view)
        const lowStock = allItems.filter(p => {
          const archivedValue = p.is_archived;
          const isActuallyArchived = archivedValue === true || String(archivedValue) === '1';
          const stock = Number(p.stockQuantity || 0);
          const threshold = Number(p.reorderLevel || 25);
          
          // Show if:
          // NOT archived AND (low stock OR empty)
          return !isActuallyArchived && (stock <= threshold || stock === 0);
        });

        const formatted = lowStock.map(p => ({
          ...p,
          stockQuantity: Number(p.stockQuantity || 0),
          sacksToOrder: 1,
          isLowStock: true
        }));

        // Get existing manually added items from localStorage (separate key for manual items)
        const manualKey = 'grainflow_manual_low_stock';
        let manuallyAdded = [];
        const savedManual = localStorage.getItem(manualKey);
        if (savedManual) {
          try {
            manuallyAdded = JSON.parse(savedManual);
          } catch (e) {
            console.error('Failed to parse manually added items:', e);
          }
        }

        // Merge API items + manually added items
        const merged = [...formatted, ...manuallyAdded];
        setReorderList(merged);
      }
    } catch (error) {
      console.error("Sync Error:", error);
    } finally {
      setIsInternalLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Always fetch fresh low stock items from API
      synchronizeReorderList();
      setShowAddPicker(false);
    }
  }, [isOpen]);

  const availableToAdd = (initialProducts || []).filter(p => {
    const archivedValue = p.is_archived;
    const isArchived = archivedValue === true || archivedValue === 1 || String(archivedValue) === '1';
    return !isArchived && !reorderList.find(r => r.id === p.id);
  });

  const handleAddToList = () => {
    if (!pickerProductId) return;
    const found = initialProducts.find(p => p.id === Number(pickerProductId));
    if (found) {
        const newItem = { 
            ...found, 
            stockQuantity: Number(found.stockQuantity || 0), 
            sacksToOrder: 1, 
            isLowStock: false 
        };
        const updatedList = [...reorderList, newItem];
        setReorderList(updatedList);
        
        // Save manually added items to separate localStorage key
        const manualKey = 'grainflow_manual_low_stock';
        const existingManual = localStorage.getItem(manualKey);
        const manualItems = existingManual ? JSON.parse(existingManual) : [];
        manualItems.push(newItem);
        localStorage.setItem(manualKey, JSON.stringify(manualItems));
        
        setPickerProductId('');
        setShowAddPicker(false);
    }
  };

  const handleSacksChange = (id: number, val: string) => {
    const num = parseFloat(val) || 0;
    const updatedList = reorderList.map(p => p.id === id ? { ...p, sacksToOrder: num } : p);
    setReorderList(updatedList);
    
    // Update manually added items in localStorage if this is a manual item
    const manualKey = 'grainflow_manual_low_stock';
    const existingManual = localStorage.getItem(manualKey);
    if (existingManual) {
      try {
        const manualItems = JSON.parse(existingManual);
        const updatedManual = manualItems.map((item: any) => 
          item.id === id ? { ...item, sacksToOrder: num } : item
        );
        localStorage.setItem(manualKey, JSON.stringify(updatedManual));
      } catch (e) {
        console.error('Failed to update manual items:', e);
      }
    }
  };

  // 🚀 UPDATED LOGIC: Handle deletion based on stock status
  const handleRemove = async (item: LowStockItem) => {
    const stock = Number(item.stockQuantity || 0);
    const threshold = Number(item.reorderLevel || 25);
    
    let confirmMessage = '';
    let action = '';
    
    if (stock === 0) {
      // Case 1: Empty stock - archive (decided not to reorder)
      confirmMessage = `Archive "${item.name}"? This empty stock will be moved to the Archive tab.`;
      action = 'archive';
    } else if (stock <= threshold) {
      // Case 2: Low stock - will reappear when it becomes empty
      confirmMessage = `Remove "${item.name}" from reorder list? It will reappear once stock becomes empty.`;
      action = 'remove';
    } else {
      // Case 3: Not empty nor low stock - just remove from list
      confirmMessage = `Remove "${item.name}" from reorder list?`;
      action = 'remove';
    }
    
    if (!window.confirm(confirmMessage)) return;

    try {
      if (action === 'archive') {
        const { ok } = await archiveProduct(item.id);

        if (ok) {
            const updatedList = reorderList.filter(p => p.id !== item.id);
            setReorderList(updatedList);
            
            // Remove from manually added items if applicable
            const manualKey = 'grainflow_manual_low_stock';
            const existingManual = localStorage.getItem(manualKey);
            if (existingManual) {
              try {
                const manualItems = JSON.parse(existingManual);
                const filtered = manualItems.filter((m: any) => m.id !== item.id);
                if (filtered.length > 0) {
                  localStorage.setItem(manualKey, JSON.stringify(filtered));
                } else {
                  localStorage.removeItem(manualKey);
                }
              } catch (e) {
                console.error('Failed to update manual items:', e);
              }
            }
            
            toast.success(`${item.name} archived successfully!`);
            // Refresh both the modal's low stock list and the inventory page
            await synchronizeReorderList();
            onRefresh();
        } else {
            toast.error("Failed to archive item.");
        }
      } else {
        // Just remove from reorder list (will reappear if it becomes low stock again)
        const updatedList = reorderList.filter(p => p.id !== item.id);
        setReorderList(updatedList);
        
        // Remove from manually added items if applicable
        const manualKey = 'grainflow_manual_low_stock';
        const existingManual = localStorage.getItem(manualKey);
        if (existingManual) {
          try {
            const manualItems = JSON.parse(existingManual);
            const filtered = manualItems.filter((m: any) => m.id !== item.id);
            if (filtered.length > 0) {
              localStorage.setItem(manualKey, JSON.stringify(filtered));
            } else {
              localStorage.removeItem(manualKey);
            }
          } catch (e) {
            console.error('Failed to update manual items:', e);
          }
        }
        
        toast.success(`${item.name} removed from reorder list!`);
      }
    } catch (error) {
        console.error("Remove Error:", error);
        toast.error("Connection error.");
    }
  };

  const handleConfirmOrder = async () => {
    if (reorderList.length === 0) return;
    const isConfirmed = window.confirm("Mark these items as ordered?");
    if (!isConfirmed) return;

    setIsOrdering(true);
    try {
      // Separate items by stock status
      const emptyItems = reorderList.filter(item => Number(item.stockQuantity || 0) === 0);
      const nonEmptyItems = reorderList.filter(item => Number(item.stockQuantity || 0) > 0);
      
      console.log('handleConfirmOrder - emptyItems:', emptyItems);
      console.log('handleConfirmOrder - nonEmptyItems:', nonEmptyItems);
      
      // Archive empty stock items via API using the dedicated archive endpoint
      for (const item of emptyItems) {
        try {
          await archiveProduct(item.id);
        } catch (error) {
          console.error(`Failed to archive ${item.name}:`, error);
        }
      }
      
      // Save ALL items (both empty and non-empty) to order guide key
      const allMarkedItems = [...emptyItems, ...nonEmptyItems];
      if (allMarkedItems.length > 0) {
        console.log('Saving to localStorage:', allMarkedItems);
        localStorage.setItem('grainflow_order_guide', JSON.stringify(allMarkedItems));
      } else {
        localStorage.removeItem('grainflow_order_guide');
      }
      
      // Clear manually added items from localStorage
      localStorage.removeItem('grainflow_manual_low_stock');
      
      // Clear the reorder list IMMEDIATELY - this makes the list empty right away
      setReorderList([]);
      
      if (emptyItems.length > 0 && nonEmptyItems.length > 0) {
        toast.success(`${emptyItems.length} empty items archived. ${nonEmptyItems.length} items ready for registration!`);
      } else if (emptyItems.length > 0) {
        toast.success(`${emptyItems.length} empty items archived! ${allMarkedItems.length} items ready for registration!`);
      } else {
        toast.success('Items marked as ordered! Click the Package icon to register them.');
      }
      
      // Close modal after a brief delay to show the empty state
      await new Promise(resolve => setTimeout(resolve, 800));
      closeModal();
      onRefresh();
    } catch (e) {
      console.error("Order error:", e);
      toast.error("Failed to mark items as ordered");
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[150]" onClose={closeModal}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4 transition-colors duration-500">
            <Transition.Child as={Fragment} enter="ease-out duration-350" enterFrom="opacity-0 translate-y-full sm:translate-y-8 scale-95" enterTo="opacity-100 translate-y-0 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 scale-100" leaveTo="opacity-0 translate-y-full sm:translate-y-8 scale-95">
              <Dialog.Panel className="w-full sm:max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] bg-[var(--bg-card)] p-6 shadow-2xl border border-[var(--border-color)]">
                
                <div className="flex justify-between items-center mb-6 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl transition-colors duration-500 bg-[var(--bg-accent)] text-[var(--primary-main)] shadow-inner`}>
                      <Package size={20} />
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-black text-[var(--text-main)] leading-none italic transition-colors uppercase">
                        Low Stock List
                      </Dialog.Title>
                      <p className="text-[10px] text-[var(--secondary-main)] opacity-40 font-black uppercase tracking-widest mt-1">
                        Items at or below reorder level
                      </p>
                    </div>
                  </div>
                  <button onClick={closeModal} className="p-2 bg-[var(--bg-system)] rounded-full text-[var(--secondary-main)] opacity-40 hover:opacity-100 transition-all active:scale-90">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar transition-all">
                  {isInternalLoading ? (
                    <div className="py-20 text-center">
                        <Loader2 className="animate-spin mx-auto text-[var(--primary-main)] mb-3" size={32} />
                        <p className="text-[10px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-widest italic">Scanning Inventory...</p>
                    </div>
                  ) : reorderList.length === 0 ? (
                    <div className="text-center py-12 bg-[var(--bg-system)] rounded-[2rem] border-2 border-dashed border-[var(--border-color)]">
                      <Package className="mx-auto text-[var(--secondary-main)] opacity-20 mb-3" size={48} />
                      <p className="text-[var(--secondary-main)] opacity-40 font-black uppercase text-[10px] tracking-widest italic">Inventory Healthy</p>
                    </div>
                  ) : (
                    reorderList.map((item) => (
                      <div key={item.id} className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-2xl flex items-center justify-between gap-4 group animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${item.stockQuantity <= 10 ? 'bg-red-50 border-red-100' : 'bg-[var(--bg-system)] border-[var(--border-color)]'}`}>
                            {item.stockQuantity <= 10 ? '⚠️' : '🌾'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-[var(--text-main)] text-sm truncate transition-colors uppercase italic">{item.name}</p>
                            <p className={`text-[10px] font-black uppercase tracking-tighter transition-colors ${item.stockQuantity <= 10 ? 'text-red-500' : 'text-[var(--secondary-main)] opacity-40'}`}>
                                Stock: {item.stockQuantity} {item.unit}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              value={item.sacksToOrder}
                              onChange={(e) => handleSacksChange(item.id, e.target.value)}
                              className="w-16 text-xs font-black text-center bg-[var(--bg-system)] border-2 border-[var(--border-color)] rounded-xl py-2 outline-none focus:border-[var(--primary-main)] text-[var(--text-main)]"
                            />
                            <p className="absolute -top-2 -right-1 bg-[var(--primary-main)] text-white text-[7px] px-1 rounded font-black uppercase shadow-sm">Sacks</p>
                          </div>
                          <button onClick={() => handleRemove(item)} className="p-2 text-stone-300 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-6">
                  {showAddPicker ? (
                    <div className="flex gap-2 items-center bg-[var(--bg-system)] p-3 rounded-2xl border-2 border-[var(--primary-main)]/20 animate-in fade-in slide-in-from-top-2 duration-300">
                      <select 
                        value={pickerProductId} 
                        onChange={(e) => setPickerProductId(e.target.value as any)} 
                        className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2.5 text-xs font-black text-[var(--text-main)] outline-none uppercase italic"
                      >
                        <option value="">Select Variety...</option>
                        {availableToAdd.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <button onClick={handleAddToList} disabled={!pickerProductId} className="px-4 py-2.5 bg-[var(--primary-main)] text-white text-[10px] font-black rounded-xl disabled:opacity-30 uppercase transition-all shadow-md active:scale-95">Add</button>
                      <button onClick={() => setShowAddPicker(false)} className="p-2 text-[var(--secondary-main)] opacity-40 hover:opacity-100"><X size={16} /></button>
                    </div>
                  ) : (
                    <button onClick={() => setShowAddPicker(true)} disabled={availableToAdd.length === 0} className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-[var(--border-color)] rounded-[1.5rem] text-[var(--secondary-main)] opacity-40 font-black text-xs uppercase tracking-[0.2em] hover:border-[var(--primary-main)] hover:text-[var(--primary-main)] hover:opacity-100 transition-all active:scale-[0.98]">
                      <Plus size={16} /> Manually add variety
                    </button>
                  )}
                </div>

                <button
                  onClick={handleConfirmOrder}
                  disabled={reorderList.length === 0 || isOrdering || isInternalLoading}
                  className={`w-full mt-6 py-4.5 rounded-[1.5rem] shadow-xl active:scale-95 transition-all uppercase tracking-[0.2em] text-xs font-black flex items-center justify-center gap-3 border-b-4 border-black/10 disabled:opacity-30 bg-[var(--primary-main)] text-white shadow-[var(--primary-main)]/20`}
                >
                  {isOrdering ? (
                    <><Loader2 className="animate-spin" size={18} /> Processing...</>
                  ) : (
                    <><Check size={18} /> Save & Mark as Ordered</>
                  )}
                </button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default LowStockModal;