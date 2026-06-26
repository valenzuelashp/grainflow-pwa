import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer'; 
import AllSalesReport from '../components/reports/AllSalesReport'; 
import { generateCSV } from '../utils/reportGenerator';
import { 
  ArrowLeft, Clock, 
  TrendingUp, ChevronRight, Download, Search, Calendar, FileText
} from 'lucide-react';
import { getReport, getUser } from '../services/api';

const FilteredSales = () => {
  const { period } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Adjusted for standard mobile top bars
  const MAIN_HEADER_HEIGHT = "0px"; 

  const config = useMemo(() => {
    const now = new Date();
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(now.getDate() - 1);
    const yesterdayStr = yesterdayDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const currentMonthStr = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const currentDay = now.getDay();
    const sunDate = new Date(now);
    sunDate.setDate(now.getDate() - currentDay);
    const satDate = new Date(sunDate);
    satDate.setDate(sunDate.getDate() + 6);

    const sun = sunDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const sat = satDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const titles: Record<string, any> = {
      today: { title: 'Today', date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), icon: Clock, color: 'text-[var(--text-main)]', bg: 'bg-[var(--bg-accent)]' },
      yesterday: { title: 'Yesterday', date: yesterdayStr, icon: Calendar, color: 'text-[var(--secondary-main)]', bg: 'bg-[var(--bg-system)]' },
      week: { title: 'This Week', date: `${sun}-${sat}`, icon: TrendingUp, color: 'text-[var(--secondary-main)]', bg: 'bg-[var(--bg-system)]' },
      month: { title: 'This Month', date: currentMonthStr, icon: Calendar, color: 'text-[var(--secondary-main)]', bg: 'bg-[var(--bg-system)]' },
    };
    return titles[period || ''] || { title: period?.toUpperCase(), date: 'Records', icon: Clock, color: 'text-[var(--secondary-main)]', bg: 'bg-[var(--bg-system)]' };
  }, [period]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    const fetchData = async () => {
      setLoading(true);
      let params = "";
      const now = new Date();

      const toLocalISO = (date: Date) => {
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
      };

      if (period === 'week') {
        const sun = new Date(now);
        sun.setDate(now.getDate() - now.getDay());
        const sat = new Date(sun);
        sat.setDate(sun.getDate() + 6);
        params = `?start=${toLocalISO(sun)}&end=${toLocalISO(sat)}`;
      } else if (period === 'month') {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        params = `?start=${toLocalISO(firstDay)}&end=${toLocalISO(lastDay)}`;
      }

      try {
        const searchParams = new URLSearchParams(params.replace('?', ''));
        const { ok, data: result } = await getReport(period || 'today', searchParams);
        const rawData = ok && result.ledger ? result.ledger.slice(1) : [];
        setData(rawData.sort((a: any[], b: any[]) => b[0].toString().localeCompare(a[0].toString(), undefined, { numeric: true, sensitivity: 'base' })));

        const profileRes = await getUser();
        if (profileRes.ok) setProfile(profileRes.data);
      } catch (error) {
        console.error("Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  const filteredData = useMemo(() => {
    return data.filter(row => 
      row[0]?.toString().toLowerCase().includes(searchTerm.toLowerCase()) || 
      row[1]?.toString().toLowerCase().includes(searchTerm.toLowerCase()) || 
      row[2]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const handleDownloadCSV = () => {
    if (filteredData.length === 0) return;
    const headers = ["ID", "Customer Name", "Rice Variety", "Qty (KG)", "Total Amount", "Method", "Date & Time"];
    const csvRows = filteredData.map(row => [row[0], row[1], row[2], row[3], row[4]?.toString().replace(/[^\d.]/g, '') || '0', row[5], row[6]]);
    generateCSV(headers, csvRows, `GrainFlow-${config.title}-${config.date.replace(/[/ ,]/g, '-')}`);
  };

  const isExportDisabled = loading || filteredData.length === 0;

  return (
  <div 
    className="min-h-screen text-left font-sans bg-[var(--bg-system)] bg-fixed bg-cover bg-bottom transition-colors duration-500"
    style={{ backgroundImage: `linear-gradient(var(--bg-overlay), var(--bg-overlay)), url('/rice.png')` }}
  >
    {/* --- STICKY SECONDARY HEADER --- */}
    <div 
      style={{ top: MAIN_HEADER_HEIGHT }} // Pins it exactly below the main header
      className="fixed w-full right-0 left-0 z-30 bg-[var(--bg-card)]/80 backdrop-blur-lg border-b border-[var(--border-color)] px-4 py-3 shadow-sm transition-all duration-500"
    >
        <div className="w-full flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6 max-w-[1600px] mx-auto">
          
          {/* Navigation & Title Group */}
          <div className="flex items-center justify-between lg:justify-start gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/reports')} className="p-2 text-[var(--secondary-main)] hover:text-[var(--primary-main)] transition-colors shrink-0 bg-[var(--bg-card)]/50 rounded-xl border border-[var(--border-color)] active:scale-90">
                <ArrowLeft size={18} strokeWidth={2.5} />
              </button>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <h2 className="text-sm font-black text-[var(--text-main)] uppercase tracking-tight italic">{config.title}</h2>
                <span className="text-[9px] font-bold text-[var(--secondary-main)] opacity-50 uppercase tracking-tighter sm:border-l sm:pl-2 border-[var(--border-color)] line-clamp-1">{config.date}</span>
              </div>
            </div>
            
            {/* Mobile-only Entries Count */}
            <div className="lg:hidden px-2 py-1 bg-[var(--secondary-main)] text-[var(--bg-accent)] rounded-lg text-[10px] font-black">
              {filteredData.length}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--secondary-main)] opacity-30 group-focus-within:text-[var(--primary-main)] transition-colors" size={14} />
            <input 
              type="text"
              placeholder="Filter these records..."
              className="w-full bg-[var(--bg-system)]/50 border-2 border-[var(--border-color)] rounded-xl py-2.5 pl-10 pr-4 text-xs font-black text-[var(--text-main)] focus:bg-[var(--bg-card)] focus:ring-4 focus:ring-[var(--primary-main)]/10 focus:border-[var(--primary-main)] transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Desktop-only Entries Count */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-[var(--bg-accent)]/30 rounded-xl border border-[var(--primary-main)]/10 backdrop-blur-sm">
                <span className="text-[9px] font-black uppercase text-[var(--secondary-main)] opacity-50 tracking-widest">Row Count:</span>
                <span className="text-xs font-black text-[var(--text-main)]">{filteredData.length}</span>
            </div>

            <button 
              onClick={handleDownloadCSV}
              disabled={isExportDisabled}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 text-[10px] font-black uppercase border ${
                isExportDisabled ? 'bg-stone-100 text-stone-300' : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-main)] hover:border-[var(--primary-main)]/50'
              }`}
            >
              <FileText size={16} className="text-blue-500" /> CSV
            </button>

            {!loading && profile && filteredData.length > 0 ? (
              <PDFDownloadLink
                className="flex-1 lg:flex-none"
                document={<AllSalesReport title={`${config.title} Report`} dateLabel={config.date} rows={filteredData} profile={profile} />}
                fileName={`GrainFlow-${config.title}-${config.date.replace(/[/ ,]/g, '-')}.pdf`}
              >
                {({ loading: pdfLoading }) => (
                  <button className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary-main)] text-white rounded-xl active:scale-95 shadow-lg border-b-4 border-black/10 ${pdfLoading ? 'opacity-50 cursor-wait' : ''}`}>
                    <Download size={16} />
                    <span className="text-[10px] font-black uppercase tracking-wider">{pdfLoading ? '...' : 'PDF'}</span>
                  </button>
                )}
              </PDFDownloadLink>
            ) : (
               <button disabled className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-100 text-stone-400 rounded-xl cursor-not-allowed border-transparent text-[10px] font-black uppercase">
                 <Download size={16} /> PDF
               </button>
            )}
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="p-3 sm:p-6 w-full mx-auto max-w-[1600px] transition-all">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 border-4 border-[var(--primary-main)]/20 border-t-[var(--primary-main)] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase text-[var(--secondary-main)] opacity-40 tracking-[0.2em]">Filtering Records...</p>
          </div>
        ) : (
          <>
            {/* MOBILE LIST VIEW */}
            <div className="block md:hidden space-y-3">
               {filteredData.length === 0 ? (
                  <div className="py-20 text-center text-[10px] font-black text-[var(--text-main)] opacity-20 uppercase italic tracking-[0.3em]">No records in this scope</div>
               ) : (
                  filteredData.map((row, idx) => (
                    <div key={idx} className="bg-[var(--bg-card)]/90 backdrop-blur-md rounded-[2rem] p-4 border border-[var(--border-color)] shadow-xl space-y-3 active:scale-[0.98] transition-all">
                        <div className="flex justify-between items-start">
                            <span className="bg-[var(--bg-system)] text-[var(--secondary-main)] opacity-60 text-[9px] font-black px-2 py-0.5 rounded-lg border border-[var(--border-color)] uppercase tracking-tighter">
                                ID: {row[0]?.includes('-') ? row[0].split('-')[1] : row[0]}
                            </span>
                            <span className="text-[9px] font-black text-[var(--secondary-main)] opacity-30 uppercase">{row[6]}</span>
                        </div>
                        <div>
                            <p className="text-sm font-black text-[var(--text-main)] uppercase italic leading-tight tracking-tight">{row[1]}</p>
                            <p className="text-[10px] font-black text-[var(--secondary-main)] opacity-50 uppercase mt-1">{row[2]} <span className="mx-1">•</span> {row[3]} KG</p>
                        </div>
                        <div className="flex justify-between items-end pt-3 border-t border-[var(--border-color)]/50">
                            <div>
                                <p className="text-[8px] font-black text-[var(--secondary-main)] opacity-30 uppercase tracking-[0.2em] mb-1">Settlement</p>
                                <p className="text-lg font-black text-[var(--text-main)] italic leading-none">₱{row[4]}</p>
                            </div>
                            <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-full border shadow-sm ${row[5]?.toLowerCase().includes('utang') ? 'bg-red-50 text-red-600 border-red-100' : 'bg-[var(--bg-accent)] text-[var(--primary-main)] border-[var(--primary-main)]/10'}`}>
                                {row[5]}
                            </span>
                        </div>
                    </div>
                  ))
               )}
            </div>

            {/* DESKTOP TABLE VIEW */}
            <div className="hidden md:block bg-[var(--bg-card)]/90 backdrop-blur-md rounded-[2.5rem] border border-[var(--border-color)] shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[var(--bg-accent)]/30 border-b border-[var(--border-color)]">
                      <th className="px-8 py-5 text-[10px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-[0.25em] text-center">Ref ID</th>
                      <th className="px-8 py-5 text-[10px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-[0.25em] text-center">Customer</th>
                      <th className="px-8 py-5 text-[10px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-[0.25em] text-center">Variety</th>
                      <th className="px-8 py-5 text-[10px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-[0.25em] text-center">Kg</th>
                      <th className="px-8 py-5 text-[10px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-[0.25em] text-center">Price</th>
                      <th className="px-8 py-5 text-[10px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-[0.25em] text-center">Payment</th>
                      <th className="px-8 py-5 text-[10px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-[0.25em] text-center">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]/50">
                    {filteredData.length === 0 ? (
                      <tr><td colSpan={7} className="py-32 text-center text-[11px] font-black text-[var(--text-main)] opacity-20 uppercase italic tracking-[0.4em]">Empty Data</td></tr>
                    ) : (
                      filteredData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-[var(--bg-accent)]/20 transition-colors group">
                          <td className="px-8 py-4 text-center"><span className="text-[10px] font-black text-[var(--secondary-main)] opacity-50 font-mono">#{row[0]?.includes('-') ? row[0].split('-')[1] : row[0]}</span></td>
                          <td className="px-8 py-4 text-center text-[13px] font-black text-[var(--text-main)] uppercase italic tracking-tight">{row[1]}</td>
                          <td className="px-8 py-4 text-center text-[12px] font-black text-[var(--secondary-main)] opacity-80 uppercase">{row[2]}</td>
                          <td className="px-8 py-4 text-center"><span className="bg-[var(--bg-system)] border border-[var(--border-color)] px-3 py-1 rounded-lg text-[11px] font-black text-[var(--text-main)]">{row[3]}</span></td>
                          <td className="px-8 py-4 text-center text-[15px] font-black italic text-[var(--primary-main)]">₱{row[4]}</td>
                          <td className="px-8 py-4 text-center">
                            <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border shadow-sm ${row[5]?.toLowerCase().includes('utang') ? 'bg-red-50 text-red-600 border-red-100' : 'bg-[var(--bg-accent)] text-[var(--primary-main)] border-[var(--primary-main)]/10'}`}>
                                {row[5]}
                            </span>
                          </td>
                          <td className="px-8 py-4 text-center">
                            <div className="flex items-center justify-center gap-3 opacity-30 group-hover:opacity-100 transition-opacity">
                              <span className="text-[10px] font-black text-[var(--secondary-main)] uppercase whitespace-nowrap">{row[6]}</span>
                              <ChevronRight size={16} className="text-[var(--primary-main)]" />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FilteredSales;