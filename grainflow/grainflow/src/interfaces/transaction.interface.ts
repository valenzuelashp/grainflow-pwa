import type { Product } from './product.interface';

export interface Transaction {
  id: number;
  user_id: number;
  product_id: number;
  product?: Product;
  quantity: number;
  total_price: number;
  payment_method: 'Cash' | 'Online Payment' | 'Utang';
  customer_name?: string;
  status: 'paid' | 'credit' | 'cancelled';
  discount_applied: number;
  created_at: string;
}
