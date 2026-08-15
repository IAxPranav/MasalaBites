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
  X,
  Printer,
  IndianRupee,
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
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);

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

  const handleMarkPaid = async (orderId: string) => {
    setMarkingPaid(true);
    await supabase
      .from('orders')
      .update({ payment_status: 'paid', updated_at: new Date().toISOString() })
      .eq('id', orderId);
    setMarkingPaid(false);
    await fetchOrders();
    // Refresh selectedOrder from latest data
    setSelectedOrder((prev) =>
      prev ? { ...prev, payment_status: 'paid' } : null
    );
  };

  const handlePrintBill = (order: OrderWithItems) => {
    const billHtml = generateBillHtml(order);
    const printWin = window.open('', '_blank', 'width=400,height=600');
    if (!printWin) return;
    printWin.document.write(billHtml);
    printWin.document.close();
    printWin.focus();
    printWin.print();
    printWin.close();
  };

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
                <h1 className="text-base font-bold text-[var(--admin-ink)] lg:text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>Cash Counter</h1>
                <p className="text-[0.68rem] tracking-widest uppercase text-[var(--admin-ink-soft)]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  Masala Bites · Click a card to collect payment
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
            <div className="ml-auto text-[0.65rem] text-[var(--admin-ink-muted)] self-center" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Updated: {formatTime(lastUpdated.toISOString())}
            </div>
          </div>
        </div>
      </div>

      {/* Read-only notice */}
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5">
          <UtensilsCrossed className="h-4 w-4 text-blue-600 shrink-0" />
          <p className="text-xs text-blue-700 font-medium">
            <strong>Tap any card</strong> to view order details, collect payment, and print a bill.
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
                  <h2 className="text-base font-bold text-[var(--admin-ink)]" style={{ fontFamily: 'Inter, sans-serif' }}>Awaiting Payment</h2>
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
                      onClick={() => setSelectedOrder(order)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Paid section */}
            {paidOrders.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="text-base font-bold text-[var(--admin-ink)]" style={{ fontFamily: 'Inter, sans-serif' }}>Paid Orders</h2>
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
                      onClick={() => setSelectedOrder(order)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Detail / Payment Modal */}
      {selectedOrder && (
        <PaymentModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onMarkPaid={handleMarkPaid}
          onPrintBill={handlePrintBill}
          markingPaid={markingPaid}
        />
      )}
    </div>
  );
}

