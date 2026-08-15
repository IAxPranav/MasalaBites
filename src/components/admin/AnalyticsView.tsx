import { useState, useEffect, useCallback, useMemo } from 'react';
import { TrendingUp, UtensilsCrossed, Clock, Award, ShoppingBag } from 'lucide-react';
import { supabase, type OrderWithItems } from '@/lib/supabase';

type DateRange = 'today' | 'week' | 'month' | 'all';

export default function AnalyticsView() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<DateRange>('week');

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
      .limit(1000);
    if (error) console.error('Error fetching orders:', error);
    setOrders((data as OrderWithItems[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getRangeStart = () => {
    const now = new Date();
    if (range === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    if (range === 'week') { const d = new Date(now); d.setDate(d.getDate() - 7); return d.toISOString(); }
    if (range === 'month') { const d = new Date(now); d.setDate(d.getDate() - 30); return d.toISOString(); }
    return null;
  };

  const filteredOrders = useMemo(() => {
    const start = getRangeStart();
    return start ? orders.filter((o) => new Date(o.created_at) >= new Date(start)) : orders;
  }, [orders, range]);

  // Total revenue
  const totalRevenue = filteredOrders
    .filter((o) => o.payment_status === 'paid')
    .reduce((sum, o) => sum + Number(o.total), 0);

  // Average order value
  const avgOrderValue = filteredOrders.length > 0
    ? totalRevenue / Math.max(1, filteredOrders.filter((o) => o.payment_status === 'paid').length)
    : 0;

  // Top selling items
  const itemSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
  for (const order of filteredOrders) {
    for (const item of order.order_items) {
      if (!itemSales[item.name]) itemSales[item.name] = { name: item.name, quantity: 0, revenue: 0 };
      itemSales[item.name].quantity += item.quantity;
      itemSales[item.name].revenue += Number(item.price) * item.quantity;
    }
  }
  const topItems = Object.values(itemSales).sort((a, b) => b.quantity - a.quantity).slice(0, 8);

  // Orders by status
  const statusCounts: Record<string, number> = {};
  for (const order of filteredOrders) {
    statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
  }

  // Orders by hour (for today/week)
  const hourlyOrders: Record<number, number> = {};
  for (const order of filteredOrders) {
    const hour = new Date(order.created_at).getHours();
    hourlyOrders[hour] = (hourlyOrders[hour] || 0) + 1;
  }
  const peakHours = Object.entries(hourlyOrders)
    .map(([h, c]) => ({ hour: parseInt(h, 10), count: c }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Daily revenue (last 7 days)
  const dailyRevenue: { day: string; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
    const rev = orders
      .filter((o) => {
        const d = new Date(o.created_at);
        return d >= dayStart && d < dayEnd && o.payment_status === 'paid';
      })
      .reduce((sum, o) => sum + Number(o.total), 0);
    dailyRevenue.push({
      day: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
      revenue: rev,
    });
  }
  const maxDailyRev = Math.max(...dailyRevenue.map((d) => d.revenue), 1);

  const formatPrice = (price: number) => `¥${Math.round(price)}`;

  const rangeLabels: Record<DateRange, string> = {
    today: 'Today',
    week: 'Last 7 days',
    month: 'Last 30 days',
    all: 'All time',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-primary" />
      </div>
    );
  }

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

      {/* KPI cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-cardamom/20 bg-cardamom/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-cardamom" />
            <span className="font-mono text-[0.6rem] text-cardamom">REVENUE</span>
          </div>
          <p className="font-mono text-2xl font-bold text-ink">{formatPrice(totalRevenue)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="mb-2 flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-ink-soft" />
            <span className="font-mono text-[0.6rem] text-ink-soft">ORDERS</span>
          </div>
          <p className="font-mono text-2xl font-bold text-ink">{filteredOrders.length}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="mb-2 flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 text-ink-soft" />
            <span className="font-mono text-[0.6rem] text-ink-soft">AVG ORDER</span>
          </div>
          <p className="font-mono text-2xl font-bold text-ink">{formatPrice(avgOrderValue)}</p>
        </div>
        <div className="rounded-2xl border border-saffron/20 bg-saffron/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-mono text-[0.6rem] text-primary">ITEMS SOLD</span>
          </div>
          <p className="font-mono text-2xl font-bold text-ink">
            {Object.values(itemSales).reduce((sum, i) => sum + i.quantity, 0)}
          </p>
        </div>
      </div>

      {/* Daily revenue chart */}
      <div className="mb-6 rounded-2xl border border-line bg-surface p-5">
        <h3 className="mb-4 font-display text-lg font-bold text-ink">Revenue (Last 7 Days)</h3>
        <div className="flex items-end justify-between gap-2" style={{ height: 160 }}>
          {dailyRevenue.map((d, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-primary to-saffron transition-all duration-500"
                  style={{
                    height: `${Math.max(2, (d.revenue / maxDailyRev) * 100)}%`,
                    minHeight: 4,
                  }}
                />
              </div>
              <span className="font-mono text-[0.6rem] text-ink-soft">{d.day}</span>
              <span className="font-mono text-[0.55rem] text-ink-soft/70">{formatPrice(d.revenue)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Top selling items */}
        <div className="rounded-2xl border border-line bg-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-saffron" />
            <h3 className="font-display text-lg font-bold text-ink">Top Selling Dishes</h3>
          </div>
          {topItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-soft">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {topItems.map((item, i) => {
                const maxQty = topItems[0].quantity;
                const pct = (item.quantity / maxQty) * 100;
                return (
                  <div key={item.name}>
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-bg-alt font-mono text-[0.6rem] font-bold text-ink-soft">
                          {i + 1}
                        </span>
                        <span className="text-sm font-medium text-ink">{item.name}</span>
                      </div>
                      <span className="font-mono text-xs text-ink-soft">{item.quantity} sold</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-bg-alt">
                      <div
                        className="h-full rounded-full bg-saffron transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Peak hours */}
        <div className="rounded-2xl border border-line bg-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-bold text-ink">Peak Hours</h3>
          </div>
          {peakHours.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-soft">No order data yet</p>
          ) : (
            <div className="space-y-3">
              {peakHours.map((h, i) => {
                const maxCount = peakHours[0].count;
                const pct = (h.count / maxCount) * 100;
                return (
                  <div key={h.hour}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium text-ink">
                        {h.hour}:00 - {h.hour + 1}:00
                      </span>
                      <span className="font-mono text-xs text-ink-soft">{h.count} orders</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-bg-alt">
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
      </div>

      {/* Order status breakdown */}
      <div className="mt-5 rounded-2xl border border-line bg-surface p-5">
        <h3 className="mb-4 font-display text-lg font-bold text-ink">Order Status Breakdown</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {['pending', 'preparing', 'ready', 'completed', 'cancelled'].map((status) => (
            <div key={status} className="rounded-xl border border-line bg-bg-alt/50 p-3 text-center">
              <p className="font-mono text-xl font-bold text-ink">{statusCounts[status] || 0}</p>
              <p className="mt-0.5 font-mono text-[0.6rem] capitalize text-ink-soft">{status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
