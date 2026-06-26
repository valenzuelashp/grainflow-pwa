export const contextualTips = {
  '/': [
    "💡 Check your daily revenue in the Gross Revenue card to track today's performance.",
    "📊 Click on the Product Demand chart to see which rice varieties are selling best.",
    "⚠️ Keep an eye on the Low Stock indicator - it helps you manage inventory efficiently.",
    "💰 The Suki Credit section helps you track and settle customer transactions.",
    "📈 Compare today's sales with yesterday to spot trends in your business.",
  ],
  '/inventory': [
    "📦 Add new rice varieties by clicking the + button to expand your product catalog.",
    "🔍 Use the search bar with autocomplete to quickly find products.",
    "⚠️ Red Low Stock alerts mean you need to reorder soon - click to see the full list.",
    "📋 Mark items in the Low Stock List and use the Package button to register orders.",
    "🗂️ Archive old products to keep your active inventory clean and organized.",
  ],
  '/pos': [
    "🛒 Click on rice varieties to add them to your cart instantly.",
    "💳 Choose between Cash, Online Payment, or Utang (credit) payment methods.",
    "👤 Start typing a customer name to see autocomplete suggestions.",
    "📊 Use the Sort dropdown to organize products by price or alphabetically.",
    "🧾 Check Past Sales to view or recreate previous transactions.",
  ],
  '/reports': [
    "📈 Generate detailed reports to analyze your sales performance.",
    "🔍 Filter reports by date range to focus on specific periods.",
    "💾 Export reports for record-keeping and analysis.",
    "📊 Use AI Insights to get smart recommendations based on your data.",
    "🎯 Track trends to make better inventory and pricing decisions.",
  ],
  '/analytics': [
    "📊 Monitor key performance indicators to understand your business health.",
    "💹 Track revenue trends over different time periods.",
    "🏆 Identify your top-selling products and focus on them.",
    "📉 Analyze customer behavior to improve your sales strategy.",
    "🎯 Use insights to plan inventory and marketing campaigns.",
  ],
  '/sales/all': [
    "🔍 Search through all your sales transactions easily.",
    "📅 Filter sales by date to find specific transactions.",
    "💰 View payment methods and customer details for each sale.",
    "📊 Analyze sales patterns to understand customer preferences.",
    "🧾 Export sales data for accounting and analysis.",
  ],
};

export const getContextualTips = (pathname: string): string[] => {
  // Normalize pathname
  const normalizedPath = pathname.split('?')[0]; // Remove query params
  
  // Check for exact match first
  if (contextualTips[normalizedPath as keyof typeof contextualTips]) {
    return contextualTips[normalizedPath as keyof typeof contextualTips];
  }

  // Check for pattern matches
  if (normalizedPath.startsWith('/sales/')) {
    return contextualTips['/sales/all'];
  }

  if (normalizedPath.startsWith('/archive/')) {
    return contextualTips['/sales/all'];
  }

  // Default tips for unknown pages
  return [
    "👋 Welcome to GrainFlow! I'm here to help you navigate the system.",
    "❓ Click on me anytime to get helpful tips about the current page.",
    "⚙️ You can toggle me on/off in Settings → System Preferences.",
  ];
};
