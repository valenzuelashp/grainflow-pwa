import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, Download, Users, Package, 
  CreditCard, TrendingUp, Trophy, Repeat, Weight, Banknote, FileText, CheckCircle, Clock, List, Calendar
} from 'lucide-react';
import { pdf } from '@react-pdf/renderer'; 
import PrintArchive from '../components/reports/PrintArchive';
import { generateCSV } from '../utils/reportGenerator';
import { getReport, getUser, getProducts } from '../services/api';

const DetailedArchive = () => {
  const { period } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  
  const [utangFilter, setUtangFilter] = useState<'current' | 'paid' | 'all'>('current');
  const [sukiRankBy, setSukiRankBy] = useState<'count' | 'kg' | 'spent'>('count');

  const [timeFilter, setTimeFilter] = useState<'all' | 'monthly'>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => { 
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); 
  }, [period]);

  const config = useMemo(() => {
    const sukiSub = sukiRankBy === 'count' ? 'Orders' : sukiRankBy === 'kg' ? 'KG' : 'Spent';
    switch (period) {
      case 'customers': return { title: 'Suki', sub: sukiSub, icon: Users, color: 'text-[var(--primary-main)]', bg: 'bg-[var(--bg-accent)]' };
      case 'inventory': return { title: 'Stock', sub: 'Audit', icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50' };
      case 'utang': return { title: 'Utang', sub: 'Archive', icon: CreditCard, color: 'text-red-600', bg: 'bg-red-50' };
      case 'top_products': return { title: 'Top', sub: 'Sales', icon: TrendingUp, color: 'text-[var(--secondary-main)]', bg: 'bg-[var(--bg-accent)]' };
      default: return { title: 'Archive', sub: 'Records', icon: Package, color: 'text-[var(--text-main)]', bg: 'bg-[var(--bg-system)]' };
    }
  }, [period, sukiRankBy]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setData([]); 
      try {
        const params = new URLSearchParams(searchParams);
        if (period === 'customers' && timeFilter === 'monthly') {
          params.set('month', selectedMonth.toString());
          params.set('year', selectedYear.toString());
        }
        if (period === 'top_products' && startDate && endDate) {
          params.set('start', startDate);
          params.set('end', endDate);
        }

        if (period === 'inventory') {
          const { ok, data: result } = await getProducts();
          const inventoryData = ok && Array.isArray(result) ? result : [];
          setData(inventoryData);
        } else {
          const reportType = period === 'customers' ? 'customers' : period === 'top_products' ? 'top_products' : period === 'utang' ? 'utang' : 'all';
          const { ok, data: result } = await getReport(reportType, params);
          const rawLedger = ok && result.ledger && result.ledger.length > 1 ? result.ledger.slice(1) : [];
          if (rawLedger.length === 0) {
            setData([]);
            setLoading(false);
            return;
          }

          if (period === 'customers') {
            const customerMap: Record<string, any> = {};
            rawLedger.forEach((row: any) => {
              const name = row[1] || ''; 
              const isWalkIn = name.toLowerCase().includes('walk') || name.toLowerCase().includes('in');
              if (!name || isWalkIn) return; 
              if (!customerMap[name]) customerMap[name] = { name, count: 0, totalKg: 0, totalSpent: 0 };
              customerMap[name].count += 1;
              customerMap[name].totalKg += parseFloat(row[3]) || 0; 
              const priceNum = typeof row[4] === 'string' ? parseFloat(row[4].replace(/[^\d.-]/g, '')) : (parseFloat(row[4]) || 0);
              customerMap[name].totalSpent += priceNum;
            });
            const sorted = Object.values(customerMap).sort((a: any, b: any) => {
                if (sukiRankBy === 'count') return b.count - a.count;
                if (sukiRankBy === 'kg') return b.totalKg - a.totalKg;
                return b.totalSpent - a.totalSpent;
            });
            setData(sorted.slice(0, 20));
          } else if (period === 'top_products') {
            const productMap: Record<string, any> = {};
            rawLedger.forEach((row: any) => {
              const rice = row[2]; 
              if (!productMap[rice]) productMap[rice] = { rice, count: 0, totalKg: 0 };
              productMap[rice].count += 1;
              productMap[rice].totalKg += parseFloat(row[3]) || 0;
            });
            setData(Object.values(productMap).sort((a: any, b: any) => b.totalKg - a.totalKg).slice(0, 20));
          } else if (period === 'utang') {
            const utangRecords = rawLedger.filter((row: any) => {
              const method = row[5]?.toLowerCase() || '';
              const createdAt = row[7];
              const updatedAt = row[8];
              const isPaid = updatedAt && createdAt && updatedAt !== createdAt && method !== 'utang';
              const isUnpaid = method.includes('utang') || method.includes('credit');
              if (utangFilter === 'current') return isUnpaid;
              if (utangFilter === 'paid') return isPaid;
              return isUnpaid || isPaid; 
            }).sort((a: any, b: any) => b[0].toString().localeCompare(a[0].toString(), undefined, { numeric: true }));
            setData(utangRecords);
          } else {
            setData(rawLedger);
          }
        }
      } catch (error) {
        console.error("Fetch Error:", error); 
        setData([]);
      } finally { setLoading(false); }
    };
    fetchData();
  }, [period, searchParams, sukiRankBy, utangFilter, timeFilter, selectedMonth, selectedYear, startDate, endDate]);

  const filteredData = useMemo(() => {
    return data.filter(row => {
      const searchField = row.rice_variety || row.productName || row.name || row.rice || row[1] || "";
      return searchField.toString().toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [data, searchTerm]);

  const handleExportPDF = async () => {
    if (isExportDisabled) return;
    setIsExporting(true);
    try {
      const { ok, data: profile } = await getUser();
      if (!ok) return;
      const doc = (
        <PrintArchive 
          period={period || ''} 
          data={filteredData} 
          profile={profile} 
          title={config.title}
          rankBy={sukiRankBy}
          timeFilter={period === 'inventory' ? 'all' : timeFilter}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          months={months} 
          startDate={startDate}
          endDate={endDate}
          filters={{ utangFilter, sukiRankBy, timeFilter }} 
        />
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `GrainFlow_${period}_Archive.pdf`;
      link.click();
    } catch (err) { console.error(err); } finally { setIsExporting(false); }
  };

  const handleDownloadCSV = () => {
    if (filteredData.length === 0) return;
    let headers: string[] = [];
    let csvRows: any[][] = [];
    if (period === 'customers') {
      headers = ["Customer Name", "Total Orders", "Total Weight (kg)", "Total Spent (PHP)"];
      csvRows = filteredData.map(item => [item.name, item.count, item.totalKg, item.totalSpent]);
    } else if (period === 'inventory') {
      headers = ["Rice Variety", "Stock Quantity (kg)", "Price per kg"];
      csvRows = filteredData.map(item => [item.name || item.productName || item.rice_variety, item.stockQuantity || item.stock_quantity || item.stock, item.pricePerUnit || item.price_per_kg || item.price]);
    } else if (period === 'top_products') {
      headers = ["Rice Variety", "Total Sales Count", "Total Weight Sold (kg)"];
      csvRows = filteredData.map(item => [item.rice, item.count, item.totalKg]);
    } else {
      headers = ["ID", "Customer", "Rice", "Qty", "Amount", "Method", "Date"];
      csvRows = filteredData.map(row => Array.isArray(row) ? [row[0], row[1], row[2], row[3], row[4], row[5], row[6]] : []);
    }
    generateCSV(headers, csvRows, `GrainFlow_${period}_Archive`);
  };

  const Podium = ({ items, type }: { items: any[], type: 'suki' | 'rice' }) => {
    if (items.length < 1) return null;
    const pData = [items[1], items[0], items[2]].filter(i => i !== undefined);
    return (
      <div className="flex items-end justify-center gap-2 sm:gap-4 mb-8 mt-4 px-1">
        {pData.map((item, idx) => {
          const isFirst = (items.length > 1 && idx === 1) || (items.length === 1 && idx === 0);
          const isThird = idx === 2;
          const rank = isFirst ? 1 : (idx === 0 && items.length > 1 ? 2 : 3);
          return (
            <div key={idx} className="flex flex-col items-center flex-1 max-w-[140px]">
              <div className={`w-full bg-[var(--bg-card)]/90 backdrop-blur-md border-2 rounded-[2rem] shadow-lg flex flex-col items-center p-2 sm:p-4 relative transition-all duration-500 ${isFirst ? 'h-52 sm:h-64 border-yellow-400 z-10' : isThird ? 'h-36 sm:h-44 border-[var(--border-color)]' : 'h-44 sm:h-52 border-[var(--primary-main)]/20'}`}>
                <div className={`absolute -top-3 sm:-top-4 w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white shadow-xl transition-colors duration-500 ${isFirst ? 'bg-yellow-500 scale-110' : rank === 2 ? 'bg-[var(--primary-main)]' : 'bg-[var(--secondary-main)] opacity-50'}`}>
                  {isFirst ? <Trophy size={14} /> : <span className="font-black text-xs">{rank}</span>}
                </div>
                <div className="mt-4 text-center">
                    <p className="text-[10px] sm:text-xs font-black uppercase text-[var(--text-main)] line-clamp-2 leading-tight">{type === 'suki' ? item.name : item.rice}</p>
                </div>
                <div className="mt-auto flex flex-col items-center gap-0.5 mb-1 text-center">
                    {type === 'suki' ? (
                        <>
                            {sukiRankBy === 'count' && <p className="text-[10px] sm:text-xs font-black italic text-[var(--primary-main)] leading-none">{item.count} Orders</p>}
                            {sukiRankBy === 'kg' && <p className="text-[10px] sm:text-xs font-black italic text-[var(--primary-main)] leading-none">{item.totalKg}kg</p>}
                            {sukiRankBy === 'spent' && <p className="text-[10px] sm:text-xs font-black italic text-[var(--primary-main)] leading-none">₱{Number(item.totalSpent).toLocaleString()}</p>}
                        </>
                    ) : (
                        <p className="text-[9px] sm:text-[11px] font-black italic text-[var(--text-main)] leading-none">{item.totalKg}kg</p>
                    )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const isRankingReport = period === 'customers' || period === 'top_products';
  const isExportDisabled = loading || filteredData.length === 0;

  return (
    <div className="min-h-screen relative font-sans bg-[var(--bg-system)] bg-fixed bg-cover bg-bottom transition-colors duration-500" style={{ 
      backgroundImage: `linear-gradient(var(--bg-overlay), var(--bg-overlay)), url('/rice.png')` }}>
      
      {/* FORCED STICKY HEADER - Pinned to the top of the viewport */}
      <div className="sticky top-0 z-[100] bg-[var(--bg-card)]/70 backdrop-blur-md border-b border-[var(--border-color)] px-3 py-2 shadow-sm transition-all duration-500">
        <div className="max-w-5xl mx-auto">
          
          {/* DESKTOP VIEW */}
          <div className="hidden sm:flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button onClick={() => navigate(-1)} className="p-2 text-[var(--secondary-main)] hover:bg-[var(--bg-accent)] rounded-xl transition-all">
                <ArrowLeft size={20} strokeWidth={3} />
              </button>
              <div className="flex flex-col">
                <h2 className="text-base font-black uppercase text-[var(--text-main)] leading-none tracking-tight transition-colors">{config.title}</h2>
                <p className="text-[8px] font-bold text-[var(--primary-main)] uppercase tracking-widest transition-colors">{config.sub}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-1">
              {period === 'customers' && (
                <>
                  <div className="flex bg-[var(--bg-system)] p-0.5 rounded-lg border border-[var(--border-color)]">
                    <button onClick={() => setTimeFilter('all')} className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${timeFilter === 'all' ? 'bg-[var(--bg-card)] shadow-sm text-[var(--primary-main)]' : 'text-stone-400'}`}>All Time</button>
                    <button onClick={() => setTimeFilter('monthly')} className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${timeFilter === 'monthly' ? 'bg-[var(--bg-card)] shadow-sm text-[var(--primary-main)]' : 'text-stone-400'}`}>Monthly</button>
                  </div>
                  {timeFilter === 'monthly' && (
                    <div className="flex items-center gap-1">
                      <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-1.5 py-1 text-[9px] font-black uppercase outline-none text-[var(--text-main)] transition-colors">
                        {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                      </select>
                      <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-1.5 py-1 text-[9px] font-black uppercase outline-none text-[var(--text-main)] transition-colors">
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="flex bg-[var(--bg-system)] p-0.5 rounded-lg border border-[var(--border-color)] ml-auto">
                    <button onClick={() => setSukiRankBy('count')} className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-all ${sukiRankBy === 'count' ? 'bg-[var(--bg-card)] shadow-sm text-[var(--primary-main)]' : 'text-stone-400'}`}><Repeat size={10} /><span className="text-[9px] font-black uppercase">Orders</span></button>
                    <button onClick={() => setSukiRankBy('kg')} className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-all ${sukiRankBy === 'kg' ? 'bg-[var(--bg-card)] shadow-sm text-[var(--primary-main)]' : 'text-stone-400'}`}><Weight size={10} /><span className="text-[9px] font-black uppercase">Volume</span></button>
                    <button onClick={() => setSukiRankBy('spent')} className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-all ${sukiRankBy === 'spent' ? 'bg-[var(--bg-card)] shadow-sm text-[var(--primary-main)]' : 'text-stone-400'}`}><Banknote size={10} /><span className="text-[9px] font-black uppercase">Spent</span></button>
                  </div>
                </>
              )}

              {period === 'top_products' && (
                <div className="flex items-center gap-1.5 bg-[var(--bg-system)] p-0.5 rounded-lg border border-[var(--border-color)] ml-auto">
                   <div className="flex items-center gap-1 px-1.5">
                      <Calendar size={10} className="text-[var(--primary-main)] opacity-50" />
                      <span className="text-[8px] font-black uppercase text-[var(--secondary-main)]">Range:</span>
                   </div>
                   <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-[var(--bg-card)] border-none rounded-md px-1 py-0.5 text-[9px] font-black outline-none w-24 text-[var(--text-main)]" />
                   <span className="text-[8px] font-black text-[var(--text-main)] opacity-20">TO</span>
                   <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-[var(--bg-card)] border-none rounded-md px-1 py-0.5 text-[9px] font-black outline-none w-24 text-[var(--text-main)]" />
                </div>
              )}

              {period === 'utang' && (
                <div className="flex bg-[var(--bg-system)] p-0.5 rounded-lg border border-[var(--border-color)] ml-auto">
                  <button onClick={() => setUtangFilter('current')} className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${utangFilter === 'current' ? 'bg-[var(--bg-card)] shadow-sm text-red-600' : 'text-stone-400'}`}><Clock size={12} /><span className="text-[9px] font-black uppercase">Unpaid</span></button>
                  <button onClick={() => setUtangFilter('paid')} className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${utangFilter === 'paid' ? 'bg-[var(--bg-card)] shadow-sm text-emerald-600' : 'text-stone-400'}`}><CheckCircle size={12} /><span className="text-[9px] font-black uppercase">Paid</span></button>
                  <button onClick={() => setUtangFilter('all')} className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${utangFilter === 'all' ? 'bg-[var(--bg-card)] shadow-sm text-[var(--text-main)]' : 'text-stone-400'}`}><List size={12} /><span className="text-[9px] font-black uppercase">All</span></button>
                </div>
              )}

              <div className="relative w-48 ml-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--primary-main)] opacity-40" size={14} />
                <input type="text" placeholder="Quick Search..." className="w-full pl-9 pr-3 py-2 bg-[var(--bg-system)] border border-[var(--border-color)] rounded-xl outline-none font-black text-[11px] text-[var(--text-main)] focus:ring-1 focus:ring-[var(--primary-main)]/30 transition-all placeholder-[var(--text-main)]/20" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
               <button onClick={handleDownloadCSV} disabled={isExportDisabled} className={`p-2 rounded-xl border transition-all ${isExportDisabled ? 'text-stone-300 border-stone-100' : 'text-[var(--primary-main)] bg-[var(--bg-accent)] border-[var(--primary-main)]/20 hover:bg-[var(--primary-main)] hover:text-white'}`}><FileText size={18} /></button>
               <button onClick={handleExportPDF} disabled={isExportDisabled || isExporting} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-black text-[10px] uppercase tracking-wider ${isExportDisabled || isExporting ? 'bg-[var(--bg-system)] text-stone-300' : 'bg-[var(--text-main)] text-[var(--bg-card)] shadow-lg shadow-black/10 hover:scale-[1.02]'}`}>
                {isExporting ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Download size={14} /> PDF</>}
               </button>
            </div>
          </div>

          {/* MOBILE VIEW */}
          <div className="flex sm:hidden flex-col gap-2">
            {period === 'customers' ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => navigate(-1)} className="p-2 text-[var(--secondary-main)] hover:bg-[var(--bg-accent)] rounded-xl transition-all"><ArrowLeft size={18} strokeWidth={3} /></button>
                    <div className="flex flex-col"><h2 className="text-xs font-black uppercase text-[var(--text-main)] leading-none transition-colors">Suki</h2><p className="text-[7px] font-bold text-[var(--primary-main)] uppercase transition-colors">Orders</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex bg-[var(--bg-system)] p-0.5 rounded-lg border border-[var(--border-color)]">
                      <button onClick={() => setTimeFilter('all')} className={`px-2 py-1 rounded-md text-[8px] font-black uppercase transition-all ${timeFilter === 'all' ? 'bg-[var(--bg-card)] shadow-sm text-[var(--primary-main)]' : 'text-stone-400'}`}>All Time</button>
                      <button onClick={() => setTimeFilter('monthly')} className={`px-2 py-1 rounded-md text-[8px] font-black uppercase transition-all ${timeFilter === 'monthly' ? 'bg-[var(--bg-card)] shadow-sm text-[var(--primary-main)]' : 'text-stone-400'}`}>Monthly</button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex bg-[var(--bg-system)] p-0.5 rounded-lg border border-[var(--border-color)] shrink-0">
                    <button onClick={() => setSukiRankBy('count')} className={`px-2 py-1 rounded-md flex items-center gap-1 transition-colors ${sukiRankBy === 'count' ? 'bg-[var(--bg-card)] text-[var(--primary-main)] shadow-sm' : 'text-stone-400'}`}><Repeat size={9} /><span className="text-[8px] font-black uppercase">Orders</span></button>
                    <button onClick={() => setSukiRankBy('kg')} className={`px-2 py-1 rounded-md flex items-center gap-1 transition-colors ${sukiRankBy === 'kg' ? 'bg-[var(--bg-card)] text-[var(--primary-main)] shadow-sm' : 'text-stone-400'}`}><Weight size={9} /><span className="text-[8px] font-black uppercase">Volume</span></button>
                    <button onClick={() => setSukiRankBy('spent')} className={`px-2 py-1 rounded-md flex items-center gap-1 transition-colors ${sukiRankBy === 'spent' ? 'bg-[var(--bg-card)] text-[var(--primary-main)] shadow-sm' : 'text-stone-400'}`}><Banknote size={9} /><span className="text-[8px] font-black uppercase">Spent</span></button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={handleDownloadCSV} disabled={isExportDisabled} className="p-1.5 rounded-lg border border-[var(--border-color)] text-[var(--primary-main)] bg-[var(--bg-card)]"><FileText size={14} /></button>
                    <button onClick={handleExportPDF} disabled={isExportDisabled} className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[var(--text-main)] text-[var(--bg-card)] font-black text-[8px] uppercase"><Download size={10} /> PDF</button>
                  </div>
                </div>
              </>
            ) : period === 'top_products' ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => navigate(-1)} className="p-2 text-[var(--secondary-main)] hover:bg-[var(--bg-accent)] rounded-xl transition-all"><ArrowLeft size={18} strokeWidth={3} /></button>
                    <div className="flex flex-col"><h2 className="text-xs font-black uppercase text-[var(--text-main)] leading-none transition-colors">Top Sales</h2><p className="text-[7px] font-bold text-[var(--secondary-main)] uppercase tracking-widest transition-colors">Range</p></div>
                  </div>
                  <div className="flex items-center gap-1 bg-[var(--bg-system)] p-1 rounded-lg border border-[var(--border-color)]">
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-[var(--bg-card)] border-none rounded-md px-1 py-0.5 text-[8px] font-black outline-none w-20 text-[var(--text-main)]" />
                    <span className="text-[8px] font-black text-stone-300">TO</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-[var(--bg-card)] border-none rounded-md px-1 py-0.5 text-[8px] font-black outline-none w-20 text-[var(--text-main)]" />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-1.5">
                    <button onClick={handleDownloadCSV} disabled={isExportDisabled} className="p-1.5 rounded-lg border border-[var(--border-color)] text-[var(--primary-main)] bg-[var(--bg-card)]"><FileText size={14} /></button>
                    <button onClick={handleExportPDF} disabled={isExportDisabled} className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[var(--text-main)] text-[var(--bg-card)] font-black text-[8px] uppercase"><Download size={10} /> PDF</button>
                </div>
              </>
            ) : (
               <div className="flex flex-col gap-2">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button onClick={() => navigate(-1)} className="p-2 text-[var(--secondary-main)] hover:bg-[var(--bg-accent)] rounded-xl transition-all"><ArrowLeft size={18} strokeWidth={3} /></button>
                        <h2 className="text-xs font-black uppercase text-[var(--text-main)] transition-colors">{config.title}</h2>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button onClick={handleDownloadCSV} disabled={isExportDisabled} className="p-1.5 rounded-lg border border-[var(--border-color)] text-[var(--primary-main)] bg-[var(--bg-card)]"><FileText size={14} /></button>
                        <button onClick={handleExportPDF} disabled={isExportDisabled} className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[var(--text-main)] text-[var(--bg-card)] font-black text-[8px] uppercase"><Download size={10} /> PDF</button>
                    </div>
                 </div>
                 {period === 'utang' && (
                    <div className="flex bg-[var(--bg-system)] p-0.5 rounded-lg border border-[var(--border-color)]">
                        <button onClick={() => setUtangFilter('current')} className={`flex-1 px-2 py-1.5 rounded-md text-[8px] font-black uppercase transition-all ${utangFilter === 'current' ? 'bg-[var(--bg-card)] shadow-sm text-red-600' : 'text-stone-400'}`}>Unpaid</button>
                        <button onClick={() => setUtangFilter('paid')} className={`flex-1 px-2 py-1.5 rounded-md text-[8px] font-black uppercase transition-all ${utangFilter === 'paid' ? 'bg-[var(--bg-card)] shadow-sm text-emerald-600' : 'text-stone-400'}`}>Paid</button>
                        <button onClick={() => setUtangFilter('all')} className={`flex-1 px-2 py-1.5 rounded-md text-[8px] font-black uppercase transition-all ${utangFilter === 'all' ? 'bg-[var(--bg-card)] shadow-sm text-[var(--text-main)]' : 'text-stone-400'}`}>All</button>
                    </div>
                 )}
               </div>
            )}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--primary-main)] opacity-30" size={12} />
              <input type="text" placeholder="Quick Search..." className="w-full pl-8 pr-3 py-2 bg-[var(--bg-system)] border border-[var(--border-color)] rounded-xl outline-none font-black text-[10px] text-[var(--text-main)] transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT AREA - Natural scroll, no internal scrollbar */}
      <div className="p-3 sm:p-4 max-w-5xl mx-auto transition-all duration-500">
        {loading ? (
          <div className="py-40 text-center"><div className="w-10 h-10 border-4 border-[var(--primary-main)] border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-[9px] font-black uppercase text-[var(--secondary-main)] tracking-[0.2em] transition-colors">Synchronizing...</p></div>
        ) : (
          <>
            {isRankingReport && filteredData.length > 0 && <Podium items={filteredData.slice(0, 3)} type={period === 'customers' ? 'suki' : 'rice'} />}
            {filteredData.length === 0 ? (
              <div className="py-40 text-center opacity-30 italic font-black text-xs uppercase tracking-widest text-[var(--text-main)]">No Data Found</div>
            ) : period === 'utang' ? (
              <div className="space-y-3">
                {filteredData.map((row, idx) => {
                  const isPaidLater = row[8] && row[7] && row[8] !== row[7] && row[5]?.toLowerCase() !== 'utang';
                  const transactionDate = row[6] || "N/A";
                  const paidDateDetail = row[8] ? new Date(row[8]).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : "N/A";
                  return (
                    <div key={idx} className="bg-[var(--bg-card)]/90 backdrop-blur-md p-5 rounded-2xl border border-[var(--border-color)] shadow-sm flex items-center justify-between transition-all">
                      <div className="flex gap-4 items-center">
                        <span className="text-[9px] font-black text-[var(--secondary-main)] opacity-40 bg-[var(--bg-system)] px-2 py-1 rounded-lg border border-[var(--border-color)]">#{row[0]?.split('-')[1] || row[0]}</span>
                        <div><h4 className="text-xs font-black uppercase text-[var(--text-main)]">{row[1]}</h4><p className="text-[10px] font-bold text-[var(--secondary-main)] opacity-50 uppercase">{row[2]} • {row[3]}</p></div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black italic text-[var(--text-main)]">₱{row[4]}</p>
                        <div className="flex flex-col items-end gap-1 mt-1">
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border inline-block ${isPaidLater ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>{isPaidLater ? row[5] : 'Unpaid'}</span>
                          <div className="text-right"><p className="text-[7px] font-black text-stone-400 uppercase tracking-tighter line-clamp-1">Ordered: {transactionDate}</p>{isPaidLater && <p className="text-[7px] font-black text-emerald-600 uppercase tracking-tighter line-clamp-1">Paid: {paidDateDetail}</p>}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredData.map((item, idx) => {
                  const isTopThree = idx < 3 && isRankingReport;
                  if (isTopThree) return null;
                  const riceName = item.rice_variety || item.productName || item.name || item.rice || "N/A";
                  const stock = item.stock_quantity ?? item.stockQuantity ?? item.stock ?? 0;
                  const price = item.price_per_kg ?? item.pricePerKg ?? item.price ?? 0;
                  return (
                    <div key={idx} className="bg-[var(--bg-card)]/90 backdrop-blur-md p-4 rounded-[1.5rem] border border-[var(--border-color)] shadow-sm flex items-center justify-between hover:border-[var(--primary-main)]/30 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-[10px] transition-colors duration-500 ${isRankingReport ? 'bg-[var(--bg-system)] text-[var(--secondary-main)]' : 'bg-emerald-50 text-emerald-600'}`}>{isRankingReport ? idx + 1 : <config.icon size={14}/>}</div>
                        <div><h4 className="text-[12px] font-black uppercase text-[var(--text-main)] leading-tight line-clamp-1 italic">{riceName}</h4><p className="text-[8px] font-bold text-[var(--secondary-main)] opacity-40 uppercase tracking-widest">{period === 'inventory' ? `P${price}/kg` : period === 'customers' ? `Suki Masterlist` : 'Audit Record'}</p></div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-[12px] font-black italic leading-none transition-colors ${period === 'customers' ? 'text-[var(--primary-main)]' : 'text-[var(--text-main)]'}`}>{period === 'inventory' ? `${stock}kg` : period === 'customers' ? (sukiRankBy === 'count' ? `${item.count} Orders` : sukiRankBy === 'kg' ? `${item.totalKg} kg` : `₱${Number(item.totalSpent).toLocaleString()}`) : (`${item.totalKg || item.count} ${period === 'top_products' ? 'kg' : 'Orders'}`)}</p>
                        {period === 'inventory' && <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full border mt-2 inline-block transition-all shadow-sm ${stock > 25 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>{stock > 25 ? 'Healthy' : 'Low'}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DetailedArchive;