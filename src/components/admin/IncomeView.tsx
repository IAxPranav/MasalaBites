import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Store, CreditCard, CheckCircle2, Clock, X } from 'lucide-react';
import { supabase, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, type OrderWithItems } from '@/lib/supabase';

type DateRange = 'today' | 'week' | 'month' | 'all';

export default function IncomeView() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<DateRange>('today');
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) console.error('Error fetching orders:', error);
    setOrders((data as OrderWithItems[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getRangeStart = () => {
    const now = new Date();
    if (range === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return start.toISOString();
    }
    if (range === 'week') {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return start.toISOString();
    }
    if (range === 'month') {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      return start.toISOString();
    }
    return null;
  };

  const rangeStart = getRangeStart();
  const filteredOrders = rangeStart
    ? orders.filter((o) => new Date(o.created_at) >= new Date(rangeStart))
    : orders;

  const paidOrders = filteredOrders.filter((o) => o.payment_status === 'paid');
  const unpaidOrders = filteredOrders.filter((o) => o.payment_status === 'unpaid');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const pendingRevenue = unpaidOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const counterCount = filteredOrders.filter((o) => o.payment_method === 'counter').length;
  const onlineCount = filteredOrders.filter((o) => o.payment_method === 'online').length;

  const formatPrice = (price: number) => `¥${Math.round(price)}`;
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  // Group by table
  const byTable: Record<number, { count: number; revenue: number }> = {};
  for (const order of paidOrders) {
    if (!byTable[order.table_number]) byTable[order.table_number] = { count: 0, revenue: 0 };
    byTable[order.table_number].count += 1;
    byTable[order.table_number].revenue += Number(order.total);
  }
  const tableRows = Object.entries(byTable)
    .map(([table, data]) => ({ table: parseInt(table, 10), ...data }))
    .sort((a, b) => b.revenue - a.revenue);

  const rangeLabels: Record<DateRange, string> = {
    today: 'Today',
    week: 'Last 7 days',
    month: 'Last 30 days',
    all: 'All time',
  };

  return (
    <div>
      {/* Range selector */}
      <div className="mb-5 flex gap-2 overflow-x-auto hide-scrollbar">
        {(['today', 'week', 'month', 'all'] as DateRange[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`chip ${range === r ? 'is-active' : ''}`}
          >
            {rangeLabels[r]}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-cardamom/20 bg-cardamom/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-cardamom" />
            <span className="font-mono text-[0.6rem] text-cardamom">REVENUE</span>
          </div>
          <p className="font-mono text-2xl font-bold text-ink">{formatPrice(totalRevenue)}</p>
          <p className="mt-0.5 text-xs text-ink-soft">{paidOrders.length} paid orders</p>
        </div>
        <div className="rounded-2xl border border-saffron/20 bg-saffron/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-mono text-[0.6rem] text-primary">PENDING</span>
          </div>
          <p className="font-mono text-2xl font-bold text-ink">{formatPrice(pendingRevenue)}</p>
          <p className="mt-0.5 text-xs text-ink-soft">{unpaidOrders.length} unpaid orders</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="mb-2 flex items-center gap-2">
            <Store className="h-4 w-4 text-ink-soft" />
            <span className="font-mono text-[0.6rem] text-ink-soft">COUNTER</span>
          </div>
          <p className="font-mono text-2xl font-bold text-ink">{counterCount}</p>
          <p className="mt-0.5 text-xs text-ink-soft">pay at counter</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="mb-2 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-ink-soft" />
            <span className="font-mono text-[0.6rem] text-ink-soft">ONLINE</span>
          </div>
          <p className="font-mono text-2xl font-bold text-ink">{onlineCount}</p>
          <p className="mt-0.5 text-xs text-ink-soft">online payment</p>
        </div>
      </div>

      {/* Revenue by table */}
      <div className="mb-6">
        <h3 className="mb-3 font-display text-lg font-bold text-ink">Revenue by Table</h3>
        {tableRows.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface p-8 text-center">
            <p className="text-sm text-ink-soft">No paid orders in this period</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {tableRows.map((row) => {
              const maxRevenue = tableRows[0].revenue;
              const pct = (row.revenue / maxRevenue) * 100;
              return (
                <div key={row.table} className="rounded-xl border border-line bg-surface p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink font-mono text-xs font-bold text-surface">
                        T{row.table}
                      </div>
                      <div>
                        <p className="font-mono text-sm font-bold text-ink">{formatPrice(row.revenue)}</p>
                        <p className="font-mono text-[0.6rem] text-ink-soft">{row.count} orders</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-alt">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent orders */}
      <div>
        <h3 className="mb-3 font-display text-lg font-bold text-ink">Recent Orders</h3>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border border-line bg-surface" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface p-8 text-center">
            <p className="text-sm text-ink-soft">No orders in this period</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredOrders.slice(0, 30).map((order) => (
              <button
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="flex w-full items-center justify-between rounded-xl border border-line bg-surface p-3 text-left transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink font-mono text-xs font-bold text-surface">
                    T{order.table_number}
                  </div>
                  <div>
                    <p className="font-mono text-xs font-semibold text-ink">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="font-mono text-[0.65rem] text-ink-soft">{formatTime(order.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold text-ink">{formatPrice(Number(order.total))}</p>
                    <p className={`font-mono text-[0.6rem] ${order.payment_status === 'paid' ? 'text-cardamom' : 'text-primary'}`}>
                      {order.payment_status === 'paid' ? (
                        <span className="flex items-center gap-0.5"><CheckCircle2 className="h-2.5 w-2.5" /> Paid</span>
                      ) : 'Unpaid'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-surface p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink font-mono text-sm font-bold text-surface">
                  T{selectedOrder.table_number}
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-ink">Order Details</h2>
                  <p className="font-mono text-xs text-ink-soft">#{selectedOrder.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="icon-btn">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 border-t border-line pt-4">
              {selectedOrder.order_items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div>
                    <span className="font-medium text-ink">{item.quantity}x {item.name}</span>
                    {item.notes && <p className="text-xs italic text-primary">"{item.notes}"</p>}
                  </div>
                  <span className="font-mono font-medium text-ink-soft">{formatPrice(Number(item.price) * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-1.5 border-t border-line pt-4">
              <div className="flex justify-between text-sm text-ink-soft">
                <span>Status</span>
                <span className="font-medium text-ink">{ORDER_STATUS_LABELS[selectedOrder.status]}</span>
              </div>
              <div className="flex justify-between text-sm text-ink-soft">
                <span>Payment</span>
                <span className="font-medium text-ink">
                  {selectedOrder.payment_method === 'counter' ? 'Counter' : 'Online'}
                </span>
              </div>
              <div className="flex justify-between text-sm text-ink-soft">
                <span>Payment Status</span>
                <span className={`font-medium ${selectedOrder.payment_status === 'paid' ? 'text-cardamom' : 'text-primary'}`}>
                  {selectedOrder.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                </span>
              </div>
              <div className="flex justify-between font-mono text-base font-bold text-ink">
                <span>Total</span>
                <span>{formatPrice(Number(selectedOrder.total))}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
