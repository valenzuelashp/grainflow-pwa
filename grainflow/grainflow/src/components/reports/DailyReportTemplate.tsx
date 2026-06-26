/**
 * DailyReportTemplate.tsx
 * This component generates a formal "Daily Operations Report" for auditing and record-keeping.
 * * Key Features:
 * 1. Image Capture Ready: Uses 'forwardRef' so that a parent component (like ReportGenerator) 
 * can target this DOM element to save it as a PNG or PDF.
 * 2. Financial Breakdown: Separates Gross Revenue into 'Cash' and 'Online' payment channels.
 * 3. KPI Grid: Displays high-level stats including Total Sales, Transaction Count, and the Best Selling rice variety.
 * 4. Audit Branding: Features an "Audit Verified" footer and branch-specific metadata for formal business use.
 */

import { forwardRef } from 'react';
import { Clock, TrendingUp, Package, Wallet } from 'lucide-react';

interface DailyReportProps {
    data: {
        date: string;
        totalSales: number;
        transactionCount: number;
        cashTotal: number;
        onlineTotal: number; // Updated to match the "Online Payment" rename
        topVariety: string;
    };
}

const DailyReportTemplate = forwardRef<HTMLDivElement, DailyReportProps>(({ data }, ref) => {
    return (
        <div
            ref={ref}
            className="w-[800px] p-12 bg-white text-gray-900 font-sans border-t-[12px] border-orange-600"
        >
            {/* REPORT HEADER: Brand identity and generation date */}
            <div className="flex justify-between items-start mb-12">
                <div>
                    <h1 className="text-4xl font-black italic tracking-tighter text-orange-600">GrainFlow</h1>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.3em]">Daily Operations Report</p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-black text-gray-400 uppercase">Generated On</p>
                    <p className="font-bold text-lg">{data.date}</p>
                </div>
            </div>

            {/* KPI GRID: Three-column layout for top-level business metrics */}
            <div className="grid grid-cols-3 gap-6 mb-12">
                {/* Gross Revenue: The primary financial metric */}
                <div className="bg-orange-50 p-6 rounded-[2rem] border border-orange-100">
                    <TrendingUp className="text-orange-600 mb-2" size={24} />
                    <p className="text-[10px] font-black text-orange-400 uppercase">Gross Revenue</p>
                    <p className="text-2xl font-black text-orange-700">₱{data.totalSales.toLocaleString()}</p>
                </div>

                {/* Transaction Volume: Total number of orders processed */}
                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                    <Clock className="text-gray-400 mb-2" size={24} />
                    <p className="text-[10px] font-black text-gray-400 uppercase">Transactions</p>
                    <p className="text-2xl font-black text-gray-900">{data.transactionCount}</p>
                </div>

                {/* Variety Performance: Identifies the variety with the highest demand */}
                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                    <Package className="text-gray-400 mb-2" size={24} />
                    <p className="text-[10px] font-black text-gray-400 uppercase">Best Seller</p>
                    <p className="text-xl font-black text-gray-900 leading-none mt-1">{data.topVariety}</p>
                </div>
            </div>

            {/* FINANCIAL BREAKDOWN: Detailed view of payment methods */}
            <div className="space-y-4 mb-12">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Payment Breakdown</h3>
                <div className="border border-gray-100 rounded-[2rem] overflow-hidden">
                    {/* Cash Row */}
                    <div className="flex justify-between p-6 border-b border-gray-50 bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-gray-900 font-bold italic">₱</div>
                            <span className="font-bold">Cash Payments</span>
                        </div>
                        <span className="font-black text-lg">₱{data.cashTotal.toLocaleString()}</span>
                    </div>

                    {/* Online Row: Renamed from GCash to support broader online payment methods */}
                    <div className="flex justify-between p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-sm text-white">
                                <Wallet size={20} />
                            </div>
                            <span className="font-bold">Online Payment</span>
                        </div>
                        <span className="font-black text-lg text-orange-600">₱{data.onlineTotal.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* FOOTER: Audit trail and branch location info */}
            <div className="mt-20 pt-8 border-t border-dashed border-gray-200 text-center">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em]">Audit Verified • GrainFlow POS System</p>
                <p className="text-[9px] text-gray-400 mt-2 italic">End of Day Report for GrainFlow Bacoor City Branch</p>
            </div>
        </div>
    );
});

export default DailyReportTemplate;