/* ── Order Card ─────────────────────────────────────────────── */
function CounterOrderCard({
  order,
  formatPrice,
  formatTime,
  onClick,
}: {
  order: OrderWithItems;
  formatPrice: (p: number) => string;
  formatTime: (d: string) => string;
  onClick: () => void;
}) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;
  const minutesAgo = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);
  const isReady = order.status === 'ready';
  const isPaid = order.payment_status === 'paid';

  return (
    <button
      onClick={onClick}
      className={`admin-card relative overflow-hidden w-full text-left transition-all hover:shadow-md active:scale-[0.98] cursor-pointer ${
        isReady && !isPaid ? 'ring-2 ring-green-400 ring-offset-1' : ''
      } ${!isPaid ? 'hover:border-[var(--admin-accent)]' : ''}`}
    >
      {isReady && !isPaid && (
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
            <p className="text-xs font-semibold text-[var(--admin-ink)]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              #{order.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="text-[0.65rem] text-[var(--admin-ink-soft)]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {formatTime(order.created_at)}{minutesAgo > 0 && ` · ${minutesAgo}m ago`}
            </p>
          </div>
        </div>
        <span className={`admin-badge ${cfg.badgeClass}`}>
          <StatusIcon className="h-3 w-3" />
          {cfg.label}
        </span>
      </div>

      {/* Items summary */}
      <div className="mb-3 space-y-1 border-t border-[var(--admin-border)] pt-3">
        {order.order_items.slice(0, 3).map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[var(--admin-bg-alt)] text-[0.65rem] font-bold text-[var(--admin-ink-soft)]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {item.quantity}
            </span>
            <span className="truncate text-sm text-[var(--admin-ink)]">{item.name}</span>
          </div>
        ))}
        {order.order_items.length > 3 && (
          <p className="text-xs text-[var(--admin-ink-muted)]">+{order.order_items.length - 3} more items</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[var(--admin-border)] pt-3">
        <div>
          <p className="text-[0.6rem] uppercase text-[var(--admin-ink-muted)]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Total</p>
          <p className="text-base font-bold text-[var(--admin-ink)]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {formatPrice(order.total)}
          </p>
        </div>
        <span
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
            isPaid
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-amber-200 bg-amber-50 text-amber-700'
          }`}
        >
          {isPaid ? '✓ Paid' : '⏳ Tap to Pay'}
        </span>
      </div>
    </button>
  );
}

/* ── Payment Modal ──────────────────────────────────────────── */
function PaymentModal({
  order,
  onClose,
  onMarkPaid,
  onPrintBill,
  markingPaid,
}: {
  order: OrderWithItems;
  onClose: () => void;
  onMarkPaid: (id: string) => Promise<void>;
  onPrintBill: (order: OrderWithItems) => void;
  markingPaid: boolean;
}) {
  const isPaid = order.payment_status === 'paid';
  const formatPrice = (price: number) => `₹${Math.round(price)}`;
  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });

  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        style={{ fontFamily: 'Inter, sans-serif' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--admin-ink)] font-mono text-sm font-bold text-white">
              T{order.table_number}
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--admin-ink)]">
                Table {order.table_number}
              </p>
              <p className="text-[0.65rem] text-[var(--admin-ink-soft)]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                #{order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`admin-badge ${cfg.badgeClass}`}>
              <StatusIcon className="h-3 w-3" />
              {cfg.label}
            </span>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--admin-bg-alt)] text-[var(--admin-ink-soft)] hover:bg-[var(--admin-border)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Bill Content */}
        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
          <p className="mb-3 text-[0.65rem] text-[var(--admin-ink-muted)]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {formatDateTime(order.created_at)}
          </p>

          {/* Items */}
          <div className="mb-4 space-y-2">
            {order.order_items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[var(--admin-bg-alt)] text-[0.65rem] font-bold text-[var(--admin-ink-soft)]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {item.quantity}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-[var(--admin-ink)]">{item.name}</p>
                    {item.notes && (
                      <p className="text-[0.65rem] italic text-[var(--admin-ink-muted)]">{item.notes}</p>
                    )}
                  </div>
                </div>
                <p className="shrink-0 text-sm font-semibold text-[var(--admin-ink)]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="my-3 border-t border-dashed border-[var(--admin-border)]" />

          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[var(--admin-ink)]">Total Amount</span>
            <span className="text-lg font-bold text-[var(--admin-ink)]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {formatPrice(order.total)}
            </span>
          </div>

          {/* Payment Status */}
          <div className="mt-3 flex items-center justify-between rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-alt)] p-3">
            <span className="text-xs text-[var(--admin-ink-soft)]">Payment Status</span>
            <span className={`text-sm font-bold ${isPaid ? 'text-green-600' : 'text-amber-600'}`}>
              {isPaid ? '✓ Paid' : 'Pending'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-[var(--admin-border)] px-5 py-4">
          <div className="flex gap-2">
            {/* Print Bill */}
            <button
              onClick={() => onPrintBill(order)}
              className="admin-btn-ghost flex-1 justify-center py-3"
            >
              <Printer className="h-4 w-4" />
              Print Bill
            </button>

            {/* Collect Payment */}
            {!isPaid ? (
              <button
                onClick={() => onMarkPaid(order.id)}
                disabled={markingPaid}
                className="admin-btn-primary flex-[2] justify-center py-3 text-sm disabled:opacity-60"
              >
                <IndianRupee className="h-4 w-4" />
                {markingPaid ? 'Processing...' : `Collect ₹${Math.round(order.total)}`}
              </button>
            ) : (
              <button
                onClick={() => onPrintBill(order)}
                className="flex flex-[2] items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 py-3 text-sm font-semibold text-green-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                Payment Collected — Print Receipt
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Bill HTML Generator ─────────────────────────────────────── */
function generateBillHtml(order: OrderWithItems): string {
  const fmt = (n: number) => `Rs. ${Math.round(n)}`;
  const now = new Date().toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  const itemsHtml = order.order_items.map((item) => `
    <tr>
      <td style="padding:6px 4px;border-bottom:1px solid #eee;">${item.quantity}x ${item.name}${item.notes ? `<br><small style="color:#888;font-style:italic;">${item.notes}</small>` : ''}</td>
      <td style="padding:6px 4px;border-bottom:1px solid #eee;text-align:right;font-family:monospace;">${fmt(item.price * item.quantity)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bill - Table ${order.table_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; font-size: 13px; max-width: 300px; margin: 0 auto; padding: 16px; }
    .header { text-align: center; border-bottom: 2px dashed #333; padding-bottom: 12px; margin-bottom: 12px; }
    .header h1 { font-size: 20px; font-weight: bold; letter-spacing: 2px; }
    .header p { font-size: 11px; color: #666; margin-top: 2px; }
    .info { margin-bottom: 12px; font-size: 11px; }
    .info p { display: flex; justify-content: space-between; padding: 2px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    th { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; padding: 4px; background: #f5f5f5; }
    .total-row { border-top: 2px solid #333; font-weight: bold; }
    .total-row td { padding: 8px 4px; font-size: 15px; }
    .footer { text-align: center; margin-top: 16px; padding-top: 12px; border-top: 2px dashed #333; font-size: 11px; color: #666; }
    .paid-stamp { display: inline-block; margin-top: 8px; border: 2px solid green; color: green; font-weight: bold; font-size: 16px; padding: 4px 16px; transform: rotate(-5deg); letter-spacing: 3px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>MASALA BITES</h1>
    <p>Modern Indian Kitchen</p>
    <p style="margin-top:4px;">🌶 Authentic Flavours 🌶</p>
  </div>

  <div class="info">
    <p><span>Table</span><span><strong>Table ${order.table_number}</strong></span></p>
    <p><span>Order ID</span><span>#${order.id.slice(0, 8).toUpperCase()}</span></p>
    <p><span>Date & Time</span><span>${now}</span></p>
    <p><span>Payment</span><span>Cash Counter</span></p>
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align:left;">Item</th>
        <th style="text-align:right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td><strong>TOTAL</strong></td>
        <td style="text-align:right;font-family:monospace;"><strong>${fmt(order.total)}</strong></td>
      </tr>
    </tfoot>
  </table>

  ${order.payment_status === 'paid' ? '<div style="text-align:center;"><span class="paid-stamp">PAID</span></div>' : ''}

  <div class="footer">
    <p>Thank you for dining with us!</p>
    <p style="margin-top:4px;">Visit us again 🙏</p>
    <p style="margin-top:8px;font-size:10px;">Masala Bites &mdash; www.masalabites.com</p>
  </div>
</body>
</html>`;
}
