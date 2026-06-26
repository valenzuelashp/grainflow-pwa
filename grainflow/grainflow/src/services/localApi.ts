import type { Product } from '../interfaces/product.interface';
import type { Transaction } from '../interfaces/transaction.interface';
import * as db from './db';

export interface StoredUser {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  store_name: string;
  phone?: string;
  store_address?: string;
  logo_path?: string;
  monthly_goal?: number;
}

export interface ApiResult<T = any> {
  ok: boolean;
  status: number;
  data: T;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function parseToken(token: string | null): number | null {
  if (!token?.startsWith('local:')) return null;
  const id = Number(token.slice(6));
  return Number.isFinite(id) ? id : null;
}

export function getCurrentUserId(): number | null {
  return parseToken(localStorage.getItem('token'));
}

function publicUser(user: StoredUser) {
  const { passwordHash: _, ...rest } = user;
  return rest;
}

async function requireUser(): Promise<StoredUser> {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('Unauthorized');
  const user = await db.getById<StoredUser>('users', userId);
  if (!user) throw new Error('Unauthorized');
  return user;
}

async function getUserProducts(userId: number): Promise<Product[]> {
  return db.getAllByIndex<Product>('products', 'user_id', userId);
}

async function getUserTransactions(userId: number): Promise<Transaction[]> {
  const rows = await db.getAllByIndex<Transaction>('transactions', 'user_id', userId);
  const products = await getUserProducts(userId);
  const productMap = new Map(products.map((p) => [p.id, p]));
  return rows.map((t) => ({ ...t, product: productMap.get(t.product_id) }));
}

function fail<T>(status: number, message: string): ApiResult<T> {
  return { ok: false, status, data: { message } as T };
}

function ok<T>(data: T, status = 200): ApiResult<T> {
  return { ok: true, status, data };
}

export async function login(email: string, password: string): Promise<ApiResult> {
  const user = await db.getByIndex<StoredUser>('users', 'email', email.toLowerCase());
  if (!user) return fail(401, 'Invalid email or password.');

  const hash = await hashPassword(password);
  if (hash !== user.passwordHash) return fail(401, 'Invalid email or password.');

  const token = `local:${user.id}`;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(publicUser(user)));

  return ok({ message: 'Login successful!', user: publicUser(user), token });
}

export async function register(payload: {
  name: string;
  email: string;
  password: string;
  store_name: string;
}): Promise<ApiResult> {
  const existing = await db.getByIndex<StoredUser>('users', 'email', payload.email.toLowerCase());
  if (existing) return fail(422, 'Email already registered.');

  const user = {
    name: payload.name,
    email: payload.email.toLowerCase(),
    passwordHash: await hashPassword(payload.password),
    store_name: payload.store_name,
    monthly_goal: 50000,
  } as StoredUser;

  const saved = await db.put('users', user);
  const token = `local:${saved.id}`;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(publicUser(saved)));

  return ok({ message: 'Account created!', user: publicUser(saved), token }, 201);
}

export async function updatePassword(currentPassword: string, newPassword: string): Promise<ApiResult> {
  const user = await requireUser();
  const hash = await hashPassword(currentPassword);
  if (hash !== user.passwordHash) return fail(422, 'Current password is incorrect.');

  user.passwordHash = await hashPassword(newPassword);
  await db.put('users', user);
  return ok({ message: 'Password updated successfully!' });
}

export async function getUser(): Promise<ApiResult> {
  const user = await requireUser();
  return ok(publicUser(user));
}

export async function updateProfile(payload: { name: string; email: string; phone?: string }): Promise<ApiResult> {
  const user = await requireUser();
  const email = payload.email.toLowerCase();
  const existing = await db.getByIndex<StoredUser>('users', 'email', email);
  if (existing && existing.id !== user.id) return fail(422, 'Email already in use.');

  user.name = payload.name;
  user.email = email;
  user.phone = payload.phone;
  await db.put('users', user);
  localStorage.setItem('user', JSON.stringify(publicUser(user)));
  return ok({ user: publicUser(user) });
}

