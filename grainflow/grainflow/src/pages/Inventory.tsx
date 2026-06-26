import { useState, useEffect } from 'react';
import { Search, Plus, Filter, Bell, Package, ListChecks, Eye } from 'lucide-react';
import toast from 'react-hot-toast'; 
import ProductCard from '../components/product/ProductCard';
import AddProductModal from '../components/product/AddProductModal';
import LowStockModal from '../components/product/LowStockModal';
import OrderListView from '../components/product/OrderListView';
import { getProducts, getArchivedProducts } from '../services/api';

// 🚀 BULLETPROOF HELPER: Check archive status safely
function isArchived(product: any): boolean {
    if (!product) return false;
    return product.is_archived === true || product.is_archived === 1 || String(product.is_archived) === '1';
}

// Helper function: Get the oldest batch of a product (for main inventory view)
function getOldestBatch(productName: string, allProducts: any[]): any | null {
    const sameNameProducts = allProducts.filter(p => 
        p?.name?.toLowerCase().trim() === productName?.toLowerCase().trim() &&
        !isArchived(p)
    );
    
    if (sameNameProducts.length === 0) return null;
    
    return sameNameProducts.reduce((oldest, current) => {
        const oldestTime = new Date(oldest.created_at).getTime();
        const currentTime = new Date(current.created_at).getTime();
        return currentTime < oldestTime ? current : oldest;
    });
}

// Helper function: Determines if a product is a newer batch (for the UI badge)
function isNewStock(product: any, allProducts: any[]): boolean {
    if (!product || !allProducts) return false;
    if (isArchived(product)) return false;
    if (!product.created_at) return false;

    const sameNameProducts = allProducts.filter(p => 
        p?.name?.toLowerCase().trim() === product?.name?.toLowerCase().trim() &&
        !isArchived(p)
    );

    if (sameNameProducts.length <= 1) return false;

    const maxCreatedAt = Math.max(
        ...sameNameProducts.map(p => new Date(p.created_at).getTime())
    );

    return new Date(product.created_at).getTime() === maxCreatedAt;
}

// 🚀 FIXED: Proper filtering for each view
function getFilteredProducts(products: any[], allProducts: any[], view: 'active' | 'new' | 'archive'): any[] {
    const safeProducts = products || [];
    
    switch (view) {
        case 'archive':
            // Show only archived items with 0 stock (empty and decided not to reorder)
            return safeProducts.filter(p => isArchived(p) && parseFloat(p?.stockQuantity || "0") === 0);
        
        case 'new':
            // Show archived items with stock (newer batches waiting to be used)
            return safeProducts.filter(p => isArchived(p) && parseFloat(p?.stockQuantity || "0") > 0);
        
        case 'active':
        default:
            // Show only the oldest batch of each active product with stock > 0
            const activeProducts = safeProducts.filter(p => !isArchived(p) && parseFloat(p?.stockQuantity || "0") > 0);
            const uniqueNames = Array.from(new Set(activeProducts.map(p => p?.name?.toLowerCase().trim())));
            
            return uniqueNames.map(name => {
                const oldest = getOldestBatch(name, allProducts);
                return oldest;
            }).filter(Boolean);
    }
}

function applySortAndSearch(
    products: any[],
    searchQuery: string,
    sortBy: 'name' | 'stock-high' | 'stock-low' | 'none'
): any[] {
    const safeProducts = products || [];
    let result = safeProducts.filter(p =>
        p?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortBy === 'name') {
        result.sort((a, b) => (a?.name || "").localeCompare(b?.name || ""));
    } else if (sortBy === 'stock-high') {
        result.sort((a, b) => (b?.stockQuantity || 0) - (a?.stockQuantity || 0));
    } else if (sortBy === 'stock-low') {
        result.sort((a, b) => (a?.stockQuantity || 0) - (b?.stockQuantity || 0));
    }

    return result;
}

