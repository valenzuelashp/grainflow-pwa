// Header row for all sales ledgers
const SALES_HEADER = ["Transaction ID", "Customer Name", "Rice Variety", "Quantity", "Price", "Total", "Method", "Time/Date"];

// 1. TODAY'S DETAILED DATA
export const todayDataSummary = {
    date: 'March 15, 2026',
    totalSales: 12450.00,
    transactionCount: 48,
    cashTotal: 8200.00,
    gcashTotal: 4250.00,
    topVariety: 'Sinandomeng'
};

export const todayDetailedLedger = [
    SALES_HEADER,
    ["INV-772A", "Aling Nena", "Sinandomeng", "10kg", "52.00", "520.00", "Cash", "08:15 AM"],
    ["INV-883B", "Mang Juan", "Jasmine Rice", "2 sacks", "2400.00", "4800.00", "GCash", "09:30 AM"],
    ["INV-994C", "kariman", "Malagkit", "5kg", "85.00", "425.00", "Cash", "10:45 AM"],
    ["", "", "", "", "TOTAL", "12450.00", "", ""]
];

// 2. YESTERDAY'S DETAILED DATA
export const yesterdayDataSummary = {
    date: 'March 14, 2026',
    totalSales: 9800.00,
    transactionCount: 35,
    cashTotal: 6000.00,
    gcashTotal: 3800.00,
    topVariety: 'Jasmine Rice'
};

export const yesterdayDetailedLedger = [
    SALES_HEADER,
    ["INV-110X", "Walk-in", "Jasmine Rice", "1 sack", "2400.00", "2400.00", "Cash", "Mar 14"],
    ["INV-220Y", "Aling Nena", "Sinandomeng", "20kg", "52.00", "1040.00", "GCash", "Mar 14"],
    ["", "", "", "", "TOTAL", "9800.00", "", ""]
];

// 3. WEEKLY DATA (Simplified for the Excel report)
export const weeklyDetailedLedger = [
    ["Date", "Total Transactions", "Cash Revenue", "GCash Revenue", "Daily Total"],
    ["Mar 09", "40", "5000.00", "3000.00", "8000.00"],
    ["Mar 10", "42", "5500.00", "2500.00", "8000.00"],
    ["Mar 11", "38", "4800.00", "4200.00", "9000.00"],
    ["Mar 12", "50", "7000.00", "5000.00", "12000.00"],
    ["Mar 13", "45", "6200.00", "4000.00", "10200.00"],
    ["Mar 14", "35", "6000.00", "3800.00", "9800.00"],
    ["Mar 15", "48", "8200.00", "4250.00", "12450.00"],
    ["", "", "", "WEEKLY TOTAL", "69450.00"]
];

// Add this to your existing reportData.ts

export const customerMasterList = [
    ["Customer Name", "Total Spent (PHP)", "Last Purchase Date", "Favorite Rice", "Visit Frequency", "Suki Status"],
    ["Aling Nena", "4250.00", "2026-03-14", "Sinandomeng", "Weekly", "Gold"],
    ["Mang Juan", "1200.50", "2026-03-15", "Jasmine Rice", "Bi-Weekly", "Silver"],
    ["kariman", "850.00", "2026-03-10", "Malagkit", "Monthly", "Regular"],
    ["Kuya Boy", "15400.00", "2026-03-15", "Jasmine Rice", "Daily", "Platinum"],
    ["Aling Marites", "2100.00", "2026-03-12", "Sinandomeng", "Weekly", "Silver"],
    ["", "", "", "", "TOTAL CUSTOMER EQUITY", "23800.50"]
];

// src/data/reportData.ts

export const aiInsightsData = {
    generatedAt: "2026-03-15 08:30 AM",
    predictions: [
        {
            variety: "Sinandomeng",
            status: "High Demand",
            prediction: "Will sell out in 2 days",
            recommendation: "Order 15 sacks now",
            confidence: 94
        },
        {
            variety: "Jasmine Rice",
            status: "Stable",
            prediction: "Stock will last 12 days",
            recommendation: "No action needed",
            confidence: 88
        },
        {
            variety: "Malagkit",
            status: "Low Stock Alert",
            prediction: "Will sell out in 14 hours",
            recommendation: "Restock immediately",
            confidence: 98
        }
    ],
    growthMetrics: {
        weeklyGrowth: "+12.5%",
        customerRetention: "68%",
        busiestTime: "09:00 AM - 11:00 AM"
    }
};