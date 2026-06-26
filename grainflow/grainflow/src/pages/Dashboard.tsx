import { useState, useEffect } from 'react';
import { ShoppingCart, Package, Clock, ChevronRight, TrendingUp, Database, Sparkles, Currency } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import UtangModal from '../components/features/UtangModal';
import SalesSummaryBox from '../components/SalesSummaryBox';
import { getDashboardStats } from '../services/api';

const Dashboard = () => {
    // --- STATE MANAGEMENT ---
    const [data, setData] = useState<any>(null); 
    const [loading, setLoading] = useState(true);
    const [isUtangModalOpen, setIsUtangModalOpen] = useState(false);
    const [chartMode, setChartMode] = useState<'volume' | 'profit'>('volume'); 

    const [chartData, setChartData] = useState<any>(null); 
    const [timePeriodIndex, setTimePeriodIndex] = useState(0); 
    const [salesTimePeriodIndex, setSalesTimePeriodIndex] = useState(0); 

    // Safety for dynamic colors
    const [themeColors, setThemeColors] = useState(['#ea580c', '#8B5E3C', '#fb923c', '#fdba74', '#9ca3af']);

    useEffect(() => {
        const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary-main').trim() || '#ea580c';
        const secondary = getComputedStyle(document.documentElement).getPropertyValue('--secondary-main').trim() || '#8B5E3C';
        setThemeColors([primary, secondary, '#fb923c', '#fdba74', '#9ca3af']);
    }, []);

    const timePeriodOptions = [
        { value: 'today' as const, label: 'Today' },
        { value: 'yesterday' as const, label: 'Yesterday' },
        { value: '7days' as const, label: '7 Days' },
        { value: '30days' as const, label: '30 Days' },
        { value: 'all' as const, label: 'All' },
    ];

    const salesTimePeriodOptions = [
        { value: '7days' as const, label: '7 Days' },
        { value: 'last7days' as const, label: 'Last 7 Days' },
        { value: '30days' as const, label: '30 Days' },
        { value: 'all' as const, label: 'All' },
    ];

    const currentTimePeriod = timePeriodOptions[timePeriodIndex];
    const currentSalesTimePeriod = salesTimePeriodOptions[salesTimePeriodIndex];

    const handleTimePeriodClick = () => setTimePeriodIndex((prev) => (prev + 1) % timePeriodOptions.length);
    const handleSalesTimePeriodClick = () => setSalesTimePeriodIndex((prev) => (prev + 1) % salesTimePeriodOptions.length);

    let userName = 'Guest';
    try {
        const userString = localStorage.getItem('user');
        if (userString && userString !== 'undefined') {
            const userObj = JSON.parse(userString);
            userName = userObj.name || 'Guest';
        }
    } catch { /* ignore */ }

    useEffect(() => {
        const fetchKPIs = async () => {
            try {
                const { ok, data: kpiData } = await getDashboardStats({ period: 'today' });
                if (ok) setData(kpiData);
            } catch (error) {
                console.error('Dashboard KPI error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchKPIs();
    }, []);

    useEffect(() => {
        const fetchCharts = async () => {
            try {
                const varietyRes = await getDashboardStats({ period: currentTimePeriod.value });
                const salesRes = await getDashboardStats({ salesPeriod: currentSalesTimePeriod.value });
                
                if (varietyRes.ok && salesRes.ok) {
                    setChartData({
                        varietyBreakdown: varietyRes.data?.varietyBreakdown || [],
                        monthlySales: salesRes.data?.monthlySales || [],
                    });
                }
            } catch (error) {
                console.error('Chart data error:', error);
            }
        };
        fetchCharts();
    }, [timePeriodIndex, salesTimePeriodIndex]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-system)]">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-[var(--border-color)] border-t-[var(--primary-main)] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-[10px] font-black uppercase text-[var(--primary-main)] tracking-[0.2em]">Accessing Ledger...</p>
            </div>
        </div>
    );

    const salesToday = data?.salesToday ?? 0;
    const salesYesterday = data?.salesYesterday ?? 0;
    const salesThisWeek = data?.salesThisWeek ?? 0;
    const salesLastWeek = data?.salesLastWeek ?? 0;

    const getTrend = (current: number, prior: number): 'up' | 'down' | 'neutral' => {
        if (current > prior) return 'up';
        if (current < prior) return 'down';
        return 'neutral';
    };

    const getTrendPercent = (current: number, prior: number): number | undefined => {
        if (!prior || prior === 0) return undefined;
        return Math.round(((current - prior) / prior) * 100);
    };

    return (
        <div className="p-4 space-y-2 sm:space-y-6 pb-5 min-h-screen bg-[var(--bg-system)] bg-fixed bg-cover bg-bottom 
        transition-all duration-700" style={{ backgroundImage: `linear-gradient(var(--bg-overlay), var(--bg-overlay)), url('/rice.png')` }}>
            
            <header className="flex justify-between items-start">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-[var(--text-main)] italic tracking-tight transition-colors duration-300">Hello, {userName}</h2>
                    <p className="text-[var(--secondary-main)] text-[8px] sm:text-[10px] font-black uppercase tracking-[0.25em] opacity-80 transition-colors">Operational Intelligence</p>
                </div>
                <p className="text-[9px] font-black text-[var(--secondary-main)] uppercase tracking-widest bg-[var(--bg-accent)]/80 px-4 py-2 rounded-2xl backdrop-blur-md shadow-sm border border-[var(--primary-main)]/10 transition-all">
                    {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="lg:col-span-2 bg-[var(--bg-card)] px-4 py-3 sm:px-6 sm:py-6 rounded-[1.5rem] sm:rounded-[2.5rem] border-2 sm:border-3 border-[var(--border-color)] shadow-md transition-all duration-500">
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                            <Currency size={14} className="text-[var(--primary-main)]" />
                            <p className="text-[10px] font-black text-[var(--text-main)] opacity-30 uppercase tracking-[0.2em]">Gross Revenue</p>
                        </div>
                        <span className="text-[8px] font-black text-[var(--primary-main)] bg-[var(--bg-accent)] border border-black/20 px-3 py-1 rounded-full uppercase tracking-tighter transition-all">Live Tracker</span>
                    </div>
                    <h3 className="text-center sm:text-left text-3xl sm:text-4xl font-black text-[var(--text-main)] leading-none mb-3 sm:mb-6 italic tracking-tighter transition-colors duration-300">
                        ₱{salesToday.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-1 sm:gap-3">
                        <div className="bg-[var(--bg-system)] px-3 py-2 sm:px-3 sm:py-3 rounded-2xl border border-[var(--border-color)] flex flex-col transition-all">
                            <span className="text-[8px] font-black text-[var(--text-main)] opacity-50 uppercase sm:mb-1">Cash</span>
                            <span className="text-sm font-black text-[var(--text-main)]">₱{data?.todayBreakdown?.cash?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="bg-[var(--primary-main)]/30 px-3 py-2 sm:px-3 sm:py-3 rounded-2xl border border-[var(--text-main)]/10 flex flex-col transition-all">
                            <span className="text-[8px] font-black text-[var(--secondary-main)] opacity-70 uppercase sm:mb-1">Digital</span>
                            <span className="text-sm font-black text-[var(--text-main)]">₱{data?.todayBreakdown?.online?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="bg-red-50 px-3 py-2 sm:px-3 sm:py-3 rounded-2xl border border-red-100 flex flex-col transition-all">
                            <span className="text-[8px] font-black text-red-600 uppercase sm:mb-1 animate-pulse tracking-tighter">Pending</span>
                            <span className="text-sm font-black text-gray-900">₱{data?.todayBreakdown?.utang?.toLocaleString() || '0'}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--secondary-main)] text-[var(--bg-accent)] px-4 py-3 sm:px-6 sm:py-6 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl shadow-[var(--secondary-main)]/30 flex flex-col justify-center relative overflow-hidden transition-all duration-700">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-[var(--bg-accent)]/60 text-[10px] font-black uppercase tracking-widest mb-1 sm:mb-2">
                            <TrendingUp size={14} /> Estimated Net
                        </div>
                        <h3 className="text-center sm:text-left text-2xl sm:text-3xl font-black leading-none italic transition-all">
                            ₱{data?.todayBreakdown?.profit?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                        </h3>
                        <p className="text-[8px] font-bold text-[var(--bg-accent)]/40 mt-2 sm:mt-3 uppercase tracking-widest border-t border-[var(--bg-accent)]/10 pt-1 sm:pt-3">Calculated Daily Yield</p>
                    </div>
                    <div className="absolute -right-6 -bottom-6 text-white/5 w-32 h-32 rotate-12 transition-transform duration-1000">
                        <span className="text-white/10 italic font-black text-4xl select-none"><Sparkles size={128} /></span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-3 sm:gap-x-4 sm:gap-y-4">
                <div className="bg-[var(--bg-card)] backdrop-blur-md px-5 py-2 sm:px-5 sm:py-5 rounded-[1.0rem] sm:rounded-[2rem] border-2 border-[var(--border-color)] shadow-lg flex items-center gap-4 transition-all hover:scale-[1.02]">
                    <div className="p-2 sm:p-3 bg-[var(--bg-accent)] text-[var(--primary-main)] rounded-md sm:rounded-2xl shadow-sm">
                        <ShoppingCart className="w-[15px] h-[15px] sm:w-5 sm:h-5" />
                    </div>
                    <div>
                        <p className="text-[8px] sm:text-[9px] font-black text-[var(--text-main)] opacity-40 uppercase tracking-widest">Orders</p>
                        <p className="text-md sm:text-xl font-black text-[var(--text-main)]">{data?.orders || '0'}</p>
                    </div>
                </div>
                <div className="bg-[var(--bg-card)] backdrop-blur-md px-5 py-2 sm:px-5 sm:py-5 rounded-[1.0rem] sm:rounded-[2rem] border-2 border-[var(--border-color)] shadow-lg flex items-center gap-4 transition-all hover:scale-[1.02]">
                    <div className="p-2 sm:p-3 bg-red-50 text-red-600 rounded-md sm:rounded-2xl shadow-sm">
                        <Package className="w-[15px] h-[15px] sm:w-5 sm:h-5" />
                    </div>
                    <div>
                        <p className="text-[8px] sm:text-[9px] font-black text-red-400 uppercase tracking-widest">Low Stock</p>
                        <p className="text-md sm:text-xl font-black text-[var(--text-main)]">{data?.lowStock || '0'}</p>
                    </div>
                </div>

                <button
                    onClick={() => setIsUtangModalOpen(true)}
                    className="col-span-2 bg-gradient-to-br from-[var(--bg-accent)] to-[var(--bg-card)] p-3 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 border-[var(--primary-main)]/10 shadow-xl flex items-center justify-between hover:border-[var(--primary-main)]/30 transition-all active:scale-95 group overflow-hidden"
                >
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 rounded-2xl bg-[var(--bg-card)] text-[var(--primary-main)] shadow-md group-hover:scale-110 transition-all duration-300">
                            <Clock className="w-[15px] h-[15px] sm:w-7 sm:h-7" />
                        </div>
                        <div className="text-left">
                            <p className="text-[8px] sm:text-[10px] font-black text-[var(--secondary-main)] uppercase tracking-[0.25em] mb-1">Suki Credit</p>
                            <h3 className="text-md sm:text-lg font-black text-[var(--text-main)] italic tracking-tight transition-colors group-hover:text-[var(--primary-main)]">Settle Transactions</h3>
                        </div>
                    </div>
                    <ChevronRight className="text-[var(--primary-main)] opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" size={24} />
                </button>
            </div>

            <div className="space-y-2 sm:space-y-4 pt-2">
                <p className="text-[10px] font-black text-[var(--text-main)] opacity-60 uppercase tracking-[0.4em] px-1 transition-colors">Statistical Overview</p>
                <div className="grid grid-cols-3 gap-1 sm:gap-3">
                    <SalesSummaryBox label="Today" value={`₱${salesToday.toLocaleString()}`} trend={getTrend(salesToday, salesYesterday)} trendPercent={getTrendPercent(salesToday, salesYesterday)} />
                    <SalesSummaryBox label="Yesterday" value={`₱${salesYesterday.toLocaleString()}`} trend="neutral" />
                    <SalesSummaryBox label="Week To Date" value={`₱${salesThisWeek.toLocaleString()}`} trend={getTrend(salesThisWeek, salesLastWeek)} trendPercent={getTrendPercent(salesThisWeek, salesLastWeek)} />
                </div>
            </div>

            <div className="bg-[var(--bg-card)] backdrop-blur-md p-3 sm:p-7 rounded-[1.5rem] sm:rounded-[3rem] border-2 border-[var(--border-color)] shadow-2xl transition-all duration-500">
                <div className="flex flex-row justify-between items-start sm:items-center gap-4 mb-2 sm:mb-8">
                    <div>
                        <p className="text-[9px] sm:text-[10px] font-black text-[var(--primary-main)] uppercase tracking-[0.2em] sm:mb-1 transition-colors">Market Analysis</p>
                        <h4 className="text-[10px] sm:text-base font-black text-[var(--text-main)] uppercase italic tracking-tighter">Product Demand breakdown</h4>
                    </div>
                    <div className="flex sm:gap-2 items-center bg-[var(--bg-system)] p-1.5 rounded-[1.25rem] border border-[var(--border-color)]">
                        <button onClick={() => setChartMode('volume')} className={`px-1 py-1 sm:px-4 sm:py-2 text-[7px] sm:text-[8px] font-black uppercase rounded-xl transition-all ${chartMode === 'volume' ? 'bg-[var(--bg-card)] shadow-md text-[var(--primary-main)]' : 'text-[var(--text-main)] opacity-40'}`}>Volume</button>
                        <button onClick={() => setChartMode('profit')} className={`px-1 py-1 sm:px-4 sm:py-2 text-[7px] sm:text-[8px] font-black uppercase rounded-xl transition-all ${chartMode === 'profit' ? 'bg-[var(--bg-card)] shadow-md text-[var(--primary-main)]' : 'text-[var(--text-main)] opacity-40'}`}>Profit</button>
                        <div className="w-px h-4 bg-[var(--border-color)] mx-1" />
                        <button onClick={handleTimePeriodClick} className="px-2 py-1 sm:px-4 sm:py-2 text-[7px] sm:text-[8px] font-black uppercase rounded-xl bg-[var(--primary-main)] text-white shadow-lg active:scale-95 transition-all">
                            {currentTimePeriod.label}
                        </button>
                    </div>
                </div>

                {chartData?.varietyBreakdown && chartData.varietyBreakdown.length > 0 ? (
                    <div className="flex flex-col md:flex-row items-center sm:gap-3">
                        <div className="w-full md:w-1/2 h-[240px]">
                            <ResponsiveContainer className="w-100% h-100%">
                                <PieChart>
                                    <Pie data={chartData.varietyBreakdown} dataKey={chartMode} nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={4} label={false}>
                                        {chartData.varietyBreakdown.map((_: any, idx: number) => (
                                            <Cell key={idx} fill={themeColors[idx % themeColors.length]} stroke="transparent" />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', background: 'var(--secondary-main)', color: '#fff', fontSize: '10px', fontWeight: '900' }} itemStyle={{ color: '#fff' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-full md:w-1/2 grid grid-cols-2 gap-1 sm:gap-3 max-h-[150px] sm:max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                            {chartData.varietyBreakdown.map((item: any, idx: number) => {
                                const total = chartData.varietyBreakdown.reduce((sum: number, v: any) => sum + (v[chartMode] || 0), 0);
                                const percent = total > 0 ? (((item[chartMode] || 0) / total) * 100).toFixed(0) : '0';
                                return (
                                    <div key={idx} className="flex items-center justify-between p-2 sm:p-4 bg-[var(--bg-system)] rounded-[1rem] sm:rounded-[1.5rem] border border-transparent hover:border-[var(--primary-main)]/50 hover:bg-[var(--bg-card)] transition-all duration-300">
                                        <div className="flex items-center gap-2 sm:gap-4">
                                            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full shadow-sm" style={{ backgroundColor: themeColors[idx % themeColors.length] }} />
                                            <p className="text-[9px] font-black text-[var(--text-main)] uppercase truncate max-w-[120px]">{item.name}</p>
                                        </div>
                                        <span className="text-[10px] sm:text-[11px] font-black text-[var(--primary-main)]">{percent}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="h-[200px] flex flex-col items-center justify-center text-[var(--secondary-main)] opacity-20 gap-3 italic transition-all">
                        <Database size={32} />
                        <p className="text-[10px] uppercase font-black tracking-[0.3em]">Querying variety metrics...</p>
                    </div>
                )}
            </div>

            <div className="bg-[var(--bg-card)] backdrop-blur-md p-3 sm:p-8 rounded-[1.5rem] sm:rounded-[3rem] border-2 border-[var(--border-color)] shadow-2xl transition-all duration-500">
                <div className="flex justify-between items-center mb-2 sm:mb-8">
                    <div>
                        <p className="text-[9px] sm:text-[10px] font-black text-[var(--primary-main)] uppercase tracking-[0.2em] mb-1 transition-colors">Financial Momentum</p>
                        <h4 className="text-[10px] sm:text-base font-black text-[var(--text-main)] uppercase italic tracking-tighter">Revenue Flow Trend</h4>
                    </div>
                    <button onClick={handleSalesTimePeriodClick} className="px-5 py-2 text-[9px] font-black uppercase tracking-[0.1em] rounded-xl bg-[var(--bg-accent)] text-[var(--secondary-main)] border border-[var(--primary-main)]/10 shadow-sm active:scale-95 transition-all">
                        {currentSalesTimePeriod.label}
                    </button>
                </div>
                {chartData?.monthlySales && chartData.monthlySales.length > 0 ? (
                    <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData.monthlySales}>
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: '900', fill: 'var(--text-main)', opacity: 0.3 }} tickFormatter={(d) => d?.slice(5) || ''} dy={15} />
                                <YAxis hide />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '20px', border: 'none', background: 'var(--secondary-main)', color: '#fff', fontSize: '10px', fontWeight: '900' }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(val) => [`₱${Number(val).toLocaleString()}`, 'Revenue']} 
                                />
                                <Line type="monotone" dataKey="total" stroke="var(--primary-main)" strokeWidth={5} dot={{ r: 5, fill: 'var(--bg-card)', strokeWidth: 3, stroke: 'var(--primary-main)' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-[180px] flex items-center justify-center text-[10px] font-black text-[var(--text-main)] opacity-20 uppercase tracking-[0.3em] italic transition-all">Mapping transactional history...</div>
                )}
            </div>

            {/* --- RECENT SALES / LIVE ACTIVITY HUB --- */}
            <div className="space-y-2 sm:space-y-4 pt-2 sm:pt-4">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    <h3 className="text-[10px] font-black text-[var(--secondary-main)] opacity-60 uppercase tracking-[0.4em] transition-colors">Live Activity Hub</h3>
                </div>
                {data?.recentSales?.map((sale: any, i: number) => {
                    // 🚀 CRITICAL CHECK: Block SUKI badge for Walked In Customers
                    const isTrulySuki = sale.isSuki && sale.customer?.toLowerCase().trim() !== 'walked in customer';

                    return (
                        <div key={i} className={`p-2 sm:p-5 rounded-[1rem] sm:rounded-[2.5rem] border-2 backdrop-blur-sm flex justify-between items-center shadow-xl transition-all duration-300 group hover:translate-x-2 ${sale.type === 'Utang' ? 'bg-red-50 border-red-100' : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--primary-main)]/30'}`}>
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-[8px] sm:text-[10px] font-black italic shrink-0 transition-all duration-500 ${sale.type === 'Utang' ? 'bg-red-100 text-red-600' : 'bg-[var(--bg-accent)] text-[var(--primary-main)] shadow-inner'}`}>
                                    #{sale.id}
                                </div>
                                <div>
                                    <p className="text-[12px] sm:text-sm font-black text-[var(--text-main)] leading-tight flex items-center gap-2 uppercase tracking-tight transition-all">
                                        {sale.rice}
                                        {/* 🚀 Render Badge ONLY if truly a recognized Suki customer */}
                                        {isTrulySuki && (
                                            <span className="bg-yellow-400 text-white text-[7px] px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full font-black tracking-tighter shadow-sm">SUKI</span>
                                        )}
                                    </p>
                                    <p className={`text-[8px] sm:text-[10px] font-black uppercase mt-1 tracking-wider transition-all ${sale.type === 'Utang' ? 'text-red-500' : 'text-[var(--text-main)] opacity-40'}`}>
                                        {sale.type} <span className="mx-1 opacity-20">•</span> {sale.customer}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`font-black text-[13px] sm:text-lg italic tracking-tighter transition-all ${sale.type === 'Utang' ? 'text-red-600' : 'text-[var(--text-main)]'}`}>{sale.price}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <UtangModal isOpen={isUtangModalOpen} closeModal={() => setIsUtangModalOpen(false)} />
        </div>
    );
};

export default Dashboard;