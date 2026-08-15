import { useEffect, useState } from 'react';
import { ArrowLeft, CreditCard, Store, CheckCircle2, Loader2, Receipt, Bell } from 'lucide-react';
import { supabase, type CartItem } from '@/lib/supabase';

type CheckoutScreenProps = {
  items: CartItem[];
  totalAmount: number;
  tableNumber: number;
  customerPhone: string | null;
  onCustomerPhoneChange: (phone: string | null) => void;
  onBack: () => void;
  onOrderPlaced: (orderId: string, paymentMethod: 'counter' | 'online') => void;
  onClearCart: () => void;
};

type PaymentMethod = 'counter' | 'online';

export default function CheckoutScreen({
  items,
  totalAmount,
  tableNumber,
  customerPhone,
  onCustomerPhoneChange,
  onBack,
  onOrderPlaced,
  onClearCart,
}: CheckoutScreenProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('counter');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(customerPhone ?? '');
  const [allowNotifications, setAllowNotifications] = useState(() => {
    try {
      return localStorage.getItem('masala-bites-order-notifications') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    setPhoneNumber(customerPhone ?? '');
  }, [customerPhone]);

  const formatPrice = (price: number) => `¥${Math.round(price)}`;
  const taxRate = 0.1;
  const tax = totalAmount * taxRate;
  const grandTotal = totalAmount + tax;

  const normalizePhone = (value: string) => value.replace(/\D/g, '').slice(-10);

  const placeOrder = async (phoneValue: string) => {
    setPlacing(true);
    setError(null);
    try {
      const cleanPhone = normalizePhone(phoneValue);
      if (!cleanPhone) {
        throw new Error('Phone number is required');
      }

      onCustomerPhoneChange(cleanPhone);
      localStorage.setItem('masala-bites-order-notifications', String(allowNotifications));

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          table_number: tableNumber,
          customer_phone: cleanPhone,
          status: 'pending',
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'online' ? 'paid' : 'unpaid',
          total: grandTotal,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        notes: item.notes || null,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      onClearCart();
      onOrderPlaced(order.id, paymentMethod);
    } catch (err) {
      console.error('Error placing order:', err);
      setError('Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
      setShowPhoneModal(false);
    }
  };

  const confirmOrder = async () => {
    const cleanPhone = normalizePhone(phoneNumber);
    if (!cleanPhone) {
      setError('Please add your phone number so we can track your order.');
      return;
    }

    if (allowNotifications && 'Notification' in window) {
      try {
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }
      } catch {
        // ignore browser permission issues
      }
    }

    await placeOrder(cleanPhone);
  };

  return (
    <div className="min-h-screen bg-bg pb-8">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-bg-alt/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-4 lg:px-8">
          <button onClick={onBack} className="icon-btn">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="font-display text-xl font-bold text-ink lg:text-2xl">Checkout</h1>
        </div>
        <div className="h-px w-full bg-line" />
      </div>

      <div className="mx-auto max-w-5xl px-5 py-5 lg:px-8 lg:py-8">
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Left: Order Summary */}
          <div className="rounded-2xl border border-line bg-surface p-5 lg:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
                <Receipt className="h-4 w-4 text-primary" />
                Order Summary
              </h2>
              <span className="rounded-full border border-line bg-bg-alt px-2.5 py-0.5 font-mono text-xs font-semibold text-primary">
                T{tableNumber}
              </span>
            </div>
            <div className="space-y-2.5">
              {items.map((item, index) => (
                <div
                  key={`${item.menu_item_id}-${item.notes}-${index}`}
                  className="flex items-start justify-between text-sm"
                >
                  <div className="flex-1">
                    <span className="font-medium text-ink">
                      {item.quantity}x {item.name}
                    </span>
                    {item.notes && (
                      <p className="text-xs italic text-primary">"{item.notes}"</p>
                    )}
                  </div>
                  <span className="ml-3 font-mono font-medium text-ink-soft">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1.5 border-t border-line pt-4">
              <div className="flex justify-between text-sm text-ink-soft">
                <span>Subtotal</span>
                <span className="font-mono">{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm text-ink-soft">
                <span>Tax (10%)</span>
                <span className="font-mono">{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between border-t border-line pt-2 font-mono text-base font-bold text-ink">
                <span>Total</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Right: Payment + Place Order */}
          <div className="space-y-5">
            <div className="rounded-2xl border border-line bg-surface p-5 lg:p-6">
              <h2 className="mb-4 text-sm font-bold text-ink">Payment Method</h2>
              <div className="space-y-3">
                <button
                  onClick={() => setPaymentMethod('counter')}
                  className={`flex w-full items-center gap-3 rounded-2xl border-2 p-4 transition-all ${
                    paymentMethod === 'counter'
                      ? 'border-primary bg-primary/5'
                      : 'border-line bg-surface hover:border-primary/30'
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                      paymentMethod === 'counter' ? 'bg-primary text-surface' : 'bg-bg-alt text-ink-soft'
                    }`}
                  >
                    <Store className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-ink">Pay at Counter</p>
                    <p className="text-xs text-ink-soft">Pay with cash or card at the counter</p>
                  </div>
                  {paymentMethod === 'counter' && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </button>

                <button
                  onClick={() => setPaymentMethod('online')}
                  className={`flex w-full items-center gap-3 rounded-2xl border-2 p-4 transition-all ${
                    paymentMethod === 'online'
                      ? 'border-primary bg-primary/5'
                      : 'border-line bg-surface hover:border-primary/30'
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                      paymentMethod === 'online' ? 'bg-primary text-surface' : 'bg-bg-alt text-ink-soft'
                    }`}
                  >
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-ink">Online Payment</p>
                    <p className="text-xs text-ink-soft">Pay now with credit card or digital wallet</p>
                  </div>
                  {paymentMethod === 'online' && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-chili/20 bg-chili/5 p-3 text-sm text-chili">
                {error}
              </div>
            )}

            <button
              disabled={placing || items.length === 0}
              onClick={() => setShowPhoneModal(true)}
              className="btn-primary w-full"
            >
              {placing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Placing Order...
                </>
              ) : (
                <>Place Order - {formatPrice(grandTotal)}</>
              )}
            </button>
          </div>
        </div>
      </div>

      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-line bg-surface p-5 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-xl font-bold text-ink">Just one quick thing</p>
                <p className="text-xs text-ink-soft">So we can track your order later.</p>
              </div>
            </div>

            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. 98765 43210"
              className="w-full rounded-2xl border border-line bg-bg-alt px-3 py-3 text-sm text-ink outline-none transition-colors focus:border-primary"
            />

            <label className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-bg-alt p-3 text-sm text-ink">
              <input
                type="checkbox"
                checked={allowNotifications}
                onChange={(e) => setAllowNotifications(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Send me playful order status updates
            </label>

            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowPhoneModal(false)} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
              <button onClick={confirmOrder} className="btn-primary flex-1 justify-center" disabled={placing}>
                {placing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
