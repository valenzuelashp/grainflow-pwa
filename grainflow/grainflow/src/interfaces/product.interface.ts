export interface Product {
  id: number;
  name: string;
  category: string;
  pricePerUnit: number;
  sack_price?: number;
  tubo?: number;
  sack_weight?: number; // 25 or 50
  stockQuantity: number;
  unit: string;
  reorderLevel: number;
  is_archived: boolean;
  created_at: string; // ISO 8601 timestamp
}