export async function updateStore(payload: {
  store_name?: string;
  store_address?: string;
  logo_path?: string;
}): Promise<ApiResult> {
  const user = await requireUser();
  if (payload.store_name) user.store_name = payload.store_name;
  if (payload.store_address !== undefined) user.store_address = payload.store_address;
  if (payload.logo_path !== undefined) user.logo_path = payload.logo_path;
  await db.put('users', user);
  localStorage.setItem('user', JSON.stringify(publicUser(user)));
  return ok({ user: publicUser(user) });
}

export async function updateGoal(monthly_goal: number): Promise<ApiResult> {
  const user = await requireUser();
  user.monthly_goal = monthly_goal;
  await db.put('users', user);
  localStorage.setItem('user', JSON.stringify(publicUser(user)));
  return ok({ user: publicUser(user) });
}

export async function getGoalSuggestions(): Promise<ApiResult> {
  const user = await requireUser();
  const transactions = await getUserTransactions(user.id);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthSales = transactions
    .filter((t) => t.status !== 'cancelled' && new Date(t.created_at) >= monthStart)
    .reduce((sum, t) => sum + t.total_price, 0);

  const suggested = Math.max(10000, Math.round((monthSales * 1.2) / 1000) * 1000);
  return ok({ suggestions: [suggested, suggested + 10000, suggested + 25000], current: user.monthly_goal ?? 50000 });
}

export async function getProducts(): Promise<ApiResult<Product[]>> {
  const user = await requireUser();
  const products = (await getUserProducts(user.id)).filter((p) => !p.is_archived);
  return ok(products);
}

export async function getArchivedProducts(): Promise<ApiResult<Product[]>> {
  const user = await requireUser();
  const products = (await getUserProducts(user.id)).filter((p) => p.is_archived);
  return ok(products);
}

export async function createProduct(payload: Partial<Product>): Promise<ApiResult> {
  const user = await requireUser();
  const products = await getUserProducts(user.id);
  const existsActive = products.some((p) => p.name === payload.name && !p.is_archived);

  const product = {
    name: payload.name!,
    category: payload.category!,
    pricePerUnit: Number(payload.pricePerUnit),
    stockQuantity: Number(payload.stockQuantity),
    unit: payload.unit || 'kg',
    reorderLevel: Number(payload.reorderLevel ?? 10),
    sack_price: payload.sack_price,
    sack_weight: payload.sack_weight,
    tubo: payload.tubo,
    is_archived: existsActive,
    created_at: new Date().toISOString(),
    user_id: user.id,
  } as Product & { user_id: number };

  const saved = await db.put('products', product);
  const message = existsActive
    ? 'Variety already active. New stock added to Archive (Queue).'
    : 'Product added to active inventory.';

  return ok({ message, product: saved }, 201);
}

export async function updateProduct(id: number, payload: Partial<Product>): Promise<ApiResult> {
  const user = await requireUser();
  const product = await db.getById<Product & { user_id: number }>('products', id);
  if (!product || product.user_id !== user.id) return fail(404, 'Product not found.');

  Object.assign(product, {
    name: payload.name,
    category: payload.category,
    pricePerUnit: Number(payload.pricePerUnit),
    stockQuantity: Number(payload.stockQuantity),
    unit: payload.unit,
    reorderLevel: Number(payload.reorderLevel),
    sack_price: payload.sack_price,
    sack_weight: payload.sack_weight,
    tubo: payload.tubo,
  });

  if (payload.is_archived !== undefined) {
    product.is_archived = Boolean(payload.is_archived);
  }

  const saved = await db.put('products', product);
  return ok({ message: 'Product updated!', product: saved });
}

export async function archiveProduct(id: number): Promise<ApiResult> {
  const user = await requireUser();
  const product = await db.getById<Product & { user_id: number }>('products', id);
  if (!product || product.user_id !== user.id) return fail(404, 'Product not found.');
  product.is_archived = true;
  await db.put('products', product);
  return ok({ message: 'Product archived successfully' });
}

export async function unarchiveProduct(id: number): Promise<ApiResult> {
  const user = await requireUser();
  const product = await db.getById<Product & { user_id: number }>('products', id);
  if (!product || product.user_id !== user.id) return fail(404, 'Product not found.');
  product.is_archived = false;
  const saved = await db.put('products', product);
  return ok(saved);
}

