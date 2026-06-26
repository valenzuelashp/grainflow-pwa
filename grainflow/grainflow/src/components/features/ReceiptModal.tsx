/**
 * ReceiptModal.tsx
 * This component displays a digital official receipt after a successful POS transaction.
 * * Key Features:
 * 1. Image Export: Uses 'html-to-image' to convert the receipt div into a PNG for the customer.
 * 2. Dynamic Data: Renders transaction details including ID, items, total, and payment method.
 * 3. High Fidelity: Configured with a higher pixel ratio and cache busting for clear image saves.
 * 4. Responsive Design: Uses a centered backdrop blur and a rounded mobile-first layout.
 */

import { CheckCircle2, Download, X } from 'lucide-react';
import { useRef } from 'react';
import * as htmlToImage from 'html-to-image';

interface ReceiptItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
}

interface ReceiptModalProps {
    isOpen: boolean;       // Controls modal visibility
    onClose: () => void;  // Function to hide the modal and reset POS state
    data: {               // The transaction data object passed from the POS
        customerName?: string;
        items: ReceiptItem[];
        total: number;
        date: string;
        receiptId: string;
        paymentMethod: 'Cash' | 'GCash' | 'Online Payment' | 'Utang';
    } | null;
}

const ReceiptModal = ({ isOpen, onClose, data }: ReceiptModalProps) => {
    // Ref used to target the specific area for image conversion
    const receiptRef = useRef<HTMLDivElement>(null);

    /**
     * handleSaveImage
     * Converts the DOM element stored in receiptRef into a PNG data URL.
     * Automatically triggers a browser download.
     */
    const handleSaveImage = async () => {
        if (!receiptRef.current) return;

        try {
            // Get the actual computed color of the card background for the export
            const cardBg = getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || '#ffffff';

            const dataUrl = await htmlToImage.toPng(receiptRef.current, {
                cacheBust: true,
                backgroundColor: cardBg, // Dynamically matches the exported image background to your theme
                pixelRatio: 2, // Doubles the resolution for higher print/display quality
            });

            // Standard hidden link download injection
            const link = document.createElement('a');
            link.download = `GrainFlow-Receipt-${data?.receiptId}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to save image', err);
        }
    };

    // Prevent rendering if modal is closed or data is missing
    if (!isOpen || !data) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm transition-all">
            <div className="bg-[var(--bg-card)] w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl relative border border-[var(--border-color)] transition-colors duration-500">

                {/* MODAL CLOSE BUTTON: Top-right overlay */}
                <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 bg-black/10 rounded-full text-white active:scale-90 transition-all">
                    <X size={20} />
                </button>

                {/* EXPORTABLE CONTENT: The area captured by html-to-image */}
                <div ref={receiptRef} className="bg-[var(--bg-card)] transition-colors duration-500">
                    {/* Brand Header: Themed with Primary Palette */}
                    <div className="bg-[var(--primary-main)] p-8 text-center text-white transition-colors duration-500">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                            <CheckCircle2 size={32} />
                        </div>
                        <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none">GrainFlow</h3>
                        <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
                            Official Receipt
                        </p>
                    </div>

                    <div className="p-8 space-y-6">
                        {/* Transaction Metadata */}
                        <div className="flex justify-between items-start border-b border-dashed border-[var(--border-color)] pb-4 transition-colors">
                            <div>
                                <p className="text-[9px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-widest leading-none mb-1">ID No.</p>
                                <p className="text-sm font-black text-[var(--text-main)] transition-colors">{data.receiptId}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-widest leading-none mb-1">Issued On</p>
                                <p className="text-sm font-black text-[var(--text-main)] transition-colors">{data.date.split(',')[0]}</p>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div>
                            <p className="text-[9px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-widest leading-none mb-1">Customer</p>
                            <h4 className="text-sm font-black text-[var(--text-main)] uppercase italic transition-colors">
                                {data.customerName || 'Walk-in Customer'}
                            </h4>
                        </div>

                        {/* Line Items: List of rice varieties bought */}
                        <div className="space-y-3">
                            {data.items.map((item: ReceiptItem, idx: number) => (
                                <div key={idx} className="flex justify-between text-sm items-center">
                                    <span className="text-[var(--secondary-main)] opacity-80 font-bold uppercase text-xs tracking-tight">
                                        {item.name} <span className="text-[10px] opacity-40 ml-1 font-black">x{item.quantity}kg</span>
                                    </span>
                                    <span className="font-black text-[var(--text-main)] italic transition-colors">
                                        ₱{(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Summary: Total and Payment Method */}
                        <div className="bg-[var(--bg-system)] p-5 rounded-2xl flex justify-between items-center border border-[var(--border-color)] transition-colors">
                            <div>
                                <p className="text-[9px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-widest leading-none mb-1">Total via {data.paymentMethod}</p>
                                <p className="text-2xl font-black text-[var(--primary-main)] italic transition-colors">₱{data.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>

                        {/* Branding/Location Footer */}
                        <div className="text-center pt-2">
                            <p className="text-[10px] text-[var(--secondary-main)] opacity-40 font-bold italic transition-colors">
                                Thank you for shopping at GrainFlow!
                            </p>
                            <p className="text-[8px] text-[var(--secondary-main)] opacity-20 font-black uppercase tracking-[0.1em] mt-1 transition-colors">Bacoor City, Cavite</p>
                        </div>
                    </div>
                </div>

                {/* MODAL ACTIONS: Non-exported buttons - Fully themed */}
                <div className="p-6 pt-0 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-[var(--bg-system)] text-[var(--secondary-main)] opacity-60 font-black py-4 rounded-2xl active:scale-95 transition-all text-[10px] uppercase tracking-widest border border-[var(--border-color)] hover:opacity-100"
                    >
                        Done
                    </button>
                    <button
                        onClick={handleSaveImage}
                        className="flex-[2] bg-[var(--primary-main)] text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-[var(--primary-main)]/20 active:scale-95 transition-all text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border-b-4 border-black/10"
                    >
                        Save Receipt <Download size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptModal;