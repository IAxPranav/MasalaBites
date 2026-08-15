import { useState, useCallback, useEffect } from 'react';
import type { CartItem, MenuItem } from '@/lib/supabase';

const STORAGE_KEY = 'masala-bites-cart';
const TABLE_KEY = 'masala-bites-table';

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((menuItem: MenuItem, quantity: number = 1, notes: string = '') => {
    setItems((prev) => {
      const existing = prev.find(
        (item) => item.menu_item_id === menuItem.id && item.notes === notes,
      );
      if (existing) {
        return prev.map((item) =>
          item === existing ? { ...item, quantity: item.quantity + quantity } : item,
        );
      }
      return [
        ...prev,
        {
          menu_item_id: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          image_url: menuItem.image_url,
          quantity,
          notes,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((menuItemId: string, notes: string, delta: number) => {
    setItems((prev) => {
      return prev
        .map((item) => {
          if (item.menu_item_id === menuItemId && item.notes === notes) {
            return { ...item, quantity: item.quantity + delta };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  }, []);

  const removeItem = useCallback((menuItemId: string, notes: string) => {
    setItems((prev) =>
      prev.filter((item) => !(item.menu_item_id === menuItemId && item.notes === notes)),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    totalItemCount,
    totalAmount,
  };
}

export function useTableNumber() {
  const [tableNumber, setTableNumberState] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem(TABLE_KEY);
      return stored ? parseInt(stored, 10) : null;
    } catch {
      return null;
    }
  });

  const setTableNumber = useCallback((num: number | null) => {
    setTableNumberState(num);
    if (num === null) {
      localStorage.removeItem(TABLE_KEY);
    } else {
      localStorage.setItem(TABLE_KEY, String(num));
    }
  }, []);

  return { tableNumber, setTableNumber };
}
