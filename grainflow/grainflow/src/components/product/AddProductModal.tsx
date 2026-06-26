import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { X, Box, Calculator, Package, Sparkles, Zap, CheckCircle2 } from 'lucide-react';
import {
  getTrends,
  recommendTubo,
  createProduct,
  updateProduct,
  getArchivedProducts,
  deleteProduct,
} from '../../services/api';

/**
 * PROPS INTERFACE
 * @param isOpen - Controls modal visibility
 * @param closeModal - Function to reset state and hide modal
 * @param onSuccess - Callback to refresh the inventory list after a successful save
 * @param mode - Determines if we are creating a new entry or updating an existing one
 * @param initialData - The existing product object (only populated in 'edit' mode)
 * @param existingVarieties - List of existing rice names for prediction
 */
interface AddProductModalProps {
  isOpen: boolean;
  closeModal: () => void;
  onSuccess?: () => void;
  mode: 'add' | 'edit';
  initialData?: any;
  existingVarieties?: string[]; // Added for prediction
}

const AddProductModal = ({ isOpen, closeModal, onSuccess, mode, initialData, existingVarieties = [] }: AddProductModalProps) => {
  // --- BASIC PRODUCT INFO STATES ---
  const [name, setName] = useState('');
  const [prediction, setPrediction] = useState(''); // Added for ghost prediction
  const [showSuggestions, setShowSuggestions] = useState(false); // Show/hide dropdown
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]); // Filtered list
  const [category, setCategory] = useState('Local');
  const [reorderLevel, setReorderLevel] = useState('10');

  // --- PRICING & STOCK LOGIC STATES ---
  const [sackType, setSackType] = useState<'half' | 'full'>('full'); 
  const [sackWeight, setSackWeight] = useState('50');               
  const [sackPrice, setSackPrice] = useState('');                  
  const [tubo, setTubo] = useState('');                             
  const [tuboError, setTuboError] = useState('');                   
  const [pricePerUnit, setPricePerUnit] = useState('');             
  const [numberOfSacks, setNumberOfSacks] = useState('');           
  const [suggestedTubo, setSuggestedTubo] = useState<string | null>(null);
  // --- PRESCRIPTIVE BOX STATE ---
  const [trendsData, setTrendsData] = useState<any>(null);
  
  // 🚀 NEW STATE: Controls the custom success modal
  const [successMessage, setSuccessMessage] = useState('');

  /**
   * HANDLER: NAME CHANGE WITH PREDICTION AND DROPDOWN
   */
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);

    if (value.length > 0 && mode === 'add') {
      // Filter suggestions that start with or contain the input
      const filtered = existingVarieties.filter(v => 
        v.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      
      // Show ghost prediction for first match
      const match = existingVarieties.find(v => 
        v.toLowerCase().startsWith(value.toLowerCase())
      );
      setPrediction(match || '');
    } else {
      setPrediction('');
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
  };

  /**
   * HANDLER: KEYDOWN FOR PREDICTION FILL
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Tab' || e.key === 'ArrowRight') && prediction) {
      e.preventDefault();
      setName(prediction);
      setPrediction('');
      setShowSuggestions(false);
    }
  };

  /**
   * HANDLER: SELECT FROM DROPDOWN
   */
  const handleSelectSuggestion = (suggestion: string) => {
    setName(suggestion);
    setPrediction('');
    setShowSuggestions(false);
    setFilteredSuggestions([]);
  };

  useEffect(() => {
    setSackWeight(sackType === 'full' ? '50' : '25');
  }, [sackType]);

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setName(initialData.name);
      setCategory(initialData.category);
      setReorderLevel(initialData.reorderLevel.toString());
      setSackPrice(initialData.sack_price ? initialData.sack_price.toString() : '');
      setTubo(initialData.tubo ? initialData.tubo.toString() : '');
      setPricePerUnit(initialData.pricePerUnit.toString());

      const weight = initialData.sack_weight || 50;
      setSackType(weight === 25 ? 'half' : 'full');

      const currentSacks = parseFloat(initialData.stockQuantity) / weight;
      setNumberOfSacks(currentSacks.toString());
    } else {
      setName('');
      setPrediction('');
      setCategory('Local');
      setSackPrice('');
      setTubo('');
      setTuboError('');
      setPricePerUnit('');
      setSackType('full');
      setNumberOfSacks('');
    }
  }, [mode, initialData, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchTrends = async () => {
      try {
        const { ok, data } = await getTrends();
        if (ok) setTrendsData(data);
      } catch { }
    };
    fetchTrends();
  }, [isOpen]);

  useEffect(() => {
    if (sackPrice && tubo && sackWeight) {
      const basePerKg = parseFloat(sackPrice) / parseFloat(sackWeight);
      const computedPrice = basePerKg + parseFloat(tubo);
      setPricePerUnit(computedPrice.toFixed(2));
    } else {
      setPricePerUnit('0.00');
    }
  }, [sackPrice, tubo, sackWeight]);

  useEffect(() => {
    if (sackPrice && sackWeight) {
      const basePerKg = parseFloat(sackPrice) / parseFloat(sackWeight);
      recommendTubo(category, basePerKg)
        .then(({ ok, data }) => ok && setSuggestedTubo(data.recommended_tubo.toString()))
        .catch((error) => console.error('Error fetching tubo recommendation:', error));
    }
  }, [category, sackPrice, sackWeight]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const tuboValue = parseFloat(tubo);
    if (!tubo || isNaN(tuboValue) || tuboValue === 0) {
      setTuboError('Tubo is required');
      return;
    }
    setTuboError('');

    const totalKgInStock = parseFloat(numberOfSacks) * parseFloat(sackWeight);
    const payload = {
      name,
      category,
      unit: 'kg',
      stockQuantity: totalKgInStock,
      reorderLevel: parseInt(reorderLevel),
      sack_price: parseFloat(sackPrice),
      tubo: parseFloat(tubo),
      pricePerUnit: parseFloat(pricePerUnit),
      sack_weight: parseInt(sackWeight),
    };

    try {
      const { ok, data: result } = mode === 'add'
        ? await createProduct(payload)
        : await updateProduct(initialData.id, payload);

      if (ok) {
        if (mode === 'add') {
          try {
            const archivedRes = await getArchivedProducts();
            if (archivedRes.ok) {
              const matchingArchived = archivedRes.data.find((p: any) =>
                p.name.toLowerCase().trim() === name.toLowerCase().trim() &&
                p.id !== result.product.id
              );
              if (matchingArchived) {
                await deleteProduct(matchingArchived.id);
              }
            }
          } catch (error) {
            console.error('Error checking/deleting archived variety:', error);
          }
        }

        if (mode === 'add' && result.product.is_archived) {
          setSuccessMessage(`Success! Since "${name}" is currently active, this new batch has been added to the NEW STOCK sequence.`);
        } else {
          closeModal();
          if (onSuccess) onSuccess();
        }
      } else {
        alert(`Error: ${(result as { message?: string }).message || 'Failed to save product.'}`);
      }
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[150]" onClose={closeModal}>
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center transition-colors duration-500">
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-t-[2.5rem] bg-[var(--bg-card)] p-6 shadow-2xl transition-all border-t border-[var(--border-color)]">

              <div className="flex justify-between items-center mb-6">
                <Dialog.Title className="text-xl font-black text-[var(--text-main)] uppercase italic tracking-tighter transition-colors">
                  {mode === 'add' ? 'Add New Rice' : 'Edit Rice Variety'}
                </Dialog.Title>
                <button 
                  onClick={closeModal} 
                  className="p-2 bg-[var(--bg-system)] rounded-full text-[var(--secondary-main)] opacity-40 hover:opacity-100 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 pb-8 transition-all">

                {trendsData?.lowestStock && (
                  <div className="bg-[var(--primary-main)] p-4 rounded-2xl text-white relative overflow-hidden transition-colors duration-500 shadow-lg shadow-[var(--primary-main)]/20">
                    <Zap className="absolute -right-3 -top-3 text-white/10 w-16 h-16" />
                    <div className="relative z-10 flex items-start gap-3">
                      <Sparkles size={16} className="text-white opacity-60 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5">Stock Insight</p>
                        <p className="text-xs font-bold leading-snug">
                          <span className="text-white underline">{trendsData.lowestStock.name}</span>
                          {' '}is running low —{' '}
                          <span className="text-white">{trendsData.lowestStock.stockQuantity} {trendsData.lowestStock.unit} left</span>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 1. IDENTITY SECTION */}
                <div className="flex gap-3">
                  <div className="relative flex-1 group">
                    <div className="absolute inset-0 flex items-center px-10 border border-transparent text-sm font-black text-[var(--text-main)] opacity-20 pointer-events-none select-none z-0 uppercase tracking-tighter">
                      {prediction}
                    </div>
                    <Box className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--primary-main)] opacity-40 z-10" size={18} />
                    <input
                      type="text"
                      value={name}
                      onChange={handleNameChange}
                      onKeyDown={handleKeyDown}
                      onFocus={() => name.length > 0 && setShowSuggestions(filteredSuggestions.length > 0)}
                      className="w-full pl-10 p-3.5 bg-[var(--bg-system)] border-2 border-[var(--border-color)] rounded-xl font-black text-[var(--text-main)] focus:ring-4 focus:ring-[var(--primary-main)]/10 focus:border-[var(--primary-main)] outline-none transition-all relative z-10 placeholder-[var(--text-main)]/20 uppercase italic"
                      placeholder="Variety Name"
                      required
                    />
                    
                    {/* Dropdown Suggestions */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border-2 border-[var(--primary-main)] rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                        {filteredSuggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectSuggestion(suggestion)}
                            className="w-full text-left px-4 py-3 hover:bg-[var(--primary-main)] hover:text-white transition-all font-black text-sm uppercase italic border-b border-[var(--border-color)] last:border-b-0"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-1/3 p-3 bg-[var(--bg-system)] border-2 border-[var(--border-color)] rounded-xl font-black text-[var(--secondary-main)] opacity-70 outline-none focus:border-[var(--primary-main)] transition-all uppercase text-[10px] tracking-widest"
                  >
                    <option value="Local">Local</option>
                    <option value="Imported">Imported</option>
                    <option value="Glutinous">Glutinous</option>
                  </select>
                </div>

                {/* 2. PRICING STRATEGY SECTION */}
                <div className="bg-[var(--bg-system)] p-5 rounded-[2rem] border-2 border-[var(--border-color)] space-y-5 transition-all">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Calculator size={12} /> Pricing Strategy
                    </p>
                    <div className="flex bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-color)] shadow-inner">
                      {(['half', 'full'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setSackType(type)}
                          className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${
                            sackType === type 
                            ? 'bg-[var(--primary-main)] text-white shadow-md' 
                            : 'text-[var(--secondary-main)] opacity-40 hover:opacity-100'
                          }`}
                        >
                          {type === 'half' ? '25kg' : '50kg'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] text-[var(--secondary-main)] opacity-40 font-black ml-1 mb-1.5 block uppercase tracking-widest">Sack Price</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--primary-main)] font-black opacity-60">₱</span>
                        <input
                          type="number"
                          step="any"
                          value={sackPrice}
                          onChange={(e) => setSackPrice(e.target.value)}
                          className="w-full pl-8 p-3.5 bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl font-black text-[var(--text-main)] outline-none focus:border-[var(--primary-main)] transition-all"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] text-[var(--secondary-main)] opacity-40 font-black ml-1 mb-1.5 block uppercase tracking-widest">Tubo (Per Kg)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--primary-main)] font-black opacity-60">₱</span>
                        <input
                          type="number"
                          step="any"
                          value={tubo}
                          onChange={(e) => { setTubo(e.target.value); setTuboError(''); }}
                          className={`w-full pl-8 p-3.5 bg-[var(--bg-card)] border-2 rounded-2xl font-black text-[var(--text-main)] outline-none transition-all ${tuboError ? 'border-red-500 bg-red-50' : 'border-[var(--border-color)] focus:border-[var(--primary-main)]'}`}
                          placeholder="0.00"
                        />
                      </div>
                      {tuboError && <p className="text-red-500 text-[9px] font-black mt-1.5 ml-1 uppercase">{tuboError}</p>}
                      {suggestedTubo && (
                        <div className="mt-2 flex items-center gap-2">
                          <Sparkles size={12} className="text-orange-500" />
                          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                            Suggested tubo: ₱{suggestedTubo}/kg
                          </span>
                          <button 
                            type="button" 
                            onClick={() => { setTubo(suggestedTubo); setTuboError(''); }}
                            className="text-[9px] font-black text-orange-600 bg-orange-100 px-2 py-0.5 rounded-md hover:bg-orange-200 transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] text-[var(--secondary-main)] opacity-40 font-black ml-1 mb-1.5 block uppercase tracking-widest">Load Count (Sacks)</label>
                      <div className="relative">
                        <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--primary-main)] opacity-30" size={16} />
                        <input
                          type="number"
                          value={numberOfSacks}
                          onChange={(e) => setNumberOfSacks(e.target.value)}
                          className="w-full pl-10 p-3.5 bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl font-black text-[var(--text-main)] outline-none focus:border-[var(--primary-main)] transition-all"
                          placeholder="Qty"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex flex-col justify-end">
                      <div className="bg-[var(--primary-main)] p-3 rounded-2xl border-b-4 border-black/10 shadow-lg transition-colors">
                        <p className="text-[8px] text-white opacity-60 font-black uppercase text-center leading-none mb-1 tracking-widest">Sale Price/Kg</p>
                        <p className="text-xl text-white font-black text-center leading-none italic">₱ {pricePerUnit}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[var(--primary-main)] text-white font-black py-4.5 rounded-[1.5rem] shadow-xl shadow-[var(--primary-main)]/20 mt-4 active:scale-95 transition-all uppercase tracking-[0.2em] border-b-4 border-black/10 text-xs"
                >
                  {mode === 'add' ? 'Validate & Save Batch' : 'Update Global Variety'}
                </button>
              </form>
            </Dialog.Panel>
          </div>
        </div>

        {/* --- CUSTOM SUCCESS MODAL --- */}
        {successMessage && (
            <div 
                className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md transition-opacity"
                onClick={() => {
                    setSuccessMessage('');
                    closeModal(); 
                    if (onSuccess) onSuccess(); 
                }}
            >
                <div 
                    className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full mx-4 text-center border border-[var(--border-color)] transform transition-all animate-in zoom-in-95 duration-300"
                    onClick={(e) => e.stopPropagation()} 
                >
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner transition-colors">
                        <CheckCircle2 size={40} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-2xl font-black text-[var(--text-main)] mb-3 tracking-tighter italic uppercase">Inventory Synced</h3>
                    <p className="text-xs font-bold text-[var(--secondary-main)] opacity-70 mb-8 leading-relaxed px-2">
                        {successMessage}
                    </p>
                    <button 
                        onClick={() => {
                            setSuccessMessage('');
                            closeModal(); 
                            if (onSuccess) onSuccess();
                        }} 
                        className="w-full bg-[var(--text-main)] text-[var(--bg-card)] font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-2xl transition-all shadow-xl active:scale-95 border-b-4 border-black/20"
                    >
                        Acknowledged
                    </button>
                </div>
            </div>
        )}
      </Dialog>
    </Transition>
  );
};

export default AddProductModal;