import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import type { CartItem } from '@/lib/supabase';

type CartDrawerProps = {
  open: boolean;
  items: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (menuItemId: string, notes: string, delta: number) => void;
  onRemoveItem: (menuItemId: string, notes: string) => void;
  onCheckout: () => void;
  totalAmount: number;
  tableNumber: number;
};

export default function CartDrawer({
  open,
  items,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  totalAmount,
  tableNumber,
}: CartDrawerProps) {
  const formatPrice = (price: number) => `¥${Math.round(price)}`;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Panel: bottom sheet on mobile, right-side drawer on desktop */}
      <div
        className={`fixed z-50 flex flex-col bg-surface shadow-2xl transition-transform duration-300 ease-out
          bottom-0 left-0 right-0 max-h-[85vh] rounded-t-3xl
          lg:top-0 lg:right-0 lg:bottom-0 lg:left-auto lg:max-h-none lg:w-[420px] lg:rounded-t-none lg:rounded-l-3xl
          ${open ? 'translate-y-0 lg:translate-x-0' : 'translate-y-full lg:translate-y-0 lg:translate-x-full'}`}
      >
        {/* Handle (mobile only) */}
        <div className="flex justify-center pt-3 lg:hidden">
          <div className="h-1.5 w-12 rounded-full bg-line" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 lg:pt-6">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-bold text-ink">Your Order</h2>
            <span className="rounded-full border border-line bg-bg-alt px-2 py-0.5 font-mono text-xs font-semibold text-primary">
              T{tableNumber}
            </span>
          </div>
          <button onClick={onClose} className="icon-btn">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-bg-alt">
                <ShoppingBag className="h-8 w-8 text-line" />
              </div>
              <p className="text-sm font-medium text-ink-soft">Your cart is empty</p>
              <p className="mt-1 text-xs text-ink-soft/70">Add some delicious dishes to get started</p>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {items.map((item, index) => (
                <div
                  key={`${item.menu_item_id}-${item.notes}-${index}`}
                  className="flex gap-3 rounded-2xl border border-line bg-bg/50 p-3"
                >
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-16 w-16 flex-shrink-0 rounded-xl object-cover"
                  />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-ink">{item.name}</h3>
                      <button
                        onClick={() => onRemoveItem(item.menu_item_id, item.notes)}
                        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-chili/10 hover:text-chili"
                        aria-label="Remove from cart"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {item.notes && (
                      <p className="mt-0.5 text-xs italic text-primary">"{item.notes}"</p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <span className="font-mono text-sm font-bold text-ink">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                      <div className="stepper-sm">
                        <button onClick={() => onUpdateQuantity(item.menu_item_id, item.notes, -1)}>
                          <Minus className="h-3 w-3" />
                        </button>
                        <span>{item.quantity}</span>
                        <button onClick={() => onUpdateQuantity(item.menu_item_id, item.notes, 1)}>
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-line px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-ink-soft">Total</span>
              <span className="font-mono text-2xl font-bold text-ink">
                {formatPrice(totalAmount)}
              </span>
            </div>
            <button onClick={onCheckout} className="btn-primary w-full">
              Proceed to Checkout
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
