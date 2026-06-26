<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Models\User;
use App\Models\Transaction;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller
{
    /**
     * Handle new sales from the POS
     */
    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|numeric|min:0.01',
            'payment_method' => 'required|string',
            'customer_name' => 'nullable|string|max:255',
            'status' => 'nullable|string|in:paid,credit,cancelled',
            'created_at' => 'nullable' 
        ]);

        return DB::transaction(function () use ($request) {
            $product = Product::findOrFail($request->product_id);

            if ($product->stockQuantity < $request->quantity) {
                return response()->json(['message' => 'Not enough stock!'], 400);
            }

            $status = in_array($request->payment_method, ['Credit', 'Utang']) ? 'credit' : ($request->status ?? 'paid');
            $transactionDate = $request->created_at 
                ? Carbon::parse($request->created_at)->setTimeFrom(Carbon::now()) 
                : Carbon::now();

            $transaction = Transaction::create([
                'user_id' => auth()->id(),
                'product_id' => $request->product_id,
                'quantity' => $request->quantity,
                'total_price' => $product->pricePerUnit * $request->quantity,
                'payment_method' => $request->payment_method,
                'customer_name' => $request->customer_name,
                'status' => $status,
                'discount_applied' => $request->discount_applied ?? 0,
                'created_at' => $transactionDate,
            ]);

            $product->decrement('stockQuantity', $request->quantity);

            return response()->json([
                'message' => 'Sale successful!',
                'transaction' => $transaction
            ]);
        });
    }

    public function recommendTubo(Request $request)
    {
    $category = $request->query('category', 'Local');
    $basePerKg = (float) $request->query('basePricePerKg', 0);

    // 1. Establish absolute baseline minimums depending on rice type
    $baseMargin = match($category) {
        'Imported' => 8.00,
        'Glutinous' => 12.00,
        default => 5.00, // Local
    };

    try {
        // 2. Find what your actual store's average tubo is for this specific category
        $storeAverage = Product::where('category', $category)
            ->where('tubo', '>', 0)
            ->avg('tubo');

        // 3. Blend the baseline rule with your store's actual historical data
        $suggestedTubo = $storeAverage ? (($baseMargin + $storeAverage) / 2) : $baseMargin;

        // Optional: If the base price is very expensive (e.g., over 60/kg), allow a slightly higher margin
        if ($basePerKg > 60) {
            $suggestedTubo += 2.00; 
        }

        return response()->json([
            'recommended_tubo' => round($suggestedTubo, 2)
        ]);

    } catch (\Exception $e) {
        // Fallback if the database fails
        return response()->json(['recommended_tubo' => $baseMargin]);
    }
}

    public function getDashboardData(Request $request)
    {
        try {
            $userId = auth()->id();
            $today = Carbon::today();

            // Groupmate's Filter Logic
            $period = $request->query('period', 'today');
            $salesPeriod = $request->query('salesPeriod', 'last7days');

            $dateRange = match($period) {
                'today' => [Carbon::today()->startOfDay(), Carbon::today()->endOfDay()],
                'yesterday' => [Carbon::yesterday()->startOfDay(), Carbon::yesterday()->endOfDay()],
                '7days' => [Carbon::now()->subDays(7)->startOfDay(), Carbon::now()->endOfDay()],
                '30days' => [Carbon::now()->subDays(30)->startOfDay(), Carbon::now()->endOfDay()],
                'all' => [Carbon::parse('2000-01-01'), Carbon::now()->endOfDay()],
                default => [Carbon::today()->startOfDay(), Carbon::today()->endOfDay()],
            };

            $salesDateRange = match($salesPeriod) {
                '7days', 'last7days' => [Carbon::now()->subDays(7)->startOfDay(), Carbon::now()->endOfDay()],
                '30days' => [Carbon::now()->subDays(30)->startOfDay(), Carbon::now()->endOfDay()],
                'all' => [Carbon::parse('2000-01-01'), Carbon::now()->endOfDay()],
                default => [Carbon::now()->subDays(7)->startOfDay(), Carbon::now()->endOfDay()],
            };

            $allTransactions = Transaction::where('user_id', $userId)->with('product')->where('status', '!=', 'cancelled')->get();

            // 1. TODAY KPIs
            $todaySales = $allTransactions->filter(fn($tx) => Carbon::parse($tx->created_at)->isSameDay($today));
            $todayRevenue = $todaySales->sum('total_price');
            $orderCount = $todaySales->count();
            
            $todayCash = $todaySales->where('payment_method', 'Cash')->sum('total_price');
            $todayOnline = $todaySales->where('payment_method', 'Online Payment')->sum('total_price');
            $todayUtang = $todaySales->whereIn('payment_method', ['Utang', 'Credit'])->sum('total_price');
            
            $todayProfit = $todaySales->sum(function($tx) {
                $product = $tx->product;
                if (!$product) return (float)$tx->total_price * 0.15;
                $cost = $product->cost_per_unit ?? ((float)$product->pricePerUnit * 0.85);
                return (float)$tx->total_price - ($cost * (float)$tx->quantity);
            });

            // 2. PERFORMANCE SUMMARY
            $salesYesterday = $allTransactions->filter(fn($tx) => Carbon::parse($tx->created_at)->isSameDay(Carbon::yesterday()))->sum('total_price');
            $salesThisWeek = $allTransactions->filter(fn($tx) => Carbon::parse($tx->created_at)->between(Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()))->sum('total_price');
            $salesLastWeek = $allTransactions->filter(fn($tx) => Carbon::parse($tx->created_at)->between(Carbon::now()->subWeek()->startOfWeek(), Carbon::now()->subWeek()->endOfWeek()))->sum('total_price');

            // 3. CHARTS (Using Date Filters)
            $monthlySales = $allTransactions->filter(fn($tx) => Carbon::parse($tx->created_at)->between($salesDateRange[0], $salesDateRange[1]))
                ->groupBy(fn($tx) => Carbon::parse($tx->created_at)->format('Y-m-d'))
                ->map(fn($group, $date) => ['date' => $date, 'total' => round($group->sum('total_price'), 2)])
                ->values()->sortBy('date')->values();

            $varietyBreakdown = $allTransactions->filter(fn($tx) => Carbon::parse($tx->created_at)->between($dateRange[0], $dateRange[1]))
                ->groupBy('product_id')->map(function($group) {
                    $product = $group->first()->product;
                    $volume = $group->sum('quantity');
                    if (!$product) return ['name' => 'Deleted Variety', 'volume' => round($volume, 2), 'profit' => round($group->sum('total_price') * 0.15, 2)];
                    
                    $cost = $product->cost_per_unit ?? ((float)$product->pricePerUnit * 0.85);
                    $profit = $group->sum('total_price') - ($cost * $volume);
                    
                    return ['name' => $product->name ?? 'Unknown', 'volume' => round($volume, 2), 'profit' => round($profit, 2)];
                })->values()->sortByDesc('volume')->values();

            // 4. LOW STOCK & RECENT
            $lowStockItems = Product::where('user_id', $userId)->whereRaw('"stockQuantity" <= "reorderLevel"')->get()
                ->map(fn($p) => ['id' => $p->id, 'name' => $p->name, 'current_stock' => $p->stockQuantity, 'unit' => $p->unit, 'level' => $p->reorderLevel]);

            $recentSales = $allTransactions->sortByDesc('created_at')->take(5)->values()
                ->map(function($sale) use ($userId) {
                    $isSuki = false;
                    if (!empty($sale->customer_name) && strtolower($sale->customer_name) !== 'walk-in') {
                        $isSuki = Transaction::where('user_id', $userId)->where('customer_name', $sale->customer_name)->count() > 1;
                    }
                    return [
                        'id' => str_pad($sale->id, 3, '0', STR_PAD_LEFT),
                        'rice' => $sale->product ? $sale->product->name : 'Deleted Product',
                        'customer' => $sale->customer_name ?? 'Walk-In',
                        'isSuki' => $isSuki,
                        'type' => $sale->payment_method,
                        'price' => '₱' . number_format($sale->total_price, 2),
                    ];
                });

            return response()->json([
                'revenue' => '₱' . number_format($todayRevenue, 2),
                'orders' => $orderCount,
                'salesToday' => (float) $todayRevenue,
                'todayBreakdown' => ['cash' => $todayCash, 'online' => $todayOnline, 'utang' => $todayUtang, 'profit' => $todayProfit],
                'salesYesterday' => (float) $salesYesterday,
                'salesThisWeek' => (float) $salesThisWeek,
                'salesLastWeek' => (float) $salesLastWeek,
                'monthlySales' => $monthlySales,
                'varietyBreakdown' => $varietyBreakdown,
                'lowStockCount' => $lowStockItems->count(),
                'lowStockItems' => $lowStockItems,
                'recentSales' => $recentSales,
            ]);
            
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage(), 'line' => $e->getLine()], 500);
        }
    }

    public function getReportData(Request $request, $type)
    {
        $userId = auth()->id();
        if ($request->query('month') && $request->query('year')) {
            $start = Carbon::createFromDate($request->year, $request->month, 1)->startOfMonth();
            $end = Carbon::createFromDate($request->year, $request->month, 1)->endOfMonth();
        } elseif ($request->query('start') && $request->query('end')) {
            $start = Carbon::parse($request->query('start'))->startOfDay();
            $end = Carbon::parse($request->query('end'))->endOfDay();
        } else {
            $start = $request->query('start') 
                ? Carbon::parse($request->query('start'))->startOfDay() 
                : Carbon::today()->startOfDay();
                
            $end = $request->query('end') 
                ? Carbon::parse($request->query('end'))->endOfDay() 
                : Carbon::today()->endOfDay();
        }

        $query = Transaction::where('user_id', $userId)
            ->with('product')
            ->when($request->query('customer'), function ($q, $customer) {
                return $q->where('customer_name', 'like', '%' . $customer . '%');
            })
            ->when($request->query('payment_method'), function ($q, $method) {
                return $q->where('payment_method', $method);
            })
            ->when($request->query('rice'), function ($q, $rice) {
                return $q->whereHas('product', function ($p) use ($rice) {
                    $p->where('name', 'like', '%' . $rice . '%');
                });
            });

        switch ($type) {
            case 'today': $transactions = $query->whereDate('created_at', Carbon::today())->latest()->get(); break;
            case 'yesterday': $transactions = $query->whereDate('created_at', Carbon::yesterday())->latest()->get(); break;
            case 'all':
                if ($request->query('month') || $request->query('start')) {
                    $query->whereBetween('created_at', [$start, $end]);
                }
                $transactions = $query->latest()->get();
                break;
            case 'week':
            case 'month':
                $transactions = $query->whereBetween('created_at', [$start, $end])->latest()->get();
                break;
            case 'customers':
                return $this->handleSpecialReport('customers', $userId, $request, $start, $end);
            case 'inventory':
                return $this->handleSpecialReport('inventory', $userId, $request, $start, $end);
            case 'utang':
                $transactions = $query->where('status', 'credit')->latest()->get();
                break;
            case 'top_products':
                return $this->handleSpecialReport('top_products', $userId, $request, $start, $end);
            default:
                return response()->json(['message' => 'Invalid type'], 400);
        }
        return response()->json(['ledger' => $this->formatLedger($transactions), 'filename' => "GrainFlow-" . ucfirst($type) . "-Report"]);
    }

    private function formatLedger($transactions) {
        $header = ["Transaction ID", "Customer Name", "Rice Variety", "Quantity", "Total", "Method", "Time", "raw_created", "raw_updated"];
        $rows = [$header];
        foreach ($transactions as $t) {
            $rows[] = [
                "INV-" . $t->id, 
                $t->customer_name ?? 'Walk-in',
                $t->product->name ?? 'Deleted', 
                $t->quantity . ($t->product->unit ?? 'kg'), 
                number_format($t->total_price, 2), 
                $t->payment_method, 
                $t->created_at->format('M d, h:i A'),
                $t->created_at->toDateTimeString(),
                $t->updated_at->toDateTimeString()
            ];
        }
        return $rows;
    }

    private function handleSpecialReport($type, $userId, $request, $start, $end) {
        if ($type === 'customers') {
            $customers = Transaction::where('user_id', $userId)
                ->whereNotNull('customer_name')
                ->whereBetween('created_at', [$start, $end])
                ->when($request->query('customer'), fn($q, $c) => $q->where('customer_name', 'like', "%$c%"))
                ->select('customer_name')
                ->selectRaw('COUNT(*) as orders, SUM(total_price) as total_spent, MAX(created_at) as last_visit, SUM(quantity) as total_kg')
                ->groupBy('customer_name')->get();

            $ledger = [["ID", "Customer Name", "Total Orders", "Total Spent", "Status", "Last Visit"]];
            foreach ($customers as $idx => $c) {
                $ledger[] = ["SUKI-".($idx+1), $c->customer_name, $c->orders, $c->total_kg, number_format($c->total_spent, 2), Carbon::parse($c->last_visit)->format('M d, Y')];
            }
            return response()->json(['ledger' => $ledger]);
        }
        if ($type === 'inventory') {
            $products = Product::where('user_id', $userId)
                ->when($request->query('rice'), fn($q, $r) => $q->where('name', 'like', "%$r%"))->get();
            $ledger = [["SKU", "Variety Name", "Stock Level", "Inventory Value", "Status", "Last Update"]];
            foreach ($products as $p) {
                $ledger[] = [$p->sku ?? "N/A", $p->name, $p->stockQuantity . ($p->unit ?? 'kg'), number_format($p->stockQuantity * $p->pricePerUnit, 2), $p->stockQuantity <= $p->reorderLevel ? "LOW" : "OK", $p->updated_at->format('M d, Y')];
            }
            return response()->json(['ledger' => $ledger]);
        }
        if ($type === 'top_products') {
            $top = Transaction::where('transactions.user_id', $userId)
                ->join('products', 'transactions.product_id', '=', 'products.id')
                ->whereBetween('transactions.created_at', [$start, $end])
                ->select('products.name', DB::raw('SUM(transactions.quantity) as total_qty, SUM(transactions.total_price) as total_rev'))
                ->groupBy('products.id', 'products.name')->orderByDesc('total_rev')->get();
            $ledger = [["Rank", "Variety", "Total Sold", "Total Revenue", "Performance"]];
            foreach ($top as $idx => $t) {
                $ledger[] = ["#" . ($idx + 1), $t->name, $t->total_qty, number_format($t->total_rev, 2), "High Demand"];
            }
            return response()->json(['ledger' => $ledger]);
        }
    }

    public function getTrends()
    {
        $userId = auth()->id();
        $user = auth()->user(); // 🚀 Pull user for dynamic target
        $now = now();
        
        // --- FIXED BI LOGIC: DYNAMIC REVENUE TARGET ---
        $MONTHLY_TARGET = (float) ($user->monthly_goal ?? 50000); 
        
        // 🚀 Sum ONLY 'paid' sales for the CURRENT calendar month
        $currentMonthSales = Transaction::where('user_id', $userId)
            ->where('status', 'paid') 
            ->whereMonth('created_at', $now->month)
            ->whereYear('created_at', $now->year)
            ->sum('total_price');

        // --- BI LOGIC: CUSTOMER RETENTION (COHORT ANALYSIS) ---
        $thisMonthCustomers = Transaction::where('user_id', $userId)
            ->whereMonth('created_at', $now->month)
            ->whereNotNull('customer_name')
            ->distinct()
            ->pluck('customer_name');

        $returningCount = Transaction::where('user_id', $userId)
            ->whereIn('customer_name', $thisMonthCustomers)
            ->where('created_at', '<', $now->startOfMonth())
            ->distinct('customer_name')
            ->count();

        $totalUniqueThisMonth = $thisMonthCustomers->count();
        $newCustomersCount = $totalUniqueThisMonth - $returningCount;

        $customerHealth = [
            ['name' => 'Returning (Suki)', 'value' => $totalUniqueThisMonth > 0 ? round(($returningCount / $totalUniqueThisMonth) * 100) : 0, 'fill' => '#ea580c'],
            ['name' => 'New Customers', 'value' => $totalUniqueThisMonth > 0 ? round(($newCustomersCount / $totalUniqueThisMonth) * 100) : 0, 'fill' => '#fcd34d']
        ];

        try {
            $transactions = Transaction::where('user_id', $userId)->with('product')->get();
            $totalKilosSold = $transactions->sum('quantity') ?: 1;

            $varietyDemand = $transactions->groupBy('product_id')->map(function($group) use ($totalKilosSold) {
                $product = $group->first()->product;
                return [
                    'name' => $product ? $product->name : 'Deleted Variety',
                    'percentage' => round(($group->sum('quantity') / $totalKilosSold) * 100),
                ];
            })->values();

            $totalStock = Product::where('user_id', $userId)->sum('stockQuantity');
            
            $recentSales = $transactions->where('status', '!=', 'cancelled')->where('created_at', '>=', now()->subDays(7))->sum('quantity');
            $dailyBurnRate = $recentSales > 0 ? ($recentSales / 7) : 5;
            
            $days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            $forecast = [];
            $currentProjectedStock = $totalStock;

            foreach ($days as $index => $day) {
                $forecast[] = ['day' => $day, 'level' => max(0, round($currentProjectedStock)), 'isPredicted' => true];
                $currentProjectedStock -= $dailyBurnRate;
            }

            $peakHours = $transactions->where('status', '!=', 'cancelled')
                ->groupBy(fn($t) => \Carbon\Carbon::parse($t->created_at)->format('H'))
                ->map(fn($group, $hour) => ['hour' => $hour, 'count' => $group->count()])
                ->sortByDesc('count')->take(5)->values();

            $nonCancelledTx = $transactions->where('status', '!=', 'cancelled');
            $totalRevenue = (float) $nonCancelledTx->sum('total_price');
            $txCount = $nonCancelledTx->count();

            $bestSeller = $nonCancelledTx->groupBy('product_id')->map(function($group) {
                $product = $group->first()->product;
                return ['name' => $product ? $product->name : 'Deleted Variety', 'qty' => $group->sum('quantity')];
            })->sortByDesc('qty')->first();

            $lowestStockProduct = Product::where('user_id', $userId)->orderBy('stockQuantity', 'asc')->first();
            
            $retentionRate = $totalUniqueThisMonth > 0 ? round(($returningCount / $totalUniqueThisMonth) * 100) : 0;
            $aiRecommendation = "Retention is at $retentionRate%. " . ($retentionRate > 50 ? "Focus on Suki loyalty rewards." : "Increase local awareness marketing.");

            if ($lowestStockProduct) {
                if ($lowestStockProduct->stockQuantity <= $lowestStockProduct->reorderLevel) {
                    $aiRecommendation = "CRITICAL STOCK: " . strtoupper($lowestStockProduct->name) . " has dropped to " . $lowestStockProduct->stockQuantity . " kg! Reorder immediately.";
                } elseif ($lowestStockProduct->stockQuantity <= ($lowestStockProduct->reorderLevel + 15)) {
                    $aiRecommendation = "LOW STOCK WARNING: " . strtoupper($lowestStockProduct->name) . " is getting low (" . $lowestStockProduct->stockQuantity . " kg). Contact your supplier soon.";
                }
            }

            $totalUtang = $nonCancelledTx->where('status', 'credit')->sum('total_price');
            $avgBasketSize = $txCount > 0 ? round($nonCancelledTx->sum('quantity') / $txCount, 2) : 0;
            $daysOfInventory = $dailyBurnRate > 0 ? round($totalStock / $dailyBurnRate) : 0;

            $slowMoving = Product::where('user_id', $userId)->where('stockQuantity', '>', 0)->get()
                ->sortBy(fn($product) => $transactions->where('product_id', $product->id)->sum('quantity'))
                ->take(3)->map(fn($p) => ['name' => $p->name, 'stock' => $p->stockQuantity, 'unit' => $p->unit ?? 'kg'])->values();

            $last7Days = now()->subDays(7);
            $prev7Days = now()->subDays(14);
            
            $revThisWeek = $nonCancelledTx->where('created_at', '>=', $last7Days)->sum('total_price');
            $revLastWeek = $nonCancelledTx->whereBetween('created_at', [$prev7Days, $last7Days])->sum('total_price');
            $revenueGrowth = $revLastWeek > 0 ? round((($revThisWeek - $revLastWeek) / $revLastWeek) * 100, 1) : 0;

            $allTimeProfit = $nonCancelledTx->sum(function($tx) {
                $product = $tx->product;
                if (!$product) return (float)$tx->total_price * 0.15;
                $cost = $product->cost_per_unit ?? ((float)$product->pricePerUnit * 0.85); 
                return (float)$tx->total_price - ($cost * (float)$tx->quantity);
            });

            $profitMarginPercent = $totalRevenue > 0 ? round(($allTimeProfit / $totalRevenue) * 100, 1) : 0;

            $varietyProfitability = $nonCancelledTx->groupBy('product_id')
                ->map(function($group) {
                    $product = $group->first()->product;
                    $rev = (float)$group->sum('total_price');
                    
                    if (!$product) return ['name' => 'Deleted Variety', 'profit' => round($rev * 0.15, 2), 'margin' => 15.0];

                    $cost = $product->cost_per_unit ?? ((float)$product->pricePerUnit * 0.85);
                    $profit = $rev - ($cost * (float)$group->sum('quantity'));
                    
                    return [
                        'name' => $product->name ?? 'Unknown',
                        'profit' => round($profit, 2),
                        'margin' => $rev > 0 ? round(($profit / $rev) * 100, 1) : 0
                    ];
                })->values()->sortByDesc('profit')->take(5)->values();

            $marginSpreadData = [];
            for ($i = 6; $i >= 0; $i--) {
                $targetDate = now()->subDays($i);
                $dayName = $targetDate->format('D');
                $dayTx = $nonCancelledTx->filter(fn($tx) => Carbon::parse($tx->created_at)->isSameDay($targetDate));
                $dayRev = $dayTx->sum('total_price');
                $dayCogs = $dayTx->sum(function($tx) {
                    $product = $tx->product;
                    $cost = $product->cost_per_unit ?? ((float)$product->pricePerUnit * 0.85);
                    return $cost * (float)$tx->quantity;
                });
                $marginSpreadData[] = ['date' => $dayName, 'revenue' => round($dayRev, 2), 'cogs' => round($dayCogs, 2)];
            }

            $heatmapRaw = array_fill(0, 7, array_fill(0, 4, 0));
            $maxHeat = 0;
            foreach ($nonCancelledTx as $tx) {
                $dt = Carbon::parse($tx->created_at);
                $dayIndex = $dt->dayOfWeekIso - 1;
                $hour = $dt->hour;
                $shift = $hour < 11 ? 0 : ($hour < 15 ? 1 : ($hour < 19 ? 2 : 3));
                $heatmapRaw[$dayIndex][$shift]++;
                if ($heatmapRaw[$dayIndex][$shift] > $maxHeat) $maxHeat = $heatmapRaw[$dayIndex][$shift];
            }

            $heatmapData = [];
            for ($d = 0; $d < 7; $d++) {
                $dayData = [];
                for ($s = 0; $s < 4; $s++) {
                    $dayData[] = $maxHeat > 0 ? round(($heatmapRaw[$d][$s] / $maxHeat) * 100) : 0;
                }
                $heatmapData[] = $dayData;
            }

            return response()->json([
                'varietyDemand' => $varietyDemand,
                'varietyProfitability' => $varietyProfitability,
                'lowestStock' => $lowestStockProduct,
                'stockForecast' => $forecast,
                'peakHours' => $peakHours,
                'kpiSummary' => [
                    'totalRevenue' => round($totalRevenue, 2), 
                    'unitsSold' => round($nonCancelledTx->sum('quantity'), 2), 
                    'avgTransactionValue' => $txCount > 0 ? round($totalRevenue / $txCount, 2) : 0,
                    'allTimeProfit' => round($allTimeProfit, 2),
                    'profitMargin' => $profitMarginPercent,
                    'monthlyProgress' => [
                        'current' => (float) $currentMonthSales,
                        'target' => $MONTHLY_TARGET,
                        'percentage' => $MONTHLY_TARGET > 0 ? round(($currentMonthSales / $MONTHLY_TARGET) * 100, 1) : 0
                    ]
                ],
                'bestSellerPrediction' => $bestSeller ? $bestSeller['name'] : "No Data",
                'aiRecommendation' => $aiRecommendation,
                'advancedMetrics' => [
                    'totalUtang' => round((float)$totalUtang, 2),
                    'avgBasketSize' => $avgBasketSize,
                    'daysOfInventory' => $daysOfInventory,
                    'slowMoving' => $slowMoving,
                    'revenueGrowth' => $revenueGrowth
                ],
                'customerHealth' => $customerHealth,
                'marginSpreadData' => $marginSpreadData, 
                'heatmapData' => $heatmapData            
            ]);
            
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage(), 'line' => $e->getLine()], 500);
        }
    }

    public function getCustomers() { return response()->json(Transaction::where('user_id', auth()->id())->whereNotNull('customer_name')->distinct()->pluck('customer_name')->values()); }
    public function getUnpaidBalances() { return response()->json(Transaction::where('user_id', auth()->id())->where('status', 'credit')->with('product')->latest()->get()); }
    public function updateStatus(Request $request, $id) {
        $transaction = Transaction::where('id', $id)->where('user_id', auth()->id())->firstOrFail();
        $request->validate(['status' => 'required|string', 'payment_method' => 'required|string']);
        $transaction->update(['status' => $request->status, 'payment_method' => $request->payment_method]);
        return response()->json(['message' => 'Status updated successfully']);
    }
}