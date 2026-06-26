import { useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ShoppingBag, 
  AlertCircle, Download, Calendar, User, FilterX, FileText 
} from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import AllSalesReport from '../components/reports/AllSalesReport';
import { generateCSV } from '../utils/reportGenerator';
import { getReport } from '../services/api';

const AllSales = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any[][]>([]); 
  const [loading, setLoading] = useState(true);

  // Match this to your actual main app header height
  const MAIN_HEADER_HEIGHT = "0";

  const profile = JSON.parse(localStorage.getItem('user') || '{}');

  const [filters, setFilters] = useState({
    start: '',
    end: '',
    customer: '',
    method: '',
    rice: ''
  });

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    
    if (filters.start) params.append('start', filters.start);
    if (filters.end) params.append('end', filters.end);
    if (filters.customer) params.append('customer', filters.customer);
    if (filters.method) params.append('payment_method', filters.method);
    if (filters.rice) params.append('rice', filters.rice);

    try {
      const { ok, data: result } = await getReport('all', params);
      
      if (ok && result.ledger && result.ledger.length > 1) {
        const records = result.ledger.slice(1).sort((a: any[], b: any[]) => {
          return b[0].toString().localeCompare(a[0].toString(), undefined, { numeric: true, sensitivity: 'base' });
        });
        setData(records);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({ start: '', end: '', customer: '', method: '', rice: '' });
  };

  const handleDownloadCSV = () => {
    if (data.length === 0) return;
    const headers: string[] = ["ID", "Customer Name", "Rice Variety", "Qty (KG)", "Total Amount", "Method", "Date & Time"];
    const csvRows: any[][] = data.map(row => [
      row[0], row[1], row[2], row[3],
      row[4]?.toString().replace(/[^\d.]/g, '') || '0', 
      row[5], row[6]
    ]);
    generateCSV(headers, csvRows, `AllSales_${new Date().getTime()}`);
  };

  const getFormattedDateLabel = () => {
    if (!filters.start) return 'Full History';
    const todayStr = new Date().toISOString().split('T')[0];
    if (filters.start === filters.end || (!filters.end && filters.start === todayStr)) {
      return filters.start;
    }
    if (!filters.end) {
        return `${filters.start} to ${todayStr}`;
    }
    return `${filters.start} to ${filters.end}`;
  };

  const isExportDisabled = loading || data.length === 0;

  return (
    <div 
      className="h-screen flex flex-col text-left font-sans text-[var(--text-main)] bg-[var(--bg-system)] bg-fixed bg-cover bg-bottom transition-colors duration-500 overflow-hidden"
      style={{ 
        backgroundImage: `linear-gradient(var(--bg-overlay), var(--bg-overlay)), url('/rice.png')` 
      }}
    >
      {/* --- HEADER (FIXED/NON-SCROLLABLE) --- */}
      <div 
        style={{ top: MAIN_HEADER_HEIGHT }}
        className="shrink-0 bg-[var(--bg-card)]/80 backdrop-blur-md border-b border-[var(--border-color)] z-40 px-3 py-2 shadow-sm transition-all duration-500"
      >
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between lg:gap-4 max-w-[1600px] mx-auto">
          
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => navigate(-1)} className="p-1.5 text-[var(--secondary-main)] hover:bg-[var(--bg-accent)] bg-[var(--bg-card)]/50 rounded-lg border border-[var(--border-color)] active:scale-90 transition-all">
              <ArrowLeft size={14} />
            </button>
            <button onClick={() => navigate('/reports')} className="text-[9px] font-black text-[var(--secondary-main)] opacity-60 hover:opacity-100 whitespace-nowrap transition-all uppercase tracking-widest">
              Back to Reports
            </button>
            <div className="h-3 w-[1px] bg-[var(--border-color)] mx-1" />
            <h1 className="text-[10px] font-black text-[var(--text-main)] uppercase whitespace-nowrap italic tracking-tighter">All Sales</h1>
            <div className="h-3 w-[1px] bg-[var(--border-color)] mx-1" />
            <p className="text-[8px] font-bold text-[var(--primary-main)] uppercase tracking-widest whitespace-nowrap">{getFormattedDateLabel()}</p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 lg:flex-1">
            <div className="flex items-center gap-1 bg-[var(--bg-system)] border border-[var(--border-color)] rounded-lg px-2 py-1 shrink-0 backdrop-blur-sm">
              <Calendar size={10} className="text-[var(--primary-main)]" />
              <input type="date" className="bg-transparent text-[9px] font-black outline-none w-[95px] uppercase text-[var(--text-main)]" value={filters.start} onChange={(e) => setFilters(prev => ({...prev, start: e.target.value}))} />
              <span className="text-[var(--secondary-main)] opacity-30 text-[8px] font-black px-0.5">TO</span>
              <input type="date" className="bg-transparent text-[9px] font-black outline-none w-[95px] uppercase text-[var(--text-main)]" value={filters.end} onChange={(e) => setFilters(prev => ({...prev, end: e.target.value}))} />
            </div>

            <div className="relative shrink-0 flex-1 lg:max-w-[150px]">
              <User className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--secondary-main)] opacity-40" size={10} />
              <input type="text" placeholder="CUSTOMER..." className="pl-6 pr-2 py-1.5 bg-[var(--bg-system)] border border-[var(--border-color)] rounded-lg text-[9px] font-black uppercase w-full outline-none focus:ring-1 focus:ring-[var(--primary-main)] text-[var(--text-main)] transition-all placeholder-[var(--secondary-main)]/30" value={filters.customer} onChange={(e) => setFilters(prev => ({...prev, customer: e.target.value}))} />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 lg:flex-none">
            <div className="relative shrink-0 flex-1 lg:max-w-[120px]">
              <ShoppingBag className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--secondary-main)] opacity-40" size={10} />
              <input type="text" placeholder="RICE..." className="pl-6 pr-2 py-1.5 bg-[var(--bg-system)] border border-[var(--border-color)] rounded-lg text-[9px] font-black uppercase w-full outline-none focus:ring-1 focus:ring-[var(--primary-main)] text-[var(--text-main)] transition-all placeholder-[var(--secondary-main)]/30" value={filters.rice} onChange={(e) => setFilters(prev => ({...prev, rice: e.target.value}))} />
            </div>

            <select className="bg-[var(--bg-system)] border border-[var(--border-color)] rounded-lg px-2 py-1.5 text-[9px] font-black uppercase outline-none shrink-0 text-[var(--text-main)] cursor-pointer" value={filters.method} onChange={(e) => setFilters(prev => ({...prev, method: e.target.value}))}>
              <option value="">METHOD</option>
              <option value="Cash">Cash</option>
              <option value="Online Payment">Online</option>
              <option value="Utang">Utang</option>
            </select>

            <div className="bg-[var(--secondary-main)] text-[var(--bg-accent)] px-2 py-1.5 rounded-lg flex items-center gap-1 shrink-0 border border-black/10">
              <span className="text-[8px] font-black uppercase opacity-60 tracking-tighter">Rows</span>
              <span className="text-[10px] font-black">{data.length}</span>
            </div>

            <button onClick={handleDownloadCSV} disabled={isExportDisabled} className={`p-1.5 rounded-lg active:scale-95 shadow-sm flex items-center gap-1.5 transition-all ${isExportDisabled ? 'opacity-30 cursor-not-allowed' : 'bg-[var(--bg-accent)] text-[var(--primary-main)] hover:bg-[var(--primary-main)] hover:text-white border border-[var(--primary-main)]/20'}`}>
              <FileText size={12} />
              <span className="text-[9px] font-black uppercase">CSV</span>
            </button>

            {!loading && data.length > 0 ? (
              <PDFDownloadLink
                document={
                  <AllSalesReport 
                    title="Sales Report" 
                    dateLabel={getFormattedDateLabel()} 
                    rows={data.map(row => { 
                      const r = [...row]; 
                      const paymentMethod = r[5];
                      const createdAtRaw = r[7];
                      const updatedAtRaw = r[8];
                      const isPaidLater = updatedAtRaw && createdAtRaw && updatedAtRaw !== createdAtRaw && paymentMethod !== 'Utang';
                      if (typeof r[4] === 'string') r[4] = r[4].replace(/[^\d.]/g, ''); 
                      if (isPaidLater) {
                        const paidDate = new Date(updatedAtRaw).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                        r[5] = `${paymentMethod}\nPaid: ${paidDate}`;
                      }
                      return r; 
                    })} 
                    profile={profile} 
                    filters={filters} 
                  />
                }
                fileName={`AllSales_${new Date().getTime()}.pdf`}
                className="p-1.5 bg-[var(--primary-main)] text-white rounded-lg active:scale-95 shadow-lg flex items-center gap-1.5 transition-all border-b-2 border-black/20"
              >
                {({ loading: pdfLoading }) => (pdfLoading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <><Download size={12} /> <span className="text-[9px] font-black uppercase">PDF</span></>)}
              </PDFDownloadLink>
            ) : (
              <button disabled className="p-1.5 bg-[var(--bg-system)] text-[var(--secondary-main)] opacity-20 rounded-lg border border-[var(--border-color)]"><Download size={12} /></button>
            )}

            {(filters.start || filters.end || filters.customer || filters.rice || filters.method) && (
              <button onClick={clearFilters} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg active:scale-90 transition-all border border-red-100">
                <FilterX size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- CONTENT AREA (SCROLLABLE) --- */}
      <div className="flex-1 overflow-y-auto p-3 lg:p-6 no-scrollbar">
        <div className="max-w-[1600px] mx-auto pb-10">
          {loading ? (
            <div className="py-20 text-center bg-[var(--bg-card)]/70 backdrop-blur-md rounded-[2rem] border border-[var(--border-color)] shadow-xl transition-all">
              <div className="w-6 h-6 border-2 border-[var(--primary-main)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-[9px] font-black uppercase text-[var(--secondary-main)] opacity-40 italic tracking-widest">Syncing Ledger...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="py-20 text-center opacity-30 bg-[var(--bg-card)]/70 backdrop-blur-md rounded-[2rem] border border-[var(--border-color)] shadow-xl transition-all">
              <AlertCircle className="mx-auto mb-2 text-[var(--text-main)]" size={24} />
              <p className="text-[9px] font-black uppercase italic tracking-widest text-[var(--text-main)]">No matching sequence found</p>
            </div>
          ) : (
            <>
              <div className="hidden lg:block bg-[var(--bg-card)]/70 backdrop-blur-md rounded-[2.5rem] border border-[var(--border-color)] shadow-2xl overflow-hidden transition-all duration-500">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-[var(--bg-card)] z-10">
                      <tr className="bg-[var(--bg-accent)]/20 border-b border-[var(--border-color)] text-left">
                        <th className="px-6 py-4 text-[9px] font-black text-[var(--secondary-main)] opacity-50 uppercase tracking-[0.2em]">Ref ID</th>
                        <th className="px-6 py-4 text-[9px] font-black text-[var(--secondary-main)] opacity-50 uppercase tracking-[0.2em]">Customer Name</th>
                        <th className="px-6 py-4 text-[9px] font-black text-[var(--secondary-main)] opacity-50 uppercase tracking-[0.2em]">Rice Variety</th>
                        <th className="px-6 py-4 text-[9px] font-black text-[var(--secondary-main)] opacity-50 uppercase tracking-[0.2em] text-center">Qty</th>
                        <th className="px-6 py-4 text-[9px] font-black text-[var(--secondary-main)] opacity-50 uppercase tracking-[0.2em] text-right">Settlement</th>
                        <th className="px-6 py-4 text-[9px] font-black text-[var(--secondary-main)] opacity-50 uppercase tracking-[0.2em] text-center">Method</th>
                        <th className="px-6 py-4 text-[9px] font-black text-[var(--secondary-main)] opacity-50 uppercase tracking-[0.2em] text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]/30">
                      {data.map((row, idx) => {
                        const paymentMethod = row[5];
                        const createdAtRaw = row[7];
                        const updatedAtRaw = row[8];
                        const transactionTime = row[6];
                        const isPaidLater = updatedAtRaw && createdAtRaw && updatedAtRaw !== createdAtRaw && paymentMethod !== 'Utang';

                        return (
                          <tr key={idx} className="hover:bg-[var(--bg-accent)]/10 transition-colors group">
                            <td className="px-6 py-4"><span className="bg-[var(--bg-system)] text-[var(--secondary-main)] opacity-60 text-[8px] font-black px-2 py-1 rounded border border-[var(--border-color)]">{row[0]?.includes('-') ? row[0].split('-')[1] : row[0]}</span></td>
                            <td className="px-6 py-4 text-[11px] font-black text-[var(--text-main)] uppercase italic tracking-tight">{row[1]}</td>
                            <td className="px-6 py-4 text-[11px] font-black text-[var(--secondary-main)] uppercase opacity-80">{row[2]}</td>
                            <td className="px-6 py-4 text-center text-[11px] font-black text-[var(--text-main)]">{row[3]}</td>
                            <td className="px-6 py-4 text-right font-black text-sm italic text-[var(--primary-main)]">₱{row[4]}</td>
                            <td className="px-6 py-4 text-center">
                              {isPaidLater ? (
                                <div className="flex flex-col items-center">
                                  <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase shadow-sm ${paymentMethod === 'Online Payment' ? 'bg-blue-600 text-white' : 'bg-[var(--secondary-main)] text-white'}`}>
                                    {paymentMethod === 'Online Payment' ? 'Online' : 'Cash'}
                                  </span>
                                  <span className="text-[6px] font-black text-[var(--secondary-main)] opacity-40 mt-1 uppercase tracking-tighter">Paid: {new Date(updatedAtRaw).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                </div>
                              ) : (
                                <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase border ${paymentMethod === 'Utang' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-[var(--bg-card)] text-[var(--secondary-main)] border-[var(--border-color)] opacity-60'}`}>{paymentMethod}</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right text-[10px] font-bold text-[var(--secondary-main)] opacity-20 uppercase tracking-tighter group-hover:opacity-100 transition-opacity">{transactionTime}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="lg:hidden flex flex-col gap-3">
                {data.map((row, idx) => {
                  const paymentMethod = row[5];
                  const createdAtRaw = row[7];
                  const updatedAtRaw = row[8];
                  const transactionTime = row[6];
                  const isPaidLater = updatedAtRaw && createdAtRaw && updatedAtRaw !== createdAtRaw && paymentMethod !== 'Utang';

                  return (
                    <div key={idx} className="bg-[var(--bg-card)]/90 backdrop-blur-md rounded-[2rem] border border-[var(--border-color)] p-5 shadow-xl active:scale-[0.98] transition-all">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[8px] font-black text-[var(--secondary-main)] opacity-40 uppercase bg-[var(--bg-system)] px-2 py-1 rounded border border-[var(--border-color)] tracking-tighter">
                          #{row[0]?.includes('-') ? row[0].split('-')[1] : row[0]}
                        </span>
                        <span className="text-[8px] font-black text-[var(--secondary-main)] opacity-20 uppercase italic">
                          {transactionTime}
                        </span>
                      </div>

                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xs font-black text-[var(--text-main)] uppercase leading-tight max-w-[70%] italic tracking-tight">
                          {row[1]}
                        </h3>
                        <span className="text-sm font-black text-[var(--primary-main)] italic">
                          ₱{row[4]}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-[var(--border-color)]/50">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black text-[var(--secondary-main)] opacity-60 uppercase tracking-tighter">
                            {row[2]}
                          </span>
                          <span className="text-[8px] font-black bg-[var(--bg-accent)] text-[var(--primary-main)] px-2 py-0.5 rounded-md shadow-sm border border-[var(--primary-main)]/10">
                            {row[3]} KG
                          </span>
                        </div>
                        
                        <div className="flex flex-col items-end">
                          <span className={`text-[8px] font-black px-2.5 py-1 rounded-full uppercase shadow-sm ${
                            paymentMethod === 'Utang' ? 'bg-red-50 text-red-600 border border-red-100' : 
                            isPaidLater ? 'bg-blue-600 text-white' : 'bg-[var(--bg-system)] text-[var(--secondary-main)] opacity-50 border border-[var(--border-color)]'
                          }`}>
                            {paymentMethod === 'Online Payment' ? 'Online' : paymentMethod}
                          </span>
                          {isPaidLater && (
                            <span className="text-[7px] font-black text-blue-500 mt-1 uppercase tracking-tighter italic">
                              Paid {new Date(updatedAtRaw).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllSales;