import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ChefHat, Bell, ArrowLeft, Receipt, Flame } from 'lucide-react';
import { supabase, ORDER_STATUS_LABELS, type Order, type OrderItem } from '@/lib/supabase';

type OrderConfirmationProps = {
  orderId: string;
  tableNumber: number;
  customerPhone: string | null;
  onBackToMenu: () => void;
};

export default function OrderConfirmation({
  orderId,
  tableNumber,
  customerPhone,
  onBackToMenu,
}: OrderConfirmationProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const previousReadyItemsRef = useRef<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('masala-bites-order-notifications') === 'true';
    } catch {
      return false;
    }
  });
  const previousStatusRef = useRef<string | null>(null);

  const isNotificationUnsupported = () => {
    const ua = navigator.userAgent || '';
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isStandalone =
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      window.matchMedia?.('(display-mode: standalone)').matches;
    return isIOS && !isStandalone;
  };
  const showStatusAlert = (title: string, body: string) => {
    try {
      if (
        notificationsEnabled &&
        'Notification' in window &&
        !isNotificationUnsupported() &&
        Notification.permission === 'granted'
      ) {
        new Notification(title, { body });
      }

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([120, 50, 120]);
      }
    } catch {
      // ignore browser API issues
    }
  };

  useEffect(() => {
    fetchOrder();

    const ordersChannel = supabase
      .channel(`order-updates-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => setOrder(payload.new as Order)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items', filter: `order_id=eq.${orderId}` },
        () => {
          // Re-fetch or update order items when an item's status changes
          supabase
            .from('order_items')
            .select('*')
            .eq('order_id', orderId)
            .then(({ data }) => {
              if (data) setOrderItems(data);
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, [orderId]);

  useEffect(() => {
    setNotificationsEnabled(
      (() => {
        try {
          return localStorage.getItem('masala-bites-order-notifications') === 'true';
        } catch {
          return false;
        }
      })(),
    );
  }, [customerPhone]);

  useEffect(() => {
    if (!order) return;
    const nextStatus = order.status;
    if (previousStatusRef.current && previousStatusRef.current !== nextStatus) {
      const statusMessages: Record<string, string> = {
        pending: 'Kitchen got your order — we are on it!',
        preparing: 'The chef is firing it up — your meal is getting delicious.',
        ready: 'Your food is ready to grab — come get your feast!',
        completed: 'Everything is wrapped up — enjoy your meal!',
      };

      const message = statusMessages[nextStatus] || 'Your order status just changed.';
      showStatusAlert(`Order update: ${ORDER_STATUS_LABELS[nextStatus]}`, message);
    }
    previousStatusRef.current = nextStatus;
  }, [order, notificationsEnabled]);

  useEffect(() => {
    const readyItems = orderItems.filter((item) => item.is_ready);
    const readyNames = readyItems.map((item) => item.name);
    const newReadyNames = readyNames.filter((name) => !previousReadyItemsRef.current.includes(name));

    if (newReadyNames.length > 0) {
      const readyText =
        newReadyNames.length === 1
          ? `${newReadyNames[0]} is ready!`
          : `${newReadyNames.join(', ')} are ready!`;
      showStatusAlert('Your order is ready', readyText);
    }

    previousReadyItemsRef.current = readyNames;
  }, [orderItems]);

  const fetchOrder = async () => {
    const { data: orderData } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    const { data: itemsData } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);
    setOrder(orderData);
    setOrderItems(itemsData || []);
    setLoading(false);
  };

  const formatPrice = (price: number) => `¥${Math.round(price)}`;
  const status = order?.status || 'pending';
  const readyItems = orderItems.filter((item) => item.is_ready);
  const readyItemNames = readyItems.map((item) => item.name);

  const steps = [
    { key: 'pending', label: 'Order Received', icon: Receipt },
    { key: 'preparing', label: 'Preparing', icon: ChefHat },
    { key: 'ready', label: 'Ready to Serve', icon: Bell },
    { key: 'completed', label: 'Completed', icon: CheckCircle2 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === status);

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-bg-alt/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-4 lg:px-8">
          <button onClick={onBackToMenu} className="icon-btn">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="font-display text-xl font-bold text-ink lg:text-2xl">Order Status</h1>
        </div>
        <div className="h-px w-full bg-line" />
      </div>

      <div className="mx-auto max-w-5xl px-5 py-6 lg:px-8 lg:py-10">
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Left: Status tracker */}
          <div>
            {/* Stamp Banner */}
            <div className="mb-6 flex flex-col items-center text-center lg:items-start lg:text-left">
              <div className="stamp-in mb-3 flex h-20 w-20 items-center justify-center rounded-full border-3 border-cardamom bg-cardamom/10">
                <CheckCircle2 className="h-10 w-10 text-cardamom" />
              </div>
              <h2 className="font-display text-2xl font-bold text-ink lg:text-3xl">Order Placed!</h2>
              <p className="mt-1 text-sm text-ink-soft lg:text-base">
                Your order has been sent to the kitchen. We'll start preparing it right away.
              </p>
            </div>

            {/* Status Tracker */}
            <div className="rounded-2xl border border-line bg-surface p-5 lg:p-6">
              <div className="mb-5 flex items-center justify-between">
                <span className="eyebrow">Table {tableNumber}</span>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${
                    status === 'pending'
                      ? 'border-saffron/30 bg-saffron/15 text-primary'
                      : status === 'preparing'
                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                        : status === 'ready'
                          ? 'border-cardamom/30 bg-cardamom/15 text-cardamom'
                          : 'border-stone-200 bg-stone-100 text-stone-500'
                  }`}
                >
                  {ORDER_STATUS_LABELS[status]}
                </span>
              </div>

              <div className="relative">
                <div className="absolute left-5 top-5 h-[calc(100%-2.5rem)] w-0.5 bg-line" />
                <div
                  className="absolute left-5 top-5 w-0.5 bg-gradient-to-b from-primary to-cardamom transition-all duration-500"
                  style={{
                    height: `${Math.max(0, (currentStepIndex / (steps.length - 1)) * 100)}%`,
                  }}
                />

                <div className="space-y-5">
                  {steps.map((step, index) => {
                    const isDone = index < currentStepIndex;
                    const isActive = index === currentStepIndex;
                    const Icon = step.icon;
                    return (
                      <div key={step.key} className="relative flex items-center gap-4">
                        <div
                          className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
                            isDone
                              ? 'bg-cardamom text-surface'
                              : isActive
                                ? 'bg-primary text-surface shadow-lg shadow-primary/30 ring-4 ring-primary/10'
                                : 'bg-bg-alt text-ink-soft'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p
                            className={`text-sm font-bold ${
                              isDone || isActive ? 'text-ink' : 'text-ink-soft'
                            }`}
                          >
                            {step.label}
                          </p>
                          {isActive && (
                            <p className="font-mono text-xs text-primary">In progress...</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Order details */}
          <div>
            {!loading && order && (
              <div className="rounded-2xl border border-line bg-surface p-5 lg:p-6">
                <h3 className="mb-3 text-sm font-bold text-ink">Order Details</h3>
                {readyItemNames.length > 0 && (
                  <div className="mb-4 rounded-2xl border border-cardamom/30 bg-cardamom/10 p-3 text-sm text-cardamom">
                    <span className="font-bold">Ready now:</span> {readyItemNames.join(', ')}
                  </div>
                )}

                <div className="space-y-2">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between gap-3 text-sm">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ink">
                            {item.quantity}x {item.name}
                          </span>
                          {item.is_ready && (
                            <span className="rounded-full border border-cardamom/30 bg-cardamom/10 px-2 py-0.5 text-[0.6rem] font-bold uppercase text-cardamom">
                              Ready
                            </span>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-xs italic text-primary">"{item.notes}"</p>
                        )}
                      </div>
                      <span className="font-mono font-medium text-ink-soft">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 border-t border-line pt-3">
                  <div className="flex justify-between text-sm text-ink-soft">
                    <span>Payment</span>
                    <span className="font-medium text-ink">
                      {order.payment_method === 'counter' ? 'Pay at Counter' : 'Online Payment'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-ink-soft">
                    <span>Payment Status</span>
                    <span
                      className={`font-medium ${
                        order.payment_status === 'paid' ? 'text-cardamom' : 'text-primary'
                      }`}
                    >
                      {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between font-mono text-base font-bold text-ink">
                    <span>Total</span>
                    <span>{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>
            )}

            <button onClick={onBackToMenu} className="btn-secondary mt-5 w-full justify-center">
              <Flame className="h-4 w-4 text-primary" />
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
