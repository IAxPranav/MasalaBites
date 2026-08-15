import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: { params: { eventsPerSecond: 10 } },
});

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  available: boolean;
  sort_order: number;
  veg: boolean;
  spice_level: number;
  is_special: boolean;
  created_at: string;
};

export type CartItem = {
  menu_item_id: string;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
  notes: string;
};

export type Order = {
  id: string;
  table_number: number;
  customer_phone: string | null;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  payment_method: 'counter' | 'online';
  payment_status: 'unpaid' | 'paid';
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name: string;
  price: number;
  quantity: number;
  notes: string | null;
  is_ready: boolean;
  ready_at: string | null;
  created_at: string;
};

export type OrderWithItems = Order & {
  order_items: OrderItem[];
};

export type Review = {
  id: string;
  menu_item_id: string | null;
  rating: number;
  comment: string | null;
  customer_name: string | null;
  show_on_menu: boolean;
  created_at: string;
};

export const CATEGORIES = [
  'Starters',
  'Main Course',
  'Biryani & Rice',
  'Breads',
  'South Indian',
  'Desserts',
  'Beverages',
] as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'New',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-saffron/15 text-primary border-saffron/30',
  preparing: 'bg-blue-50 text-blue-700 border-blue-200',
  ready: 'bg-cardamom/15 text-cardamom border-cardamom/30',
  completed: 'bg-stone-100 text-stone-500 border-stone-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
};

export function spiceLabel(level: number): string {
  return ['', 'Mild', 'Medium', 'Hot'][level] || '';
}

export function spiceDots(level: number): number[] {
  return [0, 1, 2].map((i) => i < level ? 1 : 0);
}
