import { AlertTriangle, Pencil } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import toast from 'react-hot-toast';
import { archiveProduct, unarchiveProduct } from '../../services/api';

interface ProductCardProps {
    product: any; 
    onEdit: (product: any) => void; 
    onDeleteSuccess: () => void;  
    allProducts: any[];
    isNew?: boolean;
}

const ProductCard = ({ product, onEdit, onDeleteSuccess, allProducts, isNew }: ProductCardProps) => {
    const [showConfirm, setShowConfirm] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);

    const isOutOfStock = product.stockQuantity <= 0;
    const isLowStock = product.stockQuantity <= product.reorderLevel || product.stockQuantity <= 25;

    const dateAdded = product.created_at 
        ? new Date(product.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'N/A';

    const performArchive = async () => {
        setIsArchiving(true);
        try {
            const { ok } = await archiveProduct(product.id);
            
            if (ok) {
                const newerBatch = allProducts.find(p => 
                    p.name.toLowerCase().trim() === product.name.toLowerCase().trim() &&
                    (p.is_archived === true || p.is_archived === 1 || String(p.is_archived) === '1') &&
                    new Date(p.created_at).getTime() > new Date(product.created_at).getTime()
                );
                
                if (newerBatch) {
                    const unarchiveRes = await unarchiveProduct(newerBatch.id);
                    
                    if (unarchiveRes.ok) {
                        toast.success(`${product.name} archived. Newer batch promoted to active!`);
                    } else {
                        toast.success(`${product.name} archived successfully!`);
                    }
                } else {
                    toast.success(`${product.name} archived successfully!`);
                }
                
                setShowConfirm(false); 
                onDeleteSuccess();     
            } else {
                toast.error("Failed to archive product.");
            }
        } catch (error) { 
            console.error('Archive error:', error); 
            toast.error("Connection error while archiving.");
        } finally {
            setIsArchiving(false);
        }
    };

    const handleRestore = async () => {
        // Restore logic only for empty items (0 stock)
        if (product.stockQuantity > 0) {
            toast.error(`Cannot restore: "${product.name}" has stock. It will auto-promote when oldest batch empties.`);
            return;
        }

        try {
            // For empty items: just show success message
            // The item stays archived but will appear in Low Stock List
            // because Low Stock List fetches both archived and non-archived items with 0 stock
            toast.success(`${product.name} restored to low stock list!`);
            onDeleteSuccess();
        } catch (error) { 
            console.error('Restore error:', error); 
            toast.error("Connection error while restoring.");
        }
    };

    return (
        <>
            <div className="relative group h-full">
                {isNew && (
                    <div className="absolute top-2 left-2 z-10">
                        <span className="inline-block bg-blue-600 text-white text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-md">NEW</span>
                    </div>
                )}
                {!product.is_archived && (
                    <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all z-20 scale-90 translate-y-1 group-hover:translate-y-0">
                        <button onClick={() => onEdit(product)} className="p-2.5 bg-[var(--bg-card)]/90 backdrop-blur-md border border-[var(--border-color)] rounded-xl text-[var(--secondary-main)] opacity-60 hover:opacity-100 hover:text-[var(--primary-main)] shadow-sm transition-all active:scale-90">
                            <Pencil size={14} />
                        </button>
                    </div>
                )}

                <div className={`h-full flex flex-col py-2 px-3 sm:py-5 sm:px-5 rounded-[1rem] sm:rounded-[2rem] border transition-all duration-500 backdrop-blur-sm shadow-md ${isOutOfStock ? 'bg-[var(--bg-system)] opacity-60 border-[var(--border-color)]' : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--primary-main)]/30 hover:shadow-xl hover:scale-[1.02]'}`}>
                    
                    <div className="mb-2 text-center px-2">
                        <h3 className="font-black text-[var(--text-main)] text-[13px] sm:text-base uppercase leading-tight line-clamp-2 italic tracking-tight">{product.name}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 gap-x-1 sm:gap-x-3 text-center items-start mb-2">
                        <div className="flex flex-col items-center">
                            <p className="text-[7px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-[0.2em] mb-1 sm:mb-1.5 transition-colors">Class</p>
                            <div className="bg-[var(--bg-accent)]/50 px-2 py-1 sm:py-1.5 rounded-xl border border-[var(--primary-main)]/10 w-full transition-colors">
                                <p className="text-[8px] sm:text-[9px] font-black text-[var(--primary-main)] uppercase truncate">{product.category}</p>
                            </div>
                        </div>

                        <div className="flex flex-col items-center">
                            <p className="text-[7px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-[0.2em] mb-1 sm:mb-1.5 transition-colors">Stock</p>
                            <div className={`${isOutOfStock ? 'bg-red-50 border-red-100' : isLowStock ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'} px-2 py-1 sm:py-1.5 rounded-xl border w-full flex items-center justify-center gap-1 transition-colors`}>
                                <p className={`text-[8px] sm:text-[9px] font-black uppercase ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-emerald-700'}`}>
                                    {isOutOfStock ? 'EMPTY' : `${product.stockQuantity}${product.unit}`}
                                </p>
                                {isLowStock ? <AlertTriangle size={10} className={isOutOfStock ? 'text-red-500' : 'text-amber-500'} /> : null}
                            </div>
                        </div>

                        <div className="flex flex-col items-center">
                            <p className="text-[7px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-[0.2em] mb-1 sm:mb-1.5 transition-colors">Price</p>
                            <div className="bg-[var(--text-main)] px-2 py-1 sm:py-1.5 rounded-xl w-full shadow-inner transition-colors">
                                <p className="text-[8px] sm:text-[11px] font-black text-[var(--bg-card)] italic">₱{product.pricePerUnit}</p>
                            </div>
                        </div>

                        <div className="flex flex-col items-center">
                            <p className="text-[7px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-[0.2em] mb-1 sm:mb-1.5 transition-colors">Date</p>
                            <div className="bg-[var(--bg-system)] px-2 py-1 sm:py-1.5 rounded-xl border border-[var(--border-color)] w-full transition-colors">
                                <p className="text-[8px] font-black text-[var(--secondary-main)] opacity-60 uppercase tracking-tighter truncate">{dateAdded}</p>
                            </div>
                        </div>
                    </div>

                    {product.is_archived ? (
                        <button 
                            onClick={handleRestore}
                            className="mt-auto w-full bg-[var(--primary-main)] text-white font-black py-3.5 rounded-2xl text-[9px] uppercase tracking-[0.2em] active:scale-95 transition-all shadow-lg shadow-[var(--primary-main)]/20 border-b-4 border-black/10"
                        >
                            Restore to Flow
                        </button>
                    ) : null}
                </div>
            </div>

            <Transition show={showConfirm} as={Fragment}>
                <Dialog as="div" className="relative z-[150]" onClose={() => setShowConfirm(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-150"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="bg-[var(--bg-card)] rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl border border-[var(--border-color)] transition-colors duration-500">
                                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                                    <AlertTriangle size={32} />
                                </div>
                                <h3 className="text-xl font-black text-[var(--text-main)] mb-3 italic uppercase tracking-tight">
                                    Archive Batch?
                                </h3>
                                <p className="text-xs font-bold text-[var(--secondary-main)] opacity-60 mb-8 leading-relaxed px-2">
                                    Moving <span className="text-[var(--text-main)] underline">{product.name}</span> to the archive will remove it from active POS sequences.
                                </p>
                                
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowConfirm(false)}
                                        disabled={isArchiving}
                                        className="flex-1 py-3.5 text-[10px] font-black text-[var(--secondary-main)] bg-[var(--bg-system)] border border-[var(--border-color)] rounded-xl hover:bg-[var(--bg-accent)] transition-all uppercase tracking-widest"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={performArchive}
                                        disabled={isArchiving}
                                        className="flex-1 py-3.5 text-[10px] font-black text-white bg-red-600 shadow-xl shadow-red-200 rounded-xl transition-all uppercase tracking-widest border-b-4 border-black/10 active:translate-y-1"
                                    >
                                        {isArchiving ? 'Archiving...' : 'Yes, Archive'}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition>
        </>
    );
};

export default ProductCard;