const Inventory = () => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState<'add' | 'edit'>('add');
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [prediction, setPrediction] = useState('');
    const [showFilterOptions, setShowFilterOptions] = useState(false);
    
    // Toggle States
    const [isViewingArchive, setIsViewingArchive] = useState(false);
    const [isViewingNewStock, setIsViewingNewStock] = useState(false);
    const [showOrderRegistration, setShowOrderRegistration] = useState(false);
    const [markedOrders, setMarkedOrders] = useState<any[]>([]);
    
    const [products, setProducts] = useState<any[]>([]);
    const [allRawProducts, setAllRawProducts] = useState<any[]>([]); 
    const [sortBy, setSortBy] = useState<'name' | 'stock-high' | 'stock-low' | 'none'>('none');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        fetchProducts();
        checkMarkedOrders();
    }, [isViewingArchive, isViewingNewStock]);

    const checkMarkedOrders = () => {
        const orders = localStorage.getItem('grainflow_order_guide');
        if (orders) {
            try {
                setMarkedOrders(JSON.parse(orders));
            } catch (e) {
                setMarkedOrders([]);
            }
        } else {
            setMarkedOrders([]);
        }
    };

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const [activeRes, archivedRes] = await Promise.all([
                getProducts(),
                getArchivedProducts(),
            ]);

            if (activeRes.ok && archivedRes.ok) {
                const activeData = activeRes.data;
                const archivedData = archivedRes.data;
                const combined = [...activeData, ...archivedData];
                
                setAllRawProducts(combined);

                if (isViewingArchive || isViewingNewStock) {
                    setProducts(archivedData);
                } else {
                    setProducts(activeData);
                }
            } else {
                toast.error("Failed to load inventory data.");
            }
        } catch (error) {
            console.error("Error loading inventory:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate global low stock across all batches
    const lowStockCount = allRawProducts.filter(p => {
        const stock = Number(p.stockQuantity || 0);
        const threshold = Number(p.reorderLevel || 25);
        const trulyDeleted = isArchived(p) && stock === 0;
        return !trulyDeleted && stock <= threshold;
    }).length;

    const varietyNames = Array.from(new Set(allRawProducts.map(p => p?.name).filter(Boolean)));

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        if (value.length > 0) {
            const match = varietyNames.find(name => 
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
            setSearchQuery(prediction);
            setPrediction('');
        }
    };

    const filteredProducts = applySortAndSearch(
        getFilteredProducts(
            products,
            allRawProducts,
            isViewingArchive ? 'archive' : isViewingNewStock ? 'new' : 'active'
        ),
        searchQuery,
        sortBy
    );

    const handleEdit = (item: any) => {
        setSelectedItem(item);
        setDrawerMode('edit');
        setIsDrawerOpen(true);
    };

    const handleAdd = () => {
        setSelectedItem(null);
        setDrawerMode('add');
        setIsDrawerOpen(true);
    };

    const handlePackageClick = () => {
        // Check localStorage directly for marked orders
        const orders = localStorage.getItem('grainflow_order_guide');
        console.log('Package button clicked. localStorage grainflow_order_guide:', orders);
        
        if (!orders) {
            toast.error('No orders are marked. Please use the Low Stock List to mark orders first.');
            return;
        }
        
        try {
            const parsedOrders = JSON.parse(orders);
            console.log('Parsed orders:', parsedOrders);
            
            if (!Array.isArray(parsedOrders) || parsedOrders.length === 0) {
                toast.error('No orders are marked. Please use the Low Stock List to mark orders first.');
                return;
            }
            // Update state and open modal
            setMarkedOrders(parsedOrders);
            console.log('Setting markedOrders to:', parsedOrders);
            
            // Use setTimeout to ensure state is updated before opening modal
            setTimeout(() => {
                setShowOrderRegistration(true);
            }, 0);
        } catch (e) {
            console.error('Error parsing orders:', e);
            toast.error('No orders are marked. Please use the Low Stock List to mark orders first.');
        }
    };

    if (isLoading && products.length === 0) return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-system)]">
            <div className="w-10 h-10 border-4 border-[var(--primary-main)]/20 border-t-[var(--primary-main)] rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div 
            className="pb-5 min-h-screen bg-[var(--bg-system)] bg-fixed bg-cover bg-bottom transition-colors duration-500"
            style={{ backgroundImage: `linear-gradient(var(--bg-overlay), var(--bg-overlay)), url('/rice.png')` }}
        >
            <div className="bg-[var(--bg-card)]/80 backdrop-blur-md px-4 py-2 sm:py-3 sm:px-4 sm:py-4 border-b border-[var(--border-color)] sticky top-[0px] z-30 space-y-2 sm:space-y-4 shadow-sm transition-all duration-500">
                
                {/* 1st ROW: Low Stock Alert Banner */}
                {!isViewingArchive && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsLowStockModalOpen(true)}
                            className={`flex-1 p-2 sm:p-3 rounded-2xl flex items-center justify-between transition-all border-2 ${
                                lowStockCount > 0
                                    ? 'bg-red-50 border-red-100 shadow-md animate-pulse'
                                    : 'bg-[var(--bg-system)]/50 border-[var(--border-color)] opacity-60'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-0.5 sm:p-2 rounded-xl ${lowStockCount > 0 ? 'bg-red-100 text-red-600' : 'bg-[var(--bg-system)] text-[var(--secondary-main)] opacity-40'}`}>
                                    {lowStockCount > 0 ? <Bell size={18} className="fill-red-600" /> : <ListChecks size={18} />}
                                </div>
                                <div className="text-left">
                                    <p className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest leading-none ${lowStockCount > 0 ? 'text-red-600' : 'text-[var(--text-main)]'}`}>
                                        {lowStockCount > 0 ? 'Low Stock Alert' : 'Low Stock List'}
                                    </p>
                                    <p className="text-[8px] sm:text-[9px] font-black text-[var(--secondary-main)] opacity-40 mt-1 uppercase">
                                        {lowStockCount > 0 ? `${lowStockCount} Varieties for Reorder` : 'Inventory sequence healthy'}
                                    </p>
                                </div>
                            </div>
                            <div className={`text-[7px] sm:text-[9px] font-black text-white px-1 sm:px-3 py-1.5 rounded-lg uppercase shadow-sm transition-all flex items-center justify-center ${lowStockCount > 0 ? 'bg-red-600' : 'bg-gray-400'}`}>
                                <span className="hidden sm:inline">View Order List</span>
                                <Eye className="sm:hidden w-8 h-5" strokeWidth={3} />
                            </div>
                        </button>

                        {/* Mobile: Plus and Package buttons on the right */}
                        {!isViewingArchive && !isViewingNewStock && (
                            <div className="md:hidden flex gap-2">
                                <button onClick={handleAdd} className="bg-[var(--primary-main)] p-2.5 rounded-xl text-white shadow-xl shadow-[var(--primary-main)]/20 active:scale-90 transition-all border-b-2 border-black/10 shrink-0" title="Add new rice variety">
                                    <Plus size={18} strokeWidth={3} />
                                </button>
                                <button onClick={handlePackageClick} className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-xl shadow-emerald-600/20 active:scale-90 transition-all border-b-2 border-black/10 shrink-0" title="Register orders from order list">
                                    <Package size={18} strokeWidth={3} />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* 2nd ROW: Search, Filters, New Stock, Archive, and Add */}
                <div className="flex flex-col gap-2">
                    {/* Desktop: All on one line */}
                    <div className="hidden md:flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 min-w-[200px]">
                            <div className="absolute left-10 top-1/2 -translate-y-1/2 text-xs font-black text-[var(--text-main)] opacity-20 pointer-events-none z-0 uppercase tracking-widest">
                                {prediction}
                            </div>
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--primary-main)] opacity-50 z-10" size={16} />
                            <input
                                type="text"
                                placeholder="Search variety..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                onKeyDown={handleKeyDown}
                                className="w-full pl-3 pr-4 py-3 bg-[var(--bg-system)] border-2 border-[var(--border-color)] rounded-xl text-xs font-black text-[var(--text-main)] focus:ring-4 focus:ring-[var(--primary-main)]/10 focus:border-[var(--primary-main)] outline-none transition-all relative z-10"
                            />
                        </div>

                        <button
                            onClick={() => setShowFilterOptions(!showFilterOptions)}
                            className={`p-3 rounded-xl transition-all border-2 shrink-0 ${
                                showFilterOptions 
                                ? 'bg-[var(--primary-main)] border-[var(--primary-main)] text-white shadow-lg shadow-[var(--primary-main)]/20' 
                                : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--secondary-main)] opacity-60'
                            }`}
                        >
                            <Filter size={18} />
                        </button>

                        {!isViewingArchive && (
                            <button
                                onClick={() => {
                                    setIsViewingNewStock(!isViewingNewStock);
                                    setIsViewingArchive(false);
                                }}
                                className={`text-[10px] px-3 py-2.5 rounded-xl font-black uppercase tracking-widest transition-all border-2 shrink-0 ${
                                    isViewingNewStock 
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                                    : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-main)] opacity-60'
                                }`}
                            >
                                {isViewingNewStock ? 'Active' : 'New Stock'}
                            </button>
                        )}

                        <button
                            onClick={() => {
                                setIsViewingArchive(!isViewingArchive);
                                setIsViewingNewStock(false);
                            }}
                            className={`text-[10px] px-3 py-2.5 rounded-xl font-black uppercase tracking-widest transition-all border-2 shrink-0 ${
                                isViewingArchive 
                                ? 'bg-red-600 border-red-600 text-white shadow-lg' 
                                : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-main)] opacity-60'
                            }`}
                        >
                            {isViewingArchive ? 'Active' : 'Archive'}
                        </button>

                        {!isViewingArchive && !isViewingNewStock && (
                            <>
                                <button onClick={handleAdd} className="bg-[var(--primary-main)] p-2.5 rounded-xl text-white shadow-xl shadow-[var(--primary-main)]/20 active:scale-90 transition-all border-b-2 border-black/10 shrink-0" title="Add new rice variety">
                                    <Plus size={18} strokeWidth={3} />
                                </button>
                                <button onClick={handlePackageClick} className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-xl shadow-emerald-600/20 active:scale-90 transition-all border-b-2 border-black/10 shrink-0" title="Register orders from order list">
                                    <Package size={18} strokeWidth={3} />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Mobile: Reorganized layout */}
                    <div className="md:hidden flex flex-col gap-2">
                        {/* Search + Filter + New Stock + Archive */}
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1 min-w-0">
                                <div className="absolute left-10 top-1/2 -translate-y-1/2 text-xs font-black text-[var(--text-main)] opacity-20 pointer-events-none z-0 uppercase tracking-widest">
                                    {prediction}
                                </div>
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--primary-main)] opacity-50 z-10" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search variety..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    onKeyDown={handleKeyDown}
                                    className="w-full pl-3 pr-4 py-2 sm:py-3 bg-[var(--bg-system)] border-2 border-[var(--border-color)] rounded-xl text-xs font-black text-[var(--text-main)] focus:ring-4 focus:ring-[var(--primary-main)]/10 focus:border-[var(--primary-main)] outline-none transition-all relative z-10"
                                />
                            </div>

                            <button
                                onClick={() => setShowFilterOptions(!showFilterOptions)}
                                className={`p-2 sm:p-3 rounded-xl transition-all border-2 shrink-0 ${
                                    showFilterOptions 
                                    ? 'bg-[var(--primary-main)] border-[var(--primary-main)] text-white shadow-lg shadow-[var(--primary-main)]/20' 
                                    : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--secondary-main)] opacity-60'
                                }`}
                            >
                                <Filter size={18} />
                            </button>

                            {!isViewingArchive && (
                                <button
                                    onClick={() => {
                                        setIsViewingNewStock(!isViewingNewStock);
                                        setIsViewingArchive(false);
                                    }}
                                    className={`text-[10px] px-2 py-2.5 rounded-xl font-black uppercase tracking-widest transition-all border-2 shrink-0 ${
                                        isViewingNewStock 
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                                        : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-main)] opacity-60'
                                    }`}
                                >
                                    {isViewingNewStock ? 'Active' : 'New'}
                                </button>
                            )}

                            <button
                                onClick={() => {
                                    setIsViewingArchive(!isViewingArchive);
                                    setIsViewingNewStock(false);
                                }}
                                className={`text-[10px] px-2 py-2.5 rounded-xl font-black uppercase tracking-widest transition-all border-2 shrink-0 ${
                                    isViewingArchive 
                                    ? 'bg-red-600 border-red-600 text-white shadow-lg' 
                                    : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-main)] opacity-60'
                                }`}
                            >
                                {isViewingArchive ? 'Active' : 'Archive'}
                            </button>
                        </div>
                    </div>
                </div>

                {showFilterOptions && (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pt-1 pb-1 animate-in fade-in slide-in-from-top-2 duration-300">
                        {[
                            { id: 'name', label: 'A-Z Name' },
                            { id: 'stock-high', label: 'Heavy Stock' },
                            { id: 'stock-low', label: 'Low Stock' },
                        ].map((option) => (
                            <button
                                key={option.id}
                                onClick={() => setSortBy(option.id as any)}
                                className={`whitespace-nowrap px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border-2 transition-all ${
                                    sortBy === option.id 
                                    ? 'bg-[var(--secondary-main)] border-[var(--secondary-main)] text-white shadow-sm' 
                                    : 'bg-[var(--bg-system)] border-[var(--border-color)] text-[var(--text-main)] opacity-60'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                        {sortBy !== 'none' && (
                            <button onClick={() => setSortBy('none')} className="text-[9px] font-black uppercase text-red-500 px-3">
                                Clear
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="p-4 sm:p-6 transition-all duration-500">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 sm:gap-6">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map(product => (
                            <ProductCard 
                                key={product?.id} 
                                product={product} 
                                onEdit={handleEdit} 
                                onDeleteSuccess={fetchProducts} 
                                allProducts={allRawProducts}
                                isNew={isNewStock(product, allRawProducts)}
                            />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-32 transition-all">
                            <div className="flex flex-col items-center gap-4 opacity-20">
                                <Package size={48} className="text-[var(--text-main)]" />
                                <p className="text-[var(--text-main)] font-black uppercase italic tracking-[0.4em] text-xs">
                                    {isViewingArchive ? "No Archived Records" : isViewingNewStock ? "No Items in Queue" : "Stock Is Depleted"}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <AddProductModal 
                isOpen={isDrawerOpen} 
                closeModal={() => setIsDrawerOpen(false)} 
                onSuccess={fetchProducts} 
                mode={drawerMode} 
                initialData={selectedItem}
                existingVarieties={varietyNames} 
            />
            <LowStockModal 
                isOpen={isLowStockModalOpen} 
                closeModal={() => {
                    setIsLowStockModalOpen(false);
                    checkMarkedOrders();
                }} 
                products={allRawProducts} 
                onRefresh={fetchProducts} 
            />
            <OrderListView
                isOpen={showOrderRegistration}
                closeModal={() => {
                    setShowOrderRegistration(false);
                    setMarkedOrders([]);
                    fetchProducts();
                }}
                orderItems={markedOrders}
            />
        </div>
    );
};

export default Inventory;