export async function deleteProduct(id: number): Promise<ApiResult> {
  const user = await requireUser();
  const product = await db.getById<Product & { user_id: number }>('products', id);
  if (!product || product.user_id !== user.id) return fail(404, 'Product not found.');
  await db.remove('products', id);
  return ok({ message: 'Product deleted permanently' });
}

export async function createTransaction(payload: {
  product_id: number;
  quantity: number;
  payment_method: string;
  customer_name?: string;
  status?: string;
  discount_applied?: number;
  created_at?: string;
}): Promise<ApiResult> {
  const user = await requireUser();
  const product = await db.getById<Product & { user_id: number }>('products', payload.product_id);
  if (!product || product.user_id !== user.id) return fail(404, 'Product not found.');
  if (product.stockQuantity < payload.quantity) return fail(400, 'Not enough stock!');

  const status =
    ['Credit', 'Utang'].includes(payload.payment_method) ? 'credit' : (payload.status ?? 'paid');

  const createdAt = payload.created_at
    ? new Date(payload.created_at).toISOString()
    : new Date().toISOString();

  const transaction = {
    user_id: user.id,
    product_id: product.id,
    quantity: payload.quantity,
    total_price: product.pricePerUnit * payload.quantity,
    payment_method: payload.payment_method as Transaction['payment_method'],
    customer_name: payload.customer_name,
    status: status as Transaction['status'],
    discount_applied: payload.discount_applied ?? 0,
    created_at: createdAt,
  } as Transaction & { user_id: number };

  const saved = await db.put('transactions', transaction);
  product.stockQuantity -= payload.quantity;
  await db.put('products', product);

  return ok({ message: 'Sale successful!', transaction: saved });
}

export async function getCreditTransactions(): Promise<ApiResult> {
  const user = await requireUser();
  const transactions = (await getUserTransactions(user.id)).filter((t) => t.status === 'credit');
  transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return ok(transactions);
}

export async function updateTransactionStatus(
  id: number,
  payload: { status: string; payment_method: string }
): Promise<ApiResult> {
  const user = await requireUser();
  const transaction = await db.getById<Transaction & { user_id: number }>('transactions', id);
  if (!transaction || transaction.user_id !== user.id) return fail(404, 'Transaction not found.');
  transaction.status = payload.status as Transaction['status'];
  transaction.payment_method = payload.payment_method as Transaction['payment_method'];
  await db.put('transactions', transaction);
  return ok({ message: 'Status updated successfully' });
}

export async function getCustomers(): Promise<ApiResult<string[]>> {
  const user = await requireUser();
  const transactions = await getUserTransactions(user.id);
  const names = [
    ...new Set(
      transactions.map((t) => t.customer_name).filter((n): n is string => Boolean(n))
    ),
  ];
  return ok(names);
}

export async function recommendTubo(category: string, basePricePerKg: number): Promise<ApiResult> {
  const user = await requireUser();
  const baseMargin = category === 'Imported' ? 8 : category === 'Glutinous' ? 12 : 5;
  const products = await getUserProducts(user.id);
  const withTubo = products.filter((p) => p.category === category && (p.tubo ?? 0) > 0);
  const storeAverage =
    withTubo.length > 0 ? withTubo.reduce((sum, p) => sum + (p.tubo ?? 0), 0) / withTubo.length : 0;
  let suggested = storeAverage ? (baseMargin + storeAverage) / 2 : baseMargin;
  if (basePricePerKg > 60) suggested += 2;
  return ok({ recommended_tubo: Math.round(suggested * 100) / 100 });
}

function productCost(product?: Product): number {
  if (!product) return 0;
  return product.pricePerUnit * 0.85;
}

function calcProfit(tx: Transaction): number {
  const product = tx.product;
  if (!product) return tx.total_price * 0.15;
  return tx.total_price - productCost(product) * tx.quantity;
}

