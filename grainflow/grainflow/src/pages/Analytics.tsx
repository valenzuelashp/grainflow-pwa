import { useState, useEffect } from 'react';
import { 
  Sparkles, Clock, Target, 
  TrendingUp, Wallet, Scale, Hourglass, 
  Flame as FireIcon, BarChart3, Package, ShoppingBag, DollarSign,
  AlertCircle, TrendingDown, Lightbulb, CheckSquare, CalendarClock,
  Activity, CalendarDays, Bug, ArrowRight
} from 'lucide-react';
import React from 'react';
import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell, PieChart, Pie, CartesianGrid, AreaChart, Area
} from 'recharts';
import { getTrends } from '../services/api';

const Analytics = () => {

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);
  
  const [trendsData, setTrendsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userGoal, setUserGoal] = useState<number>(0);
  
  // Toggle states
  useState<'demand' | 'profit'>('demand');
  const [trafficView, setTrafficView] = useState<'heatmap' | 'peak'>('heatmap');

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setUserGoal(Number(user.monthly_goal) || 0);

        const { ok, data } = await getTrends();
        if (!ok) throw new Error('Failed to fetch analytics data');
        const safeData = Array.isArray(data) ? data[0] : data;
        setTrendsData(safeData);
      } catch (err: any) {
        console.error('Analytics Error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTrends();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-system)]">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[var(--bg-accent)] border-t-[var(--primary-main)] rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xs font-black uppercase text-[var(--primary-main)] tracking-widest">Analyzing GrainFlow...</p>
      </div>
    </div>
  );

const kpi = trendsData?.kpiSummary;
  
  // 🚀 IMPROVED LOGIC: Use the Backend's calculated revenue for consistency
  // This ensures that if the Backend says 5k, the Analytics says 5k.
  const currentRevenue = kpi?.monthlyProgress?.current ?? kpi?.totalRevenue ?? 0;
  const backendTarget = kpi?.monthlyProgress?.target ?? userGoal;
  
  // Calculate percentage based on the accurate revenue
  const goalPercentage = backendTarget > 0 ? Math.min(100, Math.round((currentRevenue / backendTarget) * 100)) : 0;

  const topVarietiesByDemand = (trendsData?.varietyDemand ?? []).sort((a: any, b: any) => b.percentage - a.percentage).slice(0, 5);
  const profitableVarieties = trendsData?.varietyProfitability ?? [];
  const slowMoving = trendsData?.advancedMetrics?.slowMoving ?? [];
  const predictedRevenue = (trendsData?.stockForecast ?? []).slice(-7);
  
  const { yMin, yMax } = (() => {
    if (!predictedRevenue || predictedRevenue.length === 0) return { yMin: 0, yMax: 1000 };
    const values = predictedRevenue.map((d: any) => d.level);
    return { yMin: Math.max(0, Math.min(...values) - 50), yMax: Math.max(...values) + 50 };
  })(); 

  const peakHours = (trendsData?.peakHours ?? []).sort((a: any, b: any) => b.count - a.count).slice(0, 5);
  const retentionData = trendsData?.customerHealth ?? [];

  const avgBasketSize = kpi?.unitsSold && kpi?.totalRevenue && kpi?.avgTransactionValue 
    ? (kpi.unitsSold / (kpi.totalRevenue / kpi.avgTransactionValue)).toFixed(1) : "0.0";
  const stockRunway = trendsData?.advancedMetrics?.daysOfInventory ?? "0"; 

  // --- PRESCRIPTIVE ENGINE LOGIC ---
  const generatePrescriptions = () => {
    const actions = [];
    if (trendsData?.lowestStock) {
        actions.push(`Reorder ${trendsData.lowestStock.name.toUpperCase()} within the next 48 hours to prevent stockouts.`);
    }
    if (slowMoving.length > 0) {
        actions.push(`Run a bundle promo or discount on ${slowMoving[0].name.toUpperCase()} to clear stagnant inventory and prevent spoilage.`);
    }
    if (trendsData?.advancedMetrics?.totalUtang > 5000) {
        actions.push(`High receivables detected. Send payment reminders to top 'Utang' customers this weekend.`);
    }
    if (peakHours.length > 0) {
        const h = parseInt(peakHours[0].hour);
        const display = `${h % 12 === 0 ? 12 : h % 12}:00 ${h >= 12 ? 'PM' : 'AM'}`;
        actions.push(`Prepare extra pre-packed bags before ${display} to handle peak traffic efficiently.`);
    }
    return actions.length > 0 ? actions : ["Maintain current inventory levels. No critical actions needed today."];
  };

  const prescriptiveActions = generatePrescriptions();

  const marginSpreadData = trendsData?.marginSpreadData ?? [];
  const defaultHeatmap = Array(7).fill([0, 0, 0, 0]); 
  const heatmapData = trendsData?.heatmapData?.length === 7 ? trendsData.heatmapData : defaultHeatmap;

  const heatmapDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const heatmapShifts = ['6AM-11AM', '11AM-3PM', '3PM-7PM', '7PM-10PM'];

  return (
    <div className="p-4 space-y-2 sm:space-y-6 pb-5 min-h-screen bg-fixed bg-cover bg-center transition-colors duration-500" style={{ backgroundImage: `linear-gradient(var(--bg-overlay), var(--bg-overlay)), url('/rice.png')` }}>
      
      {/* 🚀 DYNAMIC REVENUE TARGET SECTION */}
      <div className="bg-[var(--bg-card)] backdrop-blur-md px-4 py-0 sm:px-6 sm:py-6 rounded-[1.5rem] sm:rounded-[2.5rem] border border-[var(--bg-accent)] shadow-sm">
        {userGoal > 0 ? (
          <>
            <div className="flex justify-between items-center mb-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Monthly Revenue Target</p>
                <Target size={14} className="text-[var(--primary-main)]" />
            </div>
            <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl font-black text-gray-900 text-left">₱{(currentRevenue).toLocaleString()}</span>
                <span className="text-xs font-bold text-gray-400 mb-1">/ ₱{(userGoal).toLocaleString()}</span>
            </div>
            <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                <div className="h-full bg-[var(--primary-main)] transition-all duration-1000 shadow-[0_0_10px_var(--primary-main)]" style={{ width: `${goalPercentage}%` }} />
            </div>
            <p className="text-[9px] font-black text-[var(--primary-main)] mt-2 uppercase tracking-tighter text-left">
                {goalPercentage}% of Your Personal Monthly Goal Achieved
            </p>
          </>
        ) : (
          <div className="py-2 sm:py-4 text-left">
            <div className="flex items-center gap-3 mb-1 sm:mb-3">
              <div className="p-2 bg-[var(--primary-main)]/10 rounded-xl text-[var(--primary-main)]">
                <Target size={20} />
              </div>
              <h4 className="text-sm font-black text-gray-800 uppercase tracking-tight">Set Your Sales Target</h4>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-500 font-medium leading-relaxed mb-2 sm:mb-4">
              Defining a target helps GrainFlow track your growth and surface useful store insights.
            </p>
            <div className="flex items-center gap-2 text-[10px] font-black text-[var(--primary-main)] uppercase tracking-widest italic">
              Go to Account Settings <ArrowRight size={12} /> Sales Target
            </div>
          </div>
        )}
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 sm:gap-4">
        <div className="lg:col-span-3 bg-[var(--bg-card)] backdrop-blur-md px-4 py-3 sm:px-6 sm:py-6 rounded-[1.5rem] sm:rounded-[2.5rem] border border-[var(--border-color)] shadow-sm flex items-center">
          <div className="grid grid-cols-3 w-full divide-x divide-[var(--border-color)]">
            <div className="px-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-1"><DollarSign size={10} className="text-[var(--primary-main)] shrink-0"/><p className="text-[7px] md:text-[8px] font-black text-gray-400 uppercase">Revenue</p></div>
              <p className="text-xs md:text-xl font-black text-gray-800 truncate">₱{(kpi?.totalRevenue ?? 0).toLocaleString()}</p>
            </div>
            <div className="px-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-1"><Package size={10} className="text-[var(--primary-main)] shrink-0"/><p className="text-[7px] md:text-[8px] font-black text-gray-400 uppercase">Units Sold</p></div>
              <p className="text-xs md:text-xl font-black text-gray-800">{(kpi?.unitsSold ?? 0).toLocaleString()}kg</p>
            </div>
            <div className="px-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-1"><ShoppingBag size={10} className="text-[var(--primary-main)] shrink-0"/><p className="text-[7px] md:text-[8px] font-black text-gray-400 uppercase">Avg. Ticket</p></div>
              <p className="text-xs md:text-xl font-black text-gray-800">₱{(kpi?.avgTransactionValue ?? 0).toLocaleString(undefined, {maximumFractionDigits:0})}</p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--primary-main)] p-2 sm:p-6 rounded-[2.5rem] shadow-lg shadow-[var(--primary-main)]/20 text-white flex flex-col justify-center transition-all duration-500">
          <p className="text-[8px] font-black text-white/70 uppercase mb-2 hidden lg:block">Total Net Profit</p>
          <div className="flex flex-col lg:flex-row justify-center lg:justify-between items-center gap-3">
            <div className="flex sm:flex-col text-left sm:text-center items-center lg:items-start gap-8 sm:gap-2 lg:gap-0">
              <p className="text-[10px] sm:text-[8px] font-black text-white/70 uppercase lg:hidden">Total Net Profit</p>
              <p className="text-2xl font-black leading-none">₱{(trendsData?.todayBreakdown?.profit ?? (currentRevenue * 0.15)).toLocaleString(undefined, {maximumFractionDigits:0})}</p>
            </div>
            <TrendingUp size={20} className="text-white/30 hidden lg:block" />
          </div>
        </div>
      </div>

      {/* THREE-COLUMN STATS */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-[var(--bg-card)] p-2 sm:p-6 rounded-3xl border border-[var(--border-color)] shadow-sm flex flex-col items-center sm:items-start transition-all">
          <Wallet size={14} className="text-red-500 mb-2" />
          <p className="text-[8px] font-black text-gray-400 uppercase">Receivable</p>
          <p className="text-sm font-black text-gray-900 leading-none mt-1">₱{(trendsData?.advancedMetrics?.totalUtang ?? 0).toLocaleString()}</p>
        </div>
        <div className="bg-[var(--bg-card)] p-2 sm:p-6 rounded-3xl border border-[var(--border-color)] shadow-sm flex flex-col items-center sm:items-start transition-all">
          <Scale size={14} className="text-blue-500 mb-2" />
          <p className="text-[8px] font-black text-gray-400 uppercase">Avg. Basket</p>
          <p className="text-sm font-black text-gray-900 leading-none mt-1">{avgBasketSize} kg</p>
        </div>
        <div className="bg-[var(--bg-card)] p-2 sm:p-6 rounded-3xl border border-[var(--border-color)] shadow-sm flex flex-col items-center sm:items-start transition-all">
          <Hourglass size={14} className="text-[var(--primary-main)] mb-2" />
          <p className="text-[8px] font-black text-gray-400 uppercase">Runway</p>
          <p className="text-sm font-black text-gray-900 leading-none mt-1">{stockRunway} Days</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
        {/* Margin Spread Area Chart */}
        <div className="bg-[var(--bg-card)] p-3 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] border border-[var(--bg-accent)] shadow-sm flex flex-col transition-all">
            <div className="flex items-center gap-2 mb-2 sm:mb-4">
                <Activity size={16} className="text-[var(--primary-main)]" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Profit Margin Spread</p>
            </div>
            <div className="flex items-center gap-4 mb-2 sm:mb-4 px-2">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[var(--primary-main)]"></div><span className="text-[9px] font-bold text-gray-500 uppercase">Gross Revenue</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[var(--secondary-main)]"></div><span className="text-[9px] font-bold text-gray-500 uppercase">Est. COGS (Capital)</span></div>
            </div>
            <div className="flex-1 min-h-[150px] sm:min-h-[200px] w-full mt-0 sm:mt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={marginSpreadData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                          {/* Revenue Gradient - Uses Primary Palette */}
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--primary-main)" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="var(--primary-main)" stopOpacity={0}/>
                          </linearGradient>
                          
                          {/* Cost Gradient - Uses Secondary Palette */}
                          <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--secondary-main)" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="var(--secondary-main)" stopOpacity={0}/>
                          </linearGradient>
                      </defs>
                      
                      <XAxis 
                          dataKey="date" 
                          tick={{fontSize: 9, fontWeight: 'bold', fill: 'var(--text-main)'}} 
                          axisLine={false} 
                          tickLine={false} 
                      />
                      <YAxis 
                          tick={{fontSize: 9, fill: 'var(--text-main)', opacity: 0.5}} 
                          axisLine={false} 
                          tickLine={false} 
                          tickFormatter={(val) => `₱${val/1000}k`} 
                      />
                      
                      <Tooltip 
                          contentStyle={{
                              borderRadius: '12px', 
                              border: '1px solid var(--border-color)', 
                              background: 'var(--bg-card)', 
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              color: 'var(--text-main)',
                              fontSize: '11px',
                              fontWeight: 'bold'
                          }} 
                          itemStyle={{ color: 'var(--text-main)' }}
                          formatter={(value: any) => `₱${Number(value).toLocaleString()}`} 
                      />
                      
                      {/* Areas using Palette Variables */}
                      <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="var(--primary-main)" 
                          strokeWidth={3} 
                          fillOpacity={1} 
                          fill="url(#colorRev)" 
                      />
                      <Area 
                          type="monotone" 
                          dataKey="cogs" 
                          stroke="var(--secondary-main)" 
                          strokeWidth={3} 
                          fillOpacity={1} 
                          fill="url(#colorCost)" 
                      />
                  </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Heatmap Card */}
        <div className="bg-[var(--bg-card)] p-3 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] border border-[var(--bg-accent)] shadow-sm flex flex-col transition-all">
            <div className="flex justify-between items-center mb-3 sm:mb-6">
                <div className="flex items-center gap-2">
                    {trafficView === 'heatmap' ? <CalendarDays size={16} className="text-[var(--primary-main)]" /> : <Clock size={16} className="text-[var(--primary-main)]" />}
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">
                        {trafficView === 'heatmap' ? '7-Day Traffic Heatmap' : 'Peak Store Hours'}
                    </p>
                </div>
                <div className="flex bg-black/5 p-1 rounded-xl">
                    <button onClick={() => setTrafficView('heatmap')} className={`px-3 py-1.5 text-[8px] font-black uppercase rounded-lg transition-all ${trafficView === 'heatmap' ? 'bg-[var(--bg-card)] shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>Heatmap</button>
                    <button onClick={() => setTrafficView('peak')} className={`px-3 py-1.5 text-[8px] font-black uppercase rounded-lg transition-all ${trafficView === 'peak' ? 'bg-[var(--bg-card)] shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>Peak Hours</button>
                </div>
            </div>
            
            <div className="flex-1 flex flex-col justify-center">
                {trafficView === 'heatmap' ? (
                    <>
                        <div className="grid grid-cols-8 gap-1 sm:gap-1.5 md:gap-2">
                            <div></div>
                            {heatmapDays.map(day => (
                                <div key={day} className="text-center text-[8px] md:text-[9px] font-black text-gray-400 uppercase">{day}</div>
                            ))}
                            
                            {heatmapShifts.map((shift, rowIndex) => (
                                <React.Fragment key={shift}>
                                    <div className="flex items-center justify-end pr-2 text-[7px] md:text-[8px] font-bold text-gray-400 uppercase text-right">
                                        {shift}
                                    </div>
                                    {heatmapData.map((dayData: any[], colIndex: number) => {
                                        const intensity = dayData[rowIndex];
                                        let bgColor = 'bg-stone-50';
                                        if (intensity > 80) bgColor = 'bg-[var(--primary-main)]';
                                        else if (intensity > 50) bgColor = 'bg-[var(--primary-main)]/60';
                                        else if (intensity > 20) bgColor = 'bg-[var(--bg-accent)]';
                                        
                                        return (
                                            <div 
                                                key={`${rowIndex}-${colIndex}`} 
                                                className={`aspect-square rounded-lg md:rounded-xl transition-all duration-300 hover:scale-110 cursor-pointer ${bgColor} border border-white shadow-sm`}
                                                title={`Traffic Intensity: ${intensity}%`}
                                            ></div>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </div>
                        <div className="flex justify-center items-center gap-2 mt-4 sm:mt-6">
                            <span className="text-[8px] font-bold text-gray-400 uppercase">Slow</span>
                            <div className="flex gap-1">
                                <div className="w-3 h-3 rounded-sm border border-black/20 bg-stone-50"></div>
                                <div className="w-3 h-3 rounded-sm border border-black/20 bg-[var(--bg-accent)]"></div>
                                <div className="w-3 h-3 rounded-sm border border-black/20 bg-[var(--primary-main)]/60"></div>
                                <div className="w-3 h-3 rounded-sm border border-black/20 bg-[var(--primary-main)]"></div>
                            </div>
                            <span className="text-[8px] font-bold text-gray-400 uppercase">Busy</span>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col justify-center">
                        {peakHours.length > 0 ? (
                          <div>
                            {peakHours[0] && (() => {
                              const h = parseInt(peakHours[0].hour);
                              const display = `${h % 12 === 0 ? 12 : h % 12}:00 ${h >= 12 ? 'PM' : 'AM'}`;
                              return (
                                <div className="bg-[var(--primary-main)] text-white p-4 rounded-[1.5rem] flex justify-between items-center relative overflow-hidden shadow-md shadow-[var(--primary-main)]/20 mb-3">
                                  <div className="flex items-center gap-3 relative z-10 text-left">
                                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-inner"><FireIcon className="text-white" size={16} strokeWidth={2.5} /></div>
                                    <div>
                                      <div className="flex items-center gap-1 text-white/70 text-[8px] font-black uppercase tracking-widest mb-0.5"><Sparkles size={10} /> Most Popular</div>
                                      <div className="text-xl font-black tracking-tight">{display}</div>
                                    </div>
                                  </div>
                                  <div className="text-right relative z-10 pr-1">
                                    <div className="text-2xl font-black leading-none">{peakHours[0].count}</div>
                                    <div className="text-white/70 text-[8px] font-black uppercase tracking-widest">Sales</div>
                                  </div>
                                  <Clock className="absolute -right-6 -bottom-6 text-white/10 w-28 h-28" strokeWidth={1} />
                                </div>
                              );
                            })()}
                            <div className="grid grid-cols-2 gap-2">
                              {peakHours.slice(1, 5).map((row: any, i: number) => {
                                const h = parseInt(row.hour);
                                const display = `${h % 12 === 0 ? 12 : h % 12}:00 ${h >= 12 ? 'PM' : 'AM'}`;
                                return (
                                  <div key={i} className="bg-[var(--bg-accent)]/20 p-3 rounded-xl border border-[var(--border-color)] flex flex-col justify-between hover:border-[var(--primary-main)]/20 transition-colors text-left">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-[10px] font-black text-gray-900">{display}</span>
                                      <span className="text-[10px] font-black text-[var(--primary-main)]">#{i + 2}</span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-base font-black text-gray-900 leading-none">{row.count}</span>
                                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Sales</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : <p className="text-xs text-gray-400 italic text-center py-6">Waiting for transaction data...</p>}
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* TOP VARIETIES & RISK */}
       {/* 🚀 ROW 5: THE SPLIT GRID (1/4 | 1/4 | 2/4) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 sm:gap-4">
        
        {/* 1/4: Demand Breakdown */}
        <div className="bg-[var(--bg-card)] p-3 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] border border-[var(--border-color)] shadow-sm flex flex-col transition-all">
          <div className="flex flex-col mb-1 sm:mb-4 text-left">
            <p className="text-[10px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-widest">Demand</p>
            <h4 className="text-xs font-black text-[var(--text-main)] uppercase">Volume Breakdown</h4>
          </div>
          <div className="h-[150px] sm:h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={topVarietiesByDemand} layout="vertical" margin={{ left: -30, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{fontSize: 8, fontWeight: 'black', fill: 'var(--text-main)'}} width={80} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'var(--bg-accent)', opacity: 0.3}} contentStyle={{borderRadius: '12px', border: 'none', background: 'var(--bg-card)'}} />
                <Bar dataKey="percentage" radius={[0, 10, 10, 0]} barSize={10} fill="var(--primary-main)" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 1/4: Profit Performance */}
        <div className="bg-[var(--bg-card)] p-3 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] border border-[var(--border-color)] shadow-sm flex flex-col transition-all">
          <div className="flex flex-col mb-2 sm:mb-4 text-left">
            <p className="text-[10px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-widest">Profit</p>
            <h4 className="text-xs font-black text-[var(--text-main)] uppercase">Profit per Type</h4>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
              <div className="space-y-1 sm:space-y-3">
                {profitableVarieties.map((v: any, i: number) => (
                    <div key={i} className="flex justify-between items-center border-b border-[var(--border-color)] pb-2 text-left">
                        <span className="text-[9px] font-black text-[var(--text-main)] uppercase truncate max-w-[80px]">{v.name}</span>
                        <span className="text-xs font-black text-[var(--primary-main)]">₱{Number(v.profit || 0).toLocaleString()}</span>
                    </div>
                ))}
              </div>
          </div>
        </div>

        {/* 2/4: Inventory Risks (Using Theme Palette & Real Data) */}
        <div className="lg:col-span-2 bg-[var(--bg-card)] p-3 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] border border-[var(--border-color)] shadow-sm flex flex-col text-left transition-all">
          <div className="flex items-center justify-between mb-2 sm:mb-4">
             <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500" />
                <h3 className="text-[12px] sm:text-lg font-black text-[var(--text-main)] uppercase leading-none sm:italic">Inventory Risks</h3>
             </div>
             <p className="text-[10px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-widest">Lifecycle Log</p>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {slowMoving.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1 sm:gap-3">
                  {slowMoving.map((item: any, idx: number) => {
                    // 🚀 REAL DATA AGING LOGIC
                    const lastUpdate = new Date(item.updated_at || item.created_at || new Date());
                    const diffTime = Math.abs(new Date().getTime() - lastUpdate.getTime());
                    const agingDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                    const isCritical = agingDays >= 30;
                    const isWarning = agingDays >= 15 && agingDays < 30;

                    return (
                        <div key={idx} className="flex flex-col p-1 sm:p-3 bg-[var(--bg-accent)]/30 rounded-lg sm:rounded-2xl border border-[var(--border-color)] transition-all hover:bg-[var(--bg-accent)]/50">
                            <div className="flex justify-between items-center mb-0 sm:mb-2">
                                <div className="flex items-center gap-2">
                                    {isCritical ? <Bug size={14} className="text-red-500" /> : <TrendingDown size={14} className="text-[var(--primary-main)]" />}
                                    <span className="text-[10px] sm:text-xs font-bold text-[var(--text-main)] uppercase truncate max-w-[100px]">{item.name}</span>
                                </div>
                                <span className="text-[9px] font-black text-[var(--secondary-main)] opacity-60 uppercase">{item.stock} {item.unit || 'kg'} left</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-[var(--bg-card)] rounded-full overflow-hidden border border-[var(--border-color)]">
                                    <div className={`h-full transition-all duration-1000 ${isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-400' : 'bg-[var(--primary-main)]'}`} style={{ width: `${Math.min(100, (agingDays / 45) * 100)}%` }} />
                                </div>
                                <span className={`text-[8px] font-black uppercase ${isCritical ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-[var(--secondary-main)]'}`}>{agingDays} Days Old</span>
                            </div>
                        </div>
                    );
                  })}
                </div>
              ) : <div className="h-full flex items-center justify-center opacity-30 italic text-xs font-black text-[var(--secondary-main)]">Stock circulation is healthy.</div>}
          </div>
        </div>
      </div>


      {/* FORECAST & HEALTH */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
        <div className="bg-[var(--bg-card)] p-3 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] border border-[var(--border-color)] shadow-sm transition-all">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 sm:mb-6 text-left">Stock Depletion Forecast (7D)</p>
          <div className="h-[150px] sm:h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={predictedRevenue} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--bg-accent)" />
                <XAxis dataKey="day" tick={{fontSize: 9, fontWeight: 'bold', fill: 'var(--secondary-main)'}} axisLine={false} tickLine={false} />
                {/* 🚀 FIXED: Showing YAxis kilograms */}
                <YAxis domain={[yMin, yMax]} tick={{fontSize: 9, fontWeight: 'bold', fill: 'var(--secondary-main)'}} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}kg`} width={40} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', background: 'var(--secondary-main)', color: '#fff'}} />
                <Line type="monotone" dataKey="level" stroke="var(--primary-main)" strokeWidth={4} dot={{r: 5, fill: 'var(--primary-main)', strokeWidth: 2, stroke: '#fff'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-[var(--bg-card)] p-3 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] border border-[var(--border-color)] shadow-sm flex flex-col justify-center transition-all">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0 sm:mb-6 text-left">Merchant Cohort Analysis</p>
          <div className="flex items-center h-[150px] sm:h-[160px] gap-8 px-4">
            <ResponsiveContainer width="45%" height="100%">
              <PieChart>
                <Pie data={retentionData} innerRadius={40} outerRadius={55} paddingAngle={8} dataKey="value" stroke="none">
                  {retentionData.map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--primary-main)' : 'var(--secondary-main)'} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="w-1/2 space-y-4 text-left">
                {retentionData.map((entry: any, i: number) => (
                    <div key={i} className="flex flex-col">
                        <span className="text-[14px] font-black italic uppercase leading-none" style={{ color: i === 0 ? 'var(--primary-main)' : 'var(--secondary-main)' }}>{entry.value}%</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">{entry.name}</span>
                    </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* PRESCRIPTIVE ENGINE */}
      <div className="bg-[var(--secondary-main)] p-3 sm:p-1 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-xl shadow-[var(--secondary-main)]/20 transition-all duration-500">
          <div className="bg-gradient-to-br from-[var(--secondary-main)] to-[var(--primary-main)] p-3 sm:p-6 rounded-[1.5rem] sm:rounded-[2.3rem] relative overflow-hidden text-left transition-all duration-500">
            <div className="flex items-center justify-between mb-2 sm:mb-6 relative z-10">
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 sm:p-3 bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-inner transition-all"><Lightbulb size={24} className="text-white" /></div>
                    <div className="text-left">
                        <p className="text-white/60 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:mb-1">Prescriptive Intelligence</p>
                        <h4 className="text-[13px] sm:text-lg font-black italic tracking-tighter text-white">Store Insights</h4>
                    </div>
                </div>
                <Sparkles className="text-white/30 animate-pulse" size={20} />
            </div>
            
            <div className="space-y-2 sm:space-y-4 relative z-10">
                <div className="bg-white/10 p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10 backdrop-blur-sm shadow-inner">
                    <div className="flex items-center gap-1 sm:gap-2 text-white/60 text-[9px] font-black uppercase tracking-widest mb-1">
                        <CalendarClock size={12} /> Predictive Insight
                    </div>
                    <p className="text-sm font-bold leading-snug text-white italic text-left">
                        "{trendsData?.storeInsight || trendsData?.aiRecommendation || "Keep monitoring sales trends..."}"
                    </p>
                </div>

                <div className="space-y-1 sm:space-y-2 mt-2 sm:mt-4">
                    <p className="text-white/60 text-[9px] font-black uppercase tracking-widest px-1">Recommended Actions</p>
                    {prescriptiveActions.map((action, idx) => (
                        <div key={idx} className="flex gap-4 items-center bg-white/5 hover:bg-white/10 transition-all p-2 sm:p-3 rounded-xl border border-white/5">
                            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 shadow-lg"><CheckSquare size={12} className="text-white" /></div>
                            <p className="text-xs font-bold text-white/90 leading-tight">{action}</p>
                        </div>
                    ))}
                </div>
            </div>
            <BarChart3 className="absolute -right-10 -bottom-10 text-white/5 w-64 h-64 pointer-events-none rotate-12" />
          </div>
      </div>
    </div>
  );
};

export default Analytics;