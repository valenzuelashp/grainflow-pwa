import { useState, useEffect } from 'react';
import { 
      Plus, Minus, Trash2, CalendarDays, 
      TrendingUp, ChevronDown, Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import ReceiptModal from '../components/features/ReceiptModal';
import PastSalesModal from '../components/features/PastSalesModal';
import { useLayout } from '../App';
import { getProducts, getCustomers, createTransaction } from '../services/api';

interface CartItem {
    id: number;
    name: string;
    price: number;
    originalPrice: number;
    quantity: number;
    unit: string;
    discountApplied: boolean;
}

const POS = () => {
    // Calling the Layout Context "Pro" way
    const { isMobile, isCollapsed } = useLayout();

    const [cart, setCart] = useState<CartItem[]>([]);
    const [riceVarieties, setRiceVarieties] = useState<any[]>([]);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [isPastSalesOpen, setIsPastSalesOpen] = useState(false);
    const [transactionData, setTransactionData] = useState<any>(null);
    const [customerName, setCustomerName] = useState('');
    
    const [sortBy, setSortBy] = useState<'none' | 'price' | 'alphabetical'>('none');
    const [allCustomers, setAllCustomers] = useState<string[]>([]);
    const [prediction, setPrediction] = useState('');

    // --- SCROLL DETECTION FOR BOTTOM NAV SYNC ---
    const [isNavVisible, setIsNavVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 50) {
                setIsNavVisible(false); // Scrolling down
            } else {
                setIsNavVisible(true); // Scrolling up
            }
            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const fetchProducts = async () => {
        try {
            const { ok, data } = await getProducts();
            if (ok) {
                const formattedData = data.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    price: item.pricePerUnit,
                    stock: item.stockQuantity,
                    unit: item.unit,
                }));
                setRiceVarieties(formattedData);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    const fetchCustomers = async () => {
        try {
            const { ok, data } = await getCustomers();
            if (ok) {
                setAllCustomers(data);
            }
        } catch (error) {
            console.error("Error fetching customers:", error);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCustomers();
    }, []);

    const sortedRiceVarieties = [...riceVarieties].sort((a, b) => {
        if (sortBy === 'price') return a.price - b.price;
        if (sortBy === 'alphabetical') return a.name.localeCompare(b.name);
        return 0;
    });

    const uniqueRiceVarieties = Array.from(
        new Map(sortedRiceVarieties.map(rice => [rice.name.toLowerCase(), rice])).values()
    );

    const handleCustomerNameChange = (value: string) => {
        setCustomerName(value);
        if (value.trim() === '') {
            setPrediction('');
            return;
        }
        const match = allCustomers.find(name => 
            name.toLowerCase().startsWith(value.toLowerCase())
        );
        setPrediction(match ? match : '');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.key === 'Tab' || e.key === 'ArrowRight') && prediction) {
            e.preventDefault();
            setCustomerName(prediction);
            setPrediction('');
        }
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const updateQuantity = (id: number, delta: number) => {
        const variety = riceVarieties.find(r => r.id === id);
        if (!variety) return;
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const potentialQty = parseFloat((item.quantity + delta).toFixed(2));
                if (potentialQty > variety.stock) {
                    toast.error(`Limit reached! Only ${variety.stock}${variety.unit} available.`);
                    return item;
                }
                return { ...item, quantity: Math.max(0.25, potentialQty) };
            }
            return item;
        }));
    };

    const addToCart = (rice: any) => {
        const existing = cart.find(item => item.id === rice.id);
        if (existing) {
            updateQuantity(rice.id, 1);
        } else {
            setCart([...cart, { ...rice, originalPrice: rice.price, discountApplied: false, quantity: 1 }]);
        }
    };

    const handlePayment = async (method: 'Cash' | 'Online Payment' | 'Utang', manualDate?: string) => {
        if (cart.length === 0) {
            toast.error("Cart is empty!");
            return;
        }
        
        try {
            for (const item of cart) {
                const { ok, data } = await createTransaction({
                    product_id: item.id,
                    quantity: item.quantity,
                    payment_method: method,
                    customer_name: customerName || 'Walk-in Customer',
                    discount_applied: item.discountApplied ? 0.1 : 0,
                    created_at: manualDate,
                });
                if (!ok) {
                    toast.error((data as { message?: string }).message || 'Sale failed.');
                    return;
                }
            }
            setTransactionData({
                receiptId: `INV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                date: manualDate ? new Date(manualDate).toLocaleString() : new Date().toLocaleString(),
                customerName: customerName || 'Walk-in Customer',
                items: cart,
                total: calculateTotal(),
                paymentMethod: method
            });
            setIsReceiptOpen(true);
            setCart([]);
            setCustomerName('');
            setPrediction('');
            fetchProducts();
        } catch (error: any) { 
            toast.error(error.message || "Transaction failed"); 
        }
    };

    return (
        <div 
            className={`min-h-screen bg-[var(--bg-system)] bg-fixed bg-cover bg-bottom transition-all duration-500 ${isMobile ? 'pb-[150px]' : 'pb-45'}`}
            style={{ 
                backgroundImage: `linear-gradient(var(--bg-overlay), var(--bg-overlay)), url('/rice.png')` 
            }}
        >
            {/* Header Toolbar */}
            <div className="bg-[var(--bg-card)]/70 backdrop-blur-md p-3 border-b border-[var(--border-color)] sticky top-[0px] z-30 shadow-sm transition-all">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--secondary-main)] opacity-40">
                            <TrendingUp size={14} strokeWidth={3} />
                        </div>
                        <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="w-full bg-[var(--bg-card)]/50 border border-[var(--border-color)] rounded-xl py-2.5 pl-9 pr-8 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer appearance-none text-[var(--text-main)] focus:ring-2 focus:ring-[var(--primary-main)]/20 transition-all shadow-inner"
                        >
                            <option value="none">Sort By Default</option>
                            <option value="price">Sort By Price</option>
                            <option value="alphabetical">Sort A-Z Name</option>
                        </select>
                        <ChevronDown 
                            size={14} 
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--secondary-main)] opacity-40 pointer-events-none" 
                        />
                    </div>

                    <button
                        onClick={() => setIsPastSalesOpen(true)}
                        className="flex items-center gap-2 bg-[var(--bg-accent)] text-[var(--primary-main)] border border-[var(--primary-main)]/10 font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl active:scale-95 transition-all shadow-sm whitespace-nowrap"
                    >
                        <CalendarDays size={14} strokeWidth={3} /> 
                        <span>Past Sales</span>
                    </button>
                </div>
            </div>

            {/* Product Grid */}
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {uniqueRiceVarieties.map(rice => (
                    <button
                        key={rice.id}
                        onClick={() => addToCart(rice)}
                        disabled={rice.stock <= 0}
                        className={`p-3 sm:p-3 rounded-2xl border text-left transition-all backdrop-blur-sm shadow-md ${rice.stock <= 0 ? 'bg-[var(--border-color)] opacity-50 border-transparent' : 'bg-[var(--bg-card)]/80 border-[var(--border-color)] active:bg-[var(--bg-accent)]'}`}
                    >
                        <p className="font-bold text-[var(--text-main)] text-sm sm:text-base line-clamp-1 uppercase">{rice.name}</p>
                        <p className="text-[var(--primary-main)] font-black text-xs sm:text-sm">₱{rice.price}</p>
                        <p className={`text-[9px] mt-2 font-black uppercase ${rice.stock < 10 ? 'text-red-500' : 'text-[var(--text-main)] opacity-30'}`}>
                            {rice.stock <= 0 ? 'Out of Stock' : `${rice.stock}${rice.unit} left`}
                        </p>
                    </button>
                ))}
            </div>

            {/* CONSOLIDATED STICKY FRAME - NOW DYNAMICALLY ADJUSTS TO NAV VISIBILITY */}
            <div 
                className={`fixed right-0 z-[60] transition-all duration-500 ease-in-out px-2 pb-2 sm:px-4 sm:pb-4 ${
                    isMobile 
                    ? isNavVisible ? 'bottom-[72px] left-0' : 'bottom-2 left-0'
                    : `bottom-0 ${isCollapsed ? 'left-20' : 'left-64'}`
                }`}
            >
             <div 
                 className="relative backdrop-blur-xl border border-white/40 shadow-[0_-15px_40px_rgba(0,0,0,0.2)] rounded-[2rem] sm:rounded-[2.5rem] p-2 sm:p-3 flex flex-col md:grid md:grid-cols-2 gap-2 sm:gap-3 overflow-visible transition-all duration-500"
                >
                    <div 
                        className="absolute inset-0 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden -z-10"
                        style={{ 
                            backgroundImage: `linear-gradient(var(--bg-overlay), var(--bg-overlay)), url('/rice.png')`,
                            backgroundSize: 'cover'
                        }}
                    />

                    {/* LEFT SIDE: CART ITEMS */}
                    <div className="flex flex-col md:border-r border-[var(--border-color)] md:pr-4">
                        <div className="flex items-center justify-between mb-1 px-3">
                            <h3 className="text-[9px] font-black text-[var(--secondary-main)] opacity-100 uppercase tracking-[0.2em]">Cart</h3>
                            <span className="text-[8px] font-black text-[var(--primary-main)] bg-[var(--bg-accent)] px-1.5 py-0.5 rounded-md uppercase">{cart.length} Items</span>
                        </div>
                        
                        <div className="flex-1 min-h-[70px] md:min-h-[120px]">
                            {cart.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-center py-2 text-[var(--secondary-main)] opacity-20 border-2 border-dashed border-[var(--border-color)] rounded-2xl bg-[var(--bg-card)]/50">
                                    <p className="text-[8px] font-black uppercase tracking-widest">Select items</p>
                                </div>
                            ) : (
                                <div className="flex overflow-x-auto no-scrollbar items-center h-full gap-2">
                                    {cart.map(item => (
                                        <div key={item.id} className="min-w-[130px] sm:min-w-[160px] bg-[var(--bg-card)] border border-[var(--border-color)] p-2 sm:p-3 rounded-xl shadow-sm flex flex-col justify-between h-auto min-h-[85px] sm:min-h-[100px]">
                                            <div className="leading-tight">
                                                <div className="flex justify-between items-start">
                                                    <p className="text-[10px] font-black text-[var(--text-main)] truncate pr-1 uppercase tracking-tight">{item.name}</p>
                                                    <button onClick={() => setCart(cart.filter(i => i.id !== item.id))} className="text-stone-300 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                                                </div>
                                                <p className="text-[8px] text-[var(--text-main)] opacity-40 font-bold uppercase">₱{item.price}/{item.unit}</p>
                                            </div>

                                            <div className="flex flex-col mt-auto gap-1 pt-1">
                                                <div className="flex items-center justify-start gap-2">
                                                    <div className="flex items-center gap-1 bg-[var(--bg-system)] p-0.5 rounded border border-[var(--border-color)] scale-75 sm:scale-90 origin-left">
                                                        <button onClick={() => updateQuantity(item.id, -0.25)} className="p-0.5 hover:text-[var(--primary-main)]"><Minus size={10} /></button>
                                                        <span className="font-black text-[9px] min-w-[20px] text-center text-[var(--text-main)]">{item.quantity}</span>
                                                        <button onClick={() => updateQuantity(item.id, 0.25)} className="p-0.5 hover:text-[var(--primary-main)]"><Plus size={10} /></button>
                                                    </div>
                                                    <p className="text-[10px] font-black text-[var(--primary-main)] italic">₱{(item.price * item.quantity).toFixed(2)}</p>
                                                </div>
                                                
                                                <div className="flex gap-1 w-full">
                                                    <button 
                                                        onClick={() => updateQuantity(item.id, 10)} 
                                                        className="flex-1 bg-[var(--bg-accent)] text-[var(--primary-main)] hover:bg-[var(--primary-main)]/10 py-0.5 sm:py-1 rounded-[4px] text-[7px] font-black uppercase tracking-wider transition-colors"
                                                    >
                                                        +10
                                                    </button>
                                                    <button 
                                                        onClick={() => updateQuantity(item.id, 25)} 
                                                        className="flex-1 bg-[var(--bg-accent)] text-[var(--primary-main)] hover:bg-[var(--primary-main)]/10 py-0.5 sm:py-1 rounded-[4px] text-[7px] font-black uppercase tracking-wider transition-colors"
                                                    >
                                                        +25
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT SIDE: CUSTOMER + TOTAL & PAYMENTS */}
                    <div className="flex flex-col justify-center space-y-2">
                        <div className="flex flex-row items-end gap-2 sm:gap-3 px-1">
                            <div className="relative flex-1">
                                <label className="hidden sm:block text-[8px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-widest ml-1 mb-1 transition-colors">Customer</label>
                                
                                <div className="relative flex items-center h-8 sm:h-10">
                                    <div className="absolute inset-0 flex items-center px-3 border border-transparent text-[10px] font-black text-[var(--text-main)] opacity-30 pointer-events-none select-none uppercase z-0">
                                        {prediction}
                                    </div>

                                    <Users className="sm:hidden absolute left-3 text-[var(--secondary-main)] opacity-40 z-20 pointer-events-none" size={14} />

                                    <input
                                        type="text"
                                        value={customerName}
                                        onChange={(e) => handleCustomerNameChange(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={prediction ? "" : "Walk-in"}
                                        className="w-full h-full bg-[var(--bg-card)]/30 backdrop-blur-md border-2 border-[var(--border-color)] rounded-xl px-3 sm:px-3 text-[10px] font-black uppercase text-[var(--text-main)] focus:ring-2 focus:ring-[var(--primary-main)] outline-none relative z-10 transition-all sm:pl-3 pl-8"
                                    />
                                    
                                    {prediction && (
                                         <span className="absolute right-3 text-[8px] font-black uppercase text-[var(--secondary-main)] opacity-40 tracking-tighter z-20 pointer-events-none">
                                            Tab ⇥
                                         </span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="text-right min-w-[80px] sm:min-w-[100px]">
                                <label className="hidden sm:block text-[8px] font-black text-[var(--primary-main)] uppercase tracking-widest mr-1 mb-1 transition-colors">Total Due</label>
                                <div className="flex items-center justify-end gap-1">                                    
                                    <p className="text-xl sm:text-2xl font-black text-[var(--text-main)] italic leading-none pb-0.5 transition-colors">₱{calculateTotal().toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-1.5 sm:gap-2 pt-1">
                            <button onClick={() => handlePayment('Cash')} 
                            className="flex-1 bg-[var(--primary-main)] text-white font-black py-2 rounded-xl active:scale-95 transition-all text-[8px] sm:text-[9px] uppercase tracking-widest border-b-4 border-black/20">
                                Cash
                            </button>
                            <button onClick={() => handlePayment('Online Payment')} 
                            className="flex-1 bg-[var(--primary-main)] text-white font-black py-2 rounded-xl active:scale-95 transition-all text-[8px] sm:text-[9px] uppercase tracking-widest border-b-4 border-black/20">
                                Online
                            </button>
                            <button 
                                onClick={() => { 
                                    if (!customerName) {
                                        toast.error("Enter Customer Name for Utang!"); 
                                        return;
                                    } 
                                    handlePayment('Utang'); 
                                }} 
                                className="flex-1 bg-[var(--secondary-main)] text-white font-black py-2 rounded-xl shadow-lg active:scale-95 transition-all text-[8px] sm:text-[9px] uppercase tracking-widest border-b-4 border-black/20"
                            >
                                Utang
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <ReceiptModal isOpen={isReceiptOpen} onClose={() => setIsReceiptOpen(false)} data={transactionData} />
            <PastSalesModal 
                isOpen={isPastSalesOpen} 
                closeModal={() => setIsPastSalesOpen(false)} 
                products={riceVarieties} 
                onSuccess={fetchProducts} 
                onSavePastSale={handlePayment} 
            />
        </div>
    );
};

export default POS;