export async function getDashboardStats(params: {
  period?: string;
  salesPeriod?: string;
}): Promise<ApiResult> {
  const user = await requireUser();
  const transactions = (await getUserTransactions(user.id)).filter((t) => t.status !== 'cancelled');
  const products = (await getUserProducts(user.id)).filter((p) => !p.is_archived);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const period = params.period ?? 'today';
  const salesPeriod = params.salesPeriod ?? 'last7days';

  const dateRange = (() => {
    switch (period) {
      case 'yesterday':
        return [startOfDay(yesterday), endOfDay(yesterday)] as const;
      case '7days':
        return [startOfDay(new Date(today.getTime() - 7 * 86400000)), endOfDay(today)] as const;
      case '30days':
        return [startOfDay(new Date(today.getTime() - 30 * 86400000)), endOfDay(today)] as const;
      case 'all':
        return [new Date('2000-01-01'), endOfDay(today)] as const;
      default:
        return [startOfDay(today), endOfDay(today)] as const;
    }
  })();

  const salesDateRange = (() => {
    switch (salesPeriod) {
      case '30days':
        return [startOfDay(new Date(today.getTime() - 30 * 86400000)), endOfDay(today)] as const;
      case 'all':
        return [new Date('2000-01-01'), endOfDay(today)] as const;
      default:
        return [startOfDay(new Date(today.getTime() - 7 * 86400000)), endOfDay(today)] as const;
    }
  })();

  const inRange = (tx: Transaction, range: readonly [Date, Date]) => {
    const d = new Date(tx.created_at);
    return d >= range[0] && d <= range[1];
  };

  const todaySales = transactions.filter((tx) => isSameDay(new Date(tx.created_at), today));
  const todayRevenue = todaySales.reduce((sum, t) => sum + t.total_price, 0);

  const monthlySales = transactions
    .filter((tx) => inRange(tx, salesDateRange))
    .reduce<Record<string, number>>((acc, tx) => {
      const key = new Date(tx.created_at).toISOString().slice(0, 10);
      acc[key] = (acc[key] ?? 0) + tx.total_price;
      return acc;
    }, {});

  const varietyBreakdown = transactions
    .filter((tx) => inRange(tx, dateRange))
    .reduce<Record<number, { name: string; volume: number; profit: number }>>((acc, tx) => {
      const id = tx.product_id;
      const name = tx.product?.name ?? 'Deleted Variety';
      const entry = acc[id] ?? { name, volume: 0, profit: 0 };
      entry.volume += tx.quantity;
      entry.profit += calcProfit(tx);
      acc[id] = entry;
      return acc;
    }, {});

  const lowStockItems = products
    .filter((p) => p.stockQuantity <= p.reorderLevel)
    .map((p) => ({
      id: p.id,
      name: p.name,
      current_stock: p.stockQuantity,
      unit: p.unit,
      level: p.reorderLevel,
    }));

  const recentSales = [...transactions]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map((sale) => {
      const isSuki =
        Boolean(sale.customer_name) &&
        sale.customer_name!.toLowerCase() !== 'walk-in' &&
        transactions.filter((t) => t.customer_name === sale.customer_name).length > 1;

      return {
        id: String(sale.id).padStart(3, '0'),
        rice: sale.product?.name ?? 'Deleted Product',
        customer: sale.customer_name ?? 'Walk-In',
        isSuki,
        type: sale.payment_method,
        price: `₱${sale.total_price.toFixed(2)}`,
      };
    });

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const sumInWeek = (start: Date, end: Date) =>
    transactions
      .filter((tx) => {
        const d = new Date(tx.created_at);
        return d >= start && d <= end;
      })
      .reduce((sum, t) => sum + t.total_price, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const lastWeekEnd = new Date(lastWeekStart);
  lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);

  return ok({
    revenue: `₱${todayRevenue.toFixed(2)}`,
    orders: todaySales.length,
    salesToday: todayRevenue,
    todayBreakdown: {
      cash: todaySales.filter((t) => t.payment_method === 'Cash').reduce((s, t) => s + t.total_price, 0),
      online: todaySales.filter((t) => t.payment_method === 'Online Payment').reduce((s, t) => s + t.total_price, 0),
      utang: todaySales.filter((t) => ['Utang', 'Credit'].includes(t.payment_method)).reduce((s, t) => s + t.total_price, 0),
      profit: todaySales.reduce((s, t) => s + calcProfit(t), 0),
    },
    salesYesterday: transactions
      .filter((tx) => isSameDay(new Date(tx.created_at), yesterday))
      .reduce((s, t) => s + t.total_price, 0),
    salesThisWeek: sumInWeek(startOfDay(weekStart), endOfDay(weekEnd)),
    salesLastWeek: sumInWeek(startOfDay(lastWeekStart), endOfDay(lastWeekEnd)),
    monthlySales: Object.entries(monthlySales)
      .map(([date, total]) => ({ date, total: Math.round(total * 100) / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    varietyBreakdown: Object.values(varietyBreakdown)
      .map((v) => ({ ...v, volume: Math.round(v.volume * 100) / 100, profit: Math.round(v.profit * 100) / 100 }))
      .sort((a, b) => b.volume - a.volume),
    lowStockCount: lowStockItems.length,
    lowStockItems,
    recentSales,
  });
}

export async function getTrends(): Promise<ApiResult> {
  const user = await requireUser();
  const transactions = (await getUserTransactions(user.id)).filter((t) => t.status !== 'cancelled');
  const products = await getUserProducts(user.id);
  const now = new Date();
  const monthlyTarget = user.monthly_goal ?? 50000;

  const currentMonthSales = transactions
    .filter((t) => {
      const d = new Date(t.created_at);
      return t.status === 'paid' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, t) => sum + t.total_price, 0);

  const thisMonthCustomers = [
    ...new Set(
      transactions
        .filter((t) => {
          const d = new Date(t.created_at);
          return d.getMonth() === now.getMonth() && t.customer_name;
        })
        .map((t) => t.customer_name!)
    ),
  ];

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const returningCount = thisMonthCustomers.filter((name) =>
    transactions.some((t) => t.customer_name === name && new Date(t.created_at) < monthStart)
  ).length;

  const totalUniqueThisMonth = thisMonthCustomers.length;
  const newCustomersCount = totalUniqueThisMonth - returningCount;
  const retentionRate = totalUniqueThisMonth > 0 ? Math.round((returningCount / totalUniqueThisMonth) * 100) : 0;

  const totalKilosSold = transactions.reduce((sum, t) => sum + t.quantity, 0) || 1;
  const varietyDemand = Object.values(
    transactions.reduce<Record<number, { name: string; percentage: number; qty: number }>>((acc, tx) => {
      const id = tx.product_id;
      const entry = acc[id] ?? { name: tx.product?.name ?? 'Deleted Variety', percentage: 0, qty: 0 };
      entry.qty += tx.quantity;
      acc[id] = entry;
      return acc;
    }, {})
  ).map((v) => ({ name: v.name, percentage: Math.round((v.qty / totalKilosSold) * 100) }));

  const totalStock = products.filter((p) => !p.is_archived).reduce((sum, p) => sum + p.stockQuantity, 0);
  const recentSales = transactions
    .filter((t) => new Date(t.created_at) >= new Date(now.getTime() - 7 * 86400000))
    .reduce((sum, t) => sum + t.quantity, 0);
  const dailyBurnRate = recentSales > 0 ? recentSales / 7 : 5;

  let projected = totalStock;
  const stockForecast = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => {
    const level = Math.max(0, Math.round(projected));
    projected -= dailyBurnRate;
    return { day, level, isPredicted: true };
  });

  const peakHours = Object.entries(
    transactions.reduce<Record<string, number>>((acc, tx) => {
      const hour = new Date(tx.created_at).getHours().toString().padStart(2, '0');
      acc[hour] = (acc[hour] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const totalRevenue = transactions.reduce((sum, t) => sum + t.total_price, 0);
  const allTimeProfit = transactions.reduce((sum, t) => sum + calcProfit(t), 0);

  const activeProducts = products.filter((p) => !p.is_archived);
  const lowestStockProduct = [...activeProducts].sort((a, b) => a.stockQuantity - b.stockQuantity)[0];

  let storeInsight = `Retention is at ${retentionRate}%. ${retentionRate > 50 ? 'Focus on Suki loyalty rewards.' : 'Increase local awareness marketing.'}`;
  if (lowestStockProduct) {
    if (lowestStockProduct.stockQuantity <= lowestStockProduct.reorderLevel) {
      storeInsight = `CRITICAL STOCK: ${lowestStockProduct.name.toUpperCase()} has dropped to ${lowestStockProduct.stockQuantity} kg! Reorder immediately.`;
    } else if (lowestStockProduct.stockQuantity <= lowestStockProduct.reorderLevel + 15) {
      storeInsight = `LOW STOCK WARNING: ${lowestStockProduct.name.toUpperCase()} is getting low (${lowestStockProduct.stockQuantity} kg). Contact your supplier soon.`;
    }
  }

  const slowMoving = [...activeProducts]
    .filter((p) => p.stockQuantity > 0)
    .sort(
      (a, b) =>
        transactions.filter((t) => t.product_id === a.id).reduce((s, t) => s + t.quantity, 0) -
        transactions.filter((t) => t.product_id === b.id).reduce((s, t) => s + t.quantity, 0)
    )
    .slice(0, 3)
    .map((p) => ({ name: p.name, stock: p.stockQuantity, unit: p.unit ?? 'kg' }));

  const last7 = new Date(now.getTime() - 7 * 86400000);
  const prev7 = new Date(now.getTime() - 14 * 86400000);
  const revThisWeek = transactions.filter((t) => new Date(t.created_at) >= last7).reduce((s, t) => s + t.total_price, 0);
  const revLastWeek = transactions
    .filter((t) => {
      const d = new Date(t.created_at);
      return d >= prev7 && d < last7;
    })
    .reduce((s, t) => s + t.total_price, 0);
  const revenueGrowth = revLastWeek > 0 ? Math.round(((revThisWeek - revLastWeek) / revLastWeek) * 1000) / 10 : 0;

  const varietyProfitability = Object.values(
    transactions.reduce<Record<number, { name: string; profit: number; rev: number }>>((acc, tx) => {
      const id = tx.product_id;
      const entry = acc[id] ?? { name: tx.product?.name ?? 'Deleted Variety', profit: 0, rev: 0 };
      entry.rev += tx.total_price;
      entry.profit += calcProfit(tx);
      acc[id] = entry;
      return acc;
    }, {})
  )
    .map((v) => ({
      name: v.name,
      profit: Math.round(v.profit * 100) / 100,
      margin: v.rev > 0 ? Math.round((v.profit / v.rev) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);

  const marginSpreadData = Array.from({ length: 7 }, (_, i) => {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() - (6 - i));
    const dayTx = transactions.filter((tx) => isSameDay(new Date(tx.created_at), targetDate));
    const revenue = dayTx.reduce((s, t) => s + t.total_price, 0);
    const cogs = dayTx.reduce((s, t) => s + productCost(t.product) * t.quantity, 0);
    return { date: DAY_NAMES[targetDate.getDay()], revenue: Math.round(revenue * 100) / 100, cogs: Math.round(cogs * 100) / 100 };
  });

  const heatmapRaw = Array.from({ length: 7 }, () => [0, 0, 0, 0]);
  let maxHeat = 0;
  transactions.forEach((tx) => {
    const d = new Date(tx.created_at);
    const dayIndex = (d.getDay() + 6) % 7;
    const hour = d.getHours();
    const shift = hour < 11 ? 0 : hour < 15 ? 1 : hour < 19 ? 2 : 3;
    heatmapRaw[dayIndex][shift]++;
    maxHeat = Math.max(maxHeat, heatmapRaw[dayIndex][shift]);
  });

  const heatmapData = heatmapRaw.map((row) =>
    row.map((count) => (maxHeat > 0 ? Math.round((count / maxHeat) * 100) : 0))
  );

  const bestSeller = Object.values(
    transactions.reduce<Record<number, { name: string; qty: number }>>((acc, tx) => {
      const id = tx.product_id;
      const entry = acc[id] ?? { name: tx.product?.name ?? 'Deleted Variety', qty: 0 };
      entry.qty += tx.quantity;
      acc[id] = entry;
      return acc;
    }, {})
  ).sort((a, b) => b.qty - a.qty)[0];

  return ok({
    varietyDemand,
    varietyProfitability,
    lowestStock: lowestStockProduct,
    stockForecast,
    peakHours,
    kpiSummary: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      unitsSold: Math.round(transactions.reduce((s, t) => s + t.quantity, 0) * 100) / 100,
      avgTransactionValue: transactions.length > 0 ? Math.round((totalRevenue / transactions.length) * 100) / 100 : 0,
      allTimeProfit: Math.round(allTimeProfit * 100) / 100,
      profitMargin: totalRevenue > 0 ? Math.round((allTimeProfit / totalRevenue) * 1000) / 10 : 0,
      monthlyProgress: {
        current: currentMonthSales,
        target: monthlyTarget,
        percentage: monthlyTarget > 0 ? Math.round((currentMonthSales / monthlyTarget) * 1000) / 10 : 0,
      },
    },
    bestSellerPrediction: bestSeller?.name ?? 'No Data',
    storeInsight,
    aiRecommendation: storeInsight,
    advancedMetrics: {
      totalUtang: Math.round(transactions.filter((t) => t.status === 'credit').reduce((s, t) => s + t.total_price, 0) * 100) / 100,
      avgBasketSize: transactions.length > 0 ? Math.round((transactions.reduce((s, t) => s + t.quantity, 0) / transactions.length) * 100) / 100 : 0,
      daysOfInventory: dailyBurnRate > 0 ? Math.round(totalStock / dailyBurnRate) : 0,
      slowMoving,
      revenueGrowth,
    },
    customerHealth: [
      { name: 'Returning (Suki)', value: retentionRate, fill: '#ea580c' },
      { name: 'New Customers', value: totalUniqueThisMonth > 0 ? Math.round((newCustomersCount / totalUniqueThisMonth) * 100) : 0, fill: '#fcd34d' },
    ],
    marginSpreadData,
    heatmapData,
  });
}

function formatLedger(transactions: Transaction[]) {
  const header = ['Transaction ID', 'Customer Name', 'Rice Variety', 'Quantity', 'Total', 'Method', 'Time', 'raw_created', 'raw_updated'];
  const rows = [header];
  transactions.forEach((t) => {
    rows.push([
      `INV-${t.id}`,
      t.customer_name ?? 'Walk-in',
      t.product?.name ?? 'Deleted',
      `${t.quantity}${t.product?.unit ?? 'kg'}`,
      t.total_price.toFixed(2),
      t.payment_method,
      new Date(t.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
      t.created_at,
      t.created_at,
    ]);
  });
  return rows;
}

export async function getReport(type: string, searchParams: URLSearchParams): Promise<ApiResult> {
  const user = await requireUser();
  const transactions = await getUserTransactions(user.id);
  const products = await getUserProducts(user.id);
  const today = new Date();

  let start = startOfDay(today);
  let end = endOfDay(today);

  if (searchParams.get('month') && searchParams.get('year')) {
    const month = Number(searchParams.get('month'));
    const year = Number(searchParams.get('year'));
    start = new Date(year, month - 1, 1);
    end = endOfDay(new Date(year, month, 0));
  } else if (searchParams.get('start') && searchParams.get('end')) {
    start = startOfDay(new Date(searchParams.get('start')!));
    end = endOfDay(new Date(searchParams.get('end')!));
  }

  const filterTx = () => {
    let list = [...transactions];
    const customer = searchParams.get('customer');
    const payment = searchParams.get('payment_method');
    const rice = searchParams.get('rice');

    if (customer) list = list.filter((t) => t.customer_name?.toLowerCase().includes(customer.toLowerCase()));
    if (payment) list = list.filter((t) => t.payment_method === payment);
    if (rice) list = list.filter((t) => t.product?.name.toLowerCase().includes(rice.toLowerCase()));
    return list;
  };

  if (type === 'customers') {
    const grouped = filterTx()
      .filter((t) => t.customer_name && new Date(t.created_at) >= start && new Date(t.created_at) <= end)
      .reduce<Record<string, { orders: number; total_spent: number; last_visit: string; total_kg: number }>>((acc, t) => {
        const name = t.customer_name!;
        const entry = acc[name] ?? { orders: 0, total_spent: 0, last_visit: t.created_at, total_kg: 0 };
        entry.orders += 1;
        entry.total_spent += t.total_price;
        entry.total_kg += t.quantity;
        if (new Date(t.created_at) > new Date(entry.last_visit)) entry.last_visit = t.created_at;
        acc[name] = entry;
        return acc;
      }, {});

    const ledger = [['ID', 'Customer Name', 'Total Orders', 'Total Spent', 'Status', 'Last Visit']];
    Object.entries(grouped).forEach(([name, c], idx) => {
      ledger.push([
        `SUKI-${idx + 1}`,
        name,
        String(c.orders),
        String(c.total_kg),
        c.total_spent.toFixed(2),
        new Date(c.last_visit).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
      ]);
    });
    return ok({ ledger });
  }

  if (type === 'inventory') {
    const rice = searchParams.get('rice');
    let list = products;
    if (rice) list = list.filter((p) => p.name.toLowerCase().includes(rice.toLowerCase()));
    const ledger = [['SKU', 'Variety Name', 'Stock Level', 'Inventory Value', 'Status', 'Last Update']];
    list.forEach((p) => {
      ledger.push([
        'N/A',
        p.name,
        `${p.stockQuantity}${p.unit ?? 'kg'}`,
        (p.stockQuantity * p.pricePerUnit).toFixed(2),
        p.stockQuantity <= p.reorderLevel ? 'LOW' : 'OK',
        new Date(p.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
      ]);
    });
    return ok({ ledger });
  }

  if (type === 'top_products') {
    const grouped = filterTx()
      .filter((t) => new Date(t.created_at) >= start && new Date(t.created_at) <= end)
      .reduce<Record<number, { name: string; total_qty: number; total_rev: number }>>((acc, t) => {
        const entry = acc[t.product_id] ?? { name: t.product?.name ?? 'Unknown', total_qty: 0, total_rev: 0 };
        entry.total_qty += t.quantity;
        entry.total_rev += t.total_price;
        acc[t.product_id] = entry;
        return acc;
      }, {});

    const ledger = [['Rank', 'Variety', 'Total Sold', 'Total Revenue', 'Performance']];
    Object.values(grouped)
      .sort((a, b) => b.total_rev - a.total_rev)
      .forEach((t, idx) => {
        ledger.push([`#${idx + 1}`, t.name, String(t.total_qty), t.total_rev.toFixed(2), 'High Demand']);
      });
    return ok({ ledger });
  }

  let filtered = filterTx();
  switch (type) {
    case 'today':
      filtered = filtered.filter((t) => isSameDay(new Date(t.created_at), today));
      break;
    case 'yesterday': {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      filtered = filtered.filter((t) => isSameDay(new Date(t.created_at), y));
      break;
    }
    case 'utang':
      filtered = filtered.filter((t) => t.status === 'credit');
      break;
    case 'all':
      if (searchParams.get('month') || searchParams.get('start')) {
        filtered = filtered.filter((t) => {
          const d = new Date(t.created_at);
          return d >= start && d <= end;
        });
      }
      break;
    default:
      filtered = filtered.filter((t) => {
        const d = new Date(t.created_at);
        return d >= start && d <= end;
      });
  }

  filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return ok({ ledger: formatLedger(filtered), filename: `GrainFlow-${type.charAt(0).toUpperCase()}${type.slice(1)}-Report` });
}

export async function exportData(): Promise<ApiResult> {
  const user = await requireUser();
  const products = await getUserProducts(user.id);
  const transactions = await getUserTransactions(user.id);
  return ok({
    exportedAt: new Date().toISOString(),
    user: publicUser(user),
    products,
    transactions,
  });
}

export async function importData(payload: {
  user?: Partial<StoredUser>;
  products?: Product[];
  transactions?: Transaction[];
}): Promise<ApiResult> {
  const user = await requireUser();
  if (payload.user?.monthly_goal) {
    user.monthly_goal = payload.user.monthly_goal;
    await db.put('users', user);
  }

  if (payload.products) {
    for (const p of payload.products) {
      await db.put('products', { ...p, user_id: user.id });
    }
  }

  if (payload.transactions) {
    for (const t of payload.transactions) {
      await db.put('transactions', { ...t, user_id: user.id });
    }
  }

  localStorage.setItem('user', JSON.stringify(publicUser(user)));
  return ok({ message: 'Data imported successfully.' });
}
