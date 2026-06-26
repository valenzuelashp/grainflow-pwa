import type { Product } from './product.interface';

export interface DashboardStats {
  revenue: string;
  orders: number;
  lowStock: number;
  salesToday: number;
  salesYesterday: number;
  salesThisWeek: number;
  salesLastWeek: number;
  monthlySales: { date: string; total: number }[];
  varietyBreakdown: { name: string; value: number }[];
  recentSales: { id: string; rice: string; type: string; price: string }[];
}

export interface AnalyticsData {
  kpiSummary: {
    totalRevenue: number;
    unitsSold: number;
    avgTransactionValue: number;
  };
  topVarieties: { name: string; demand: number }[];
  predictedRevenue: { month: string; predicted: number }[];
  peakHours: { hour: string; count: number }[];
  aiRecommendation: string;
  bestSellerPrediction: string;
  varietyDemand: { name: string; percentage: number }[];
  lowestStock?: Product;
  stockForecast: { day: string; level: number; isPredicted: boolean }[];
}
