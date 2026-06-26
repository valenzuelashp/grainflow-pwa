/**
 * InventoryDrawer.tsx
 * This is the slide-up drawer used in the Inventory page for adding or editing rice varieties.
 * * Key Features:
 * 1. Mode Switching: Handles both 'add' (fresh form) and 'edit' (pre-filled with initialData).
 * 2. Form State: Manages name, price, stock, and rice type via a localized state.
 * 3. Smooth Transitions: Uses Headless UI Transitions for a slide-up effect from the bottom of the screen.
 * 4. Automatic Reset: Synchronizes form data whenever the 'initialData' or 'isOpen' state changes.
 */

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Package, Save, Trash2, Hash } from 'lucide-react';

interface InventoryDrawerProps {
    isOpen: boolean;           // Controls the visibility of the drawer
    onClose: () => void;      // Function to trigger drawer closing
    mode: 'add' | 'edit';      // Determines the title and available actions
    initialData?: any;        // The existing variety data passed when in 'edit' mode
}

const InventoryDrawer = ({ isOpen, onClose, mode, initialData }: InventoryDrawerProps) => {
    // Local form state representing the rice variety attributes
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        stock: '',
        type: 'Local'
    });

    /**
     * Effect: Form Synchronization
     * Pre-fills the form if editing, or clears it if adding a new variety.
     * Triggers whenever the drawer opens or the selected item changes.
     */
    useEffect(() => {
        if (mode === 'edit' && initialData) {
            setFormData(initialData);
        } else {
            setFormData({ name: '', price: '', stock: '', type: 'Local' });
        }
    }, [mode, initialData, isOpen]);

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[100]" onClose={onClose}>

                {/* BACKDROP: Dimmed background with a blur effect */}
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

                {/* DRAWER CONTAINER: Positions the panel at the bottom of the viewport */}
                <div className="fixed inset-0 flex items-end justify-center">
                    <Transition.Child
                        as={Fragment}
                        enter="transform transition ease-in-out duration-300"
                        enterFrom="translate-y-full"
                        enterTo="translate-y-0"
                        leave="transform transition ease-in-out duration-300"
                        leaveFrom="translate-y-0"
                        leaveTo="translate-y-full"
                    >
                        <Dialog.Panel className="w-full max-w-md bg-[var(--bg-card)] rounded-t-[3rem] shadow-2xl overflow-hidden border-t border-[var(--border-color)] transition-colors duration-500">

                            {/* HEADER: Title and close action */}
                            <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center transition-colors duration-500">
                                <div>
                                    <h2 className="text-xl font-black text-[var(--text-main)] italic">
                                        {mode === 'add' ? 'Add New Variety' : 'Edit Variety'}
                                    </h2>
                                    <p className="text-[10px] text-[var(--primary-main)] font-black uppercase tracking-widest transition-colors">
                                        Rice Inventory
                                    </p>
                                </div>
                                <button 
                                    onClick={onClose} 
                                    className="p-2 bg-[var(--bg-system)] rounded-xl text-[var(--secondary-main)] opacity-60 hover:opacity-100 transition-all active:scale-90"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-5 pb-12 transition-all">

                                {/* INPUT: Variety Name */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-widest ml-1 transition-colors">Rice Name</label>
                                    <div className="relative">
                                        <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--secondary-main)] opacity-30" size={18} />
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. Sinandomeng"
                                            className="w-full bg-[var(--bg-system)] border-2 border-transparent focus:bg-[var(--bg-card)] focus:border-[var(--primary-main)] rounded-2xl py-4 pl-12 pr-4 font-black text-[var(--text-main)] transition-all outline-none placeholder-[var(--text-main)]/20"
                                        />
                                    </div>
                                </div>

                                {/* INPUTS: Price and Stock Quantities */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Price Input */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-widest ml-1 transition-colors">Price per kg</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--primary-main)] font-black opacity-60">₱</span>
                                            <input
                                                type="number"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                className="w-full bg-[var(--bg-system)] border-2 border-transparent focus:bg-[var(--bg-card)] focus:border-[var(--primary-main)] rounded-2xl py-4 pl-10 pr-4 font-black text-[var(--text-main)] transition-all outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Stock Input */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-widest ml-1 transition-colors">Current Stock</label>
                                        <div className="relative">
                                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--secondary-main)] opacity-30" size={18} />
                                            <input
                                                type="number"
                                                value={formData.stock}
                                                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                                className="w-full bg-[var(--bg-system)] border-2 border-transparent focus:bg-[var(--bg-card)] focus:border-[var(--primary-main)] rounded-2xl py-4 pl-12 pr-4 font-black text-[var(--text-main)] transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ACTIONS: Delete (Edit mode only) and Save */}
                                <div className="pt-4 flex gap-3">
                                    {mode === 'edit' && (
                                        <button className="p-4 bg-red-50 text-red-600 rounded-2xl active:scale-95 transition-all border border-red-100 hover:bg-red-100">
                                            <Trash2 size={24} />
                                        </button>
                                    )}
                                    <button
                                        className="flex-1 bg-[var(--primary-main)] text-white font-black py-4 rounded-2xl shadow-lg shadow-[var(--primary-main)]/20 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs border-b-4 border-black/10"
                                    >
                                        <Save size={18} />
                                        {mode === 'add' ? 'Create Variety' : 'Update Stock'}
                                    </button>
                                </div>
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    );
};

export default InventoryDrawer;