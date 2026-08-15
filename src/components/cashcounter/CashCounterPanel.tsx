import { useEffect, useState, useCallback } from 'react';
import {
  Receipt,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Store,
  ChefHat,
  Bell,
  UtensilsCrossed,
} from 'lucide-react';
import { supabase, type OrderWithItems } from '@/lib/supabase';

type CashCounterPanelProps = {
  onExit: () => void;
};

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string; icon: typeof Clock }> = {
  pending: { label: 'New', badgeClass: 'admin-badge-pending', icon: Clock },
  preparing: { label: 'Preparing', badgeClass: 'admin-badge-preparing', icon: ChefHat },
  ready: { label: 'Ready', badgeClass: 'admin-badge-ready', icon: Bell },
  completed: { label: 'Completed', badgeClass: 'admin-badge-completed', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', badgeClass: 'admin-badge-cancelled', icon: AlertCircle },
};

export default function CashCounterPanel({ onExit }: CashCounterPanelProps) {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('payment_method', 'counter')
      .not('status', 'eq', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) console.error('Error fetching orders:', error);
    setOrders((data as OrderWithItems[]) || []);
    setLoading(false);
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel('cashcounter-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders]);

  const unpaidOrders = orders.filter((o) => o.payment_status === 'unpaid');
  const paidOrders = orders.filter((o) => o.payment_status === 'paid');

  const formatPrice = (price: number) => `₹${Math.round(price)}`;
  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const readyCount = orders.filter((o) => o.status === 'ready').length;

  return (
    <div className="admin-shell min-h-screen">
      {/* Header */}
      <div className="admin-header">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[var(--admin-accent)] bg-[var(--admin-accent-soft)]">
                <Receipt className="h-5 w-5 text-[var(--admin-accent)]" />
              </div>
              <div>
                <h1 className="text-base font-bold text-[var(--admin-ink)] lg:text-lg">Cash Counter</h1>
                <p className="text-[0.68rem] font-mono tracking-widest uppercase text-[var(--admin-ink-soft)]">
                  Masala Bites · Read-only View
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {readyCount > 0 && (
                <div className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5">
                  <Bell className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-xs font-bold text-green-700">{readyCount} Ready</span>
                </div>
              )}
              <button onClick={fetchOrders} className="admin-btn-ghost p-2">
                <RefreshCw className="h-4 w-4" />
              </button>
              <button onClick={onExit} className="admin-btn-ghost">
                <LogOut className="h-3.5 w-3.5" />
                Exit
              </button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-3 flex flex-wrap gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg-alt)] px-3 py-2">
              <Store className="h-4 w-4 text-[var(--admin-ink-soft)]" />
              <span className="text-xs font-semibold text-[var(--admin-ink)]">{orders.length} Counter Orders</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-semibold text-amber-700">{unpaidOrders.length} Unpaid</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-xs font-semibold text-green-700">{paidOrders.length} Paid</span>
            </div>
            <div className="ml-auto text-[0.65rem] text-[var(--admin-ink-muted)] self-center">
              Updated: {formatTime(lastUpdated.toISOString())}
            </div>
          </div>
        </div>
      </div>

      {/* Read-only notice */}
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
        <div className="flex items-center gap-2 rounded-lg border border-[var(--admin-blue)] border-opacity-30 bg-[var(--admin-blue-soft)] px-4 py-2.5">
          <UtensilsCrossed className="h-4 w-4 text-[var(--admin-blue)] shrink-0" />
          <p className="text-xs text-[var(--admin-blue)] font-medium">
            <strong>Read-only mode.</strong> This panel shows kitchen status for counter payment orders. Status changes are managed by kitchen staff only.
          </p>
        </div>
      </div>

      {/* Orders */}
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-alt)]" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--admin-bg-alt)]">
              <Store className="h-8 w-8 text-[var(--admin-border)]" />
            </div>
            <p className="text-sm font-medium text-[var(--admin-ink-soft)]">No counter orders</p>
            <p className="mt-1 text-xs text-[var(--admin-ink-muted)]">
              Counter payment orders will appear here in real-time
            </p>
          </div>
        ) : (
          <>
            {/* Unpaid section */}
            {unpaidOrders.length > 0 && (
              <div className="mb-8">
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="text-base font-bold text-[var(--admin-ink)]">Awaiting Payment</h2>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                    {unpaidOrders.length}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {unpaidOrders.map((order) => (
                    <CounterOrderCard
                      key={order.id}
                      order={order}
                      formatPrice={formatPrice}
                      formatTime={formatTime}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Paid section */}
            {paidOrders.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="text-base font-bold text-[var(--admin-ink)]">Paid Orders</h2>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
                    {paidOrders.length}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {paidOrders.map((order) => (
                    <CounterOrderCard
                      key={order.id}
                      order={order}
                      formatPrice={formatPrice}
                      formatTime={formatTime}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CounterOrderCard({
  order,
  formatPrice,
  formatTime,
}: {
  order: OrderWithItems;
  formatPrice: (p: number) => string;
  formatTime: (d: string) => string;
}) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;
  const minutesAgo = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);
  const isReady = order.status === 'ready';

  return (
    <div
      className={`admin-card relative overflow-hidden transition-all ${
        isReady ? 'ring-2 ring-green-400 ring-offset-1' : ''
      }`}
    >
      {isReady && (
        <div className="absolute right-0 top-0 rounded-bl-xl bg-green-500 px-3 py-1">
          <span className="text-[0.65rem] font-bold text-white">READY TO SERVE</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--admin-ink)] font-mono text-sm font-bold text-white">
            T{order.table_number}
          </div>
          <div>
            <p className="admin-mono text-xs font-semibold text-[var(--admin-ink)]">
              #{order.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="admin-mono text-[0.65rem] text-[var(--admin-ink-soft)]">
              {formatTime(order.created_at)}{minutesAgo > 0 && ` · ${minutesAgo}m ago`}
            </p>
          </div>
        </div>
        <span className={`admin-badge ${cfg.badgeClass}`}>
          <StatusIcon className="h-3 w-3" />
          {cfg.label}
        </span>
      </div>

      {/* Items */}
      <div className="mb-3 space-y-1.5 border-t border-[var(--admin-border)] pt-3">
        {order.order_items.map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-[var(--admin-bg-alt)] font-mono text-[0.65rem] font-bold text-[var(--admin-ink-soft)]">
                {item.quantity}
              </span>
              <span className="text-sm text-[var(--admin-ink)]">{item.name}</span>
            </div>
            {item.is_ready && (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[var(--admin-border)] pt-3">
        <div>
          <p className="admin-mono text-[0.6rem] uppercase text-[var(--admin-ink-muted)]">Total</p>
          <p className="admin-mono text-base font-bold text-[var(--admin-ink)]">
            {formatPrice(order.total)}
          </p>
        </div>
        <span
          className={`rounded-lg border px-3 py-1 text-xs font-semibold ${
            order.payment_status === 'paid'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-amber-200 bg-amber-50 text-amber-700'
          }`}
        >
          {order.payment_status === 'paid' ? '✓ Paid' : '⏳ Unpaid'}
        </span>
      </div>
    </div>
  );
}
