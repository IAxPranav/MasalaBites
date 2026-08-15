import { useEffect, useState, useCallback } from 'react';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Bell,
  Store,
  CreditCard,
  RefreshCw,
  UtensilsCrossed,
  Receipt,
  AlertCircle,
} from 'lucide-react';
import {
  supabase,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  type OrderWithItems,
} from '@/lib/supabase';

type KitchenPanelProps = {
  onExit: () => void;
};

type FilterStatus = 'all' | 'pending' | 'preparing' | 'ready' | 'completed';

export default function KitchenPanel({ onExit }: KitchenPanelProps) {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    let query = supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;
    if (error) console.error('Error fetching orders:', error);
    setOrders((data as OrderWithItems[]) || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchOrders(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        () => fetchOrders(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);
    setUpdatingId(null);
    fetchOrders();
  };

  const toggleItemReady = async (itemId: string, isReady: boolean) => {
    setUpdatingId(itemId);
    await supabase
      .from('order_items')
      .update({ is_ready: !isReady, ready_at: !isReady ? new Date().toISOString() : null })
      .eq('id', itemId);
    setUpdatingId(null);
    fetchOrders();
  };

  const togglePaymentStatus = async (orderId: string, currentStatus: string) => {
    setUpdatingId(orderId);
    const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
    await supabase
      .from('orders')
      .update({ payment_status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId);
    setUpdatingId(null);
    fetchOrders();
  };

  const formatPrice = (price: number) => `¥${Math.round(price)}`;
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const preparingCount = orders.filter((o) => o.status === 'preparing').length;
  const readyCount = orders.filter((o) => o.status === 'ready' || o.order_items.some((item) => item.is_ready)).length;

  const filterTabs: { key: FilterStatus; label: string; count?: number }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'New', count: pendingCount },
    { key: 'preparing', label: 'Preparing', count: preparingCount },
    { key: 'ready', label: 'Ready', count: readyCount },
    { key: 'completed', label: 'Done' },
  ];

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-primary">
                <ChefHat className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-base font-bold text-ink lg:text-lg">Kitchen Panel</h1>
                <p className="eyebrow">Masala Bites - Live</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchOrders} className="icon-btn">
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                onClick={onExit}
                className="flex h-9 items-center gap-1.5 rounded-full border border-line bg-bg px-3 text-xs font-semibold text-ink-soft transition-colors hover:border-primary hover:text-primary"
              >
                <UtensilsCrossed className="h-3.5 w-3.5" />
                Exit
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-3 flex gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-saffron/20 bg-saffron/10 px-3 py-2 lg:max-w-xs">
              <Clock className="h-4 w-4 text-primary" />
              <div>
                <p className="font-mono text-lg font-bold leading-none text-primary">{pendingCount}</p>
                <p className="font-mono text-[0.6rem] text-primary">NEW</p>
              </div>
            </div>
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 lg:max-w-xs">
              <ChefHat className="h-4 w-4 text-blue-600" />
              <div>
                <p className="font-mono text-lg font-bold leading-none text-blue-700">{preparingCount}</p>
                <p className="font-mono text-[0.6rem] text-blue-600">PREP</p>
              </div>
            </div>
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-cardamom/20 bg-cardamom/10 px-3 py-2 lg:max-w-xs">
              <Bell className="h-4 w-4 text-cardamom" />
              <div>
                <p className="font-mono text-lg font-bold leading-none text-cardamom">{readyCount}</p>
                <p className="font-mono text-[0.6rem] text-cardamom">READY</p>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mt-3 flex gap-1.5 overflow-x-auto hide-scrollbar">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  filter === tab.key
                    ? 'bg-ink text-surface'
                    : 'bg-bg-alt text-ink-soft hover:bg-line'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 font-mono text-[0.6rem] ${
                      filter === tab.key ? 'bg-surface/20 text-surface' : 'bg-primary/15 text-primary'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl border border-line bg-surface" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-bg-alt">
              <Receipt className="h-8 w-8 text-line" />
            </div>
            <p className="text-sm font-medium text-ink-soft">No orders found</p>
            <p className="mt-1 text-xs text-ink-soft/70">
              {filter === 'all' ? 'Orders will appear here in real-time' : `No ${filter} orders at the moment`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                updating={updatingId === order.id || updatingId !== null && order.order_items.some((item) => item.id === updatingId)}
                onUpdateStatus={updateOrderStatus}
                onTogglePayment={togglePaymentStatus}
                onToggleItemReady={toggleItemReady}
                formatPrice={formatPrice}
                formatTime={formatTime}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({
  order,
  updating,
  onUpdateStatus,
  onTogglePayment,
  onToggleItemReady,
  formatPrice,
  formatTime,
}: {
  order: OrderWithItems;
  updating: boolean;
  onUpdateStatus: (orderId: string, status: string) => void;
  onTogglePayment: (orderId: string, currentStatus: string) => void;
  onToggleItemReady: (itemId: string, isReady: boolean) => void;
  onToggleItemReady: (itemId: string, isReady: boolean) => void;
  formatPrice: (price: number) => string;
  formatTime: (dateStr: string) => string;
}) {
  const status = order.status;
  const minutesAgo = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);

  const nextStatus: Record<string, string> = {
    pending: 'preparing',
    preparing: 'ready',
    ready: 'completed',
  };

  const nextStatusLabel: Record<string, string> = {
    pending: 'Start Preparing',
    preparing: 'Mark Ready',
    ready: 'Mark Completed',
  };

  return (
    <div
      className={`rounded-2xl border bg-surface p-4 transition-shadow hover:shadow-md ${
        status === 'pending'
          ? 'border-saffron/40'
          : status === 'ready'
            ? 'border-cardamom/40'
            : 'border-line'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink font-mono text-sm font-bold text-surface">
            T{order.table_number}
          </div>
          <div>
            <p className="font-mono text-xs font-semibold text-ink-soft">
              #{order.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="font-mono text-xs text-ink-soft/70">
              {formatTime(order.created_at)}
              {minutesAgo > 0 && ` - ${minutesAgo}m ago`}
            </p>
          </div>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-bold ${ORDER_STATUS_COLORS[status]}`}
        >
          {ORDER_STATUS_LABELS[status]}
        </span>
      </div>

      {/* Items */}
      <div className="py-3">
        <div className="space-y-2">
          {order.order_items.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-2 rounded-xl border p-2 ${
                item.is_ready
                  ? 'border-cardamom/30 bg-cardamom/10'
                  : 'border-line bg-bg-alt/40'
              }`}
            >
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 font-mono text-xs font-bold text-primary">
                {item.quantity}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-ink">{item.name}</p>
                  <button
                    onClick={() => onToggleItemReady(item.id, item.is_ready)}
                    disabled={updating}
                    className={`rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase ${
                      item.is_ready
                        ? 'bg-cardamom/15 text-cardamom'
                        : 'bg-saffron/15 text-primary'
                    }`}
                  >
                    {item.is_ready ? 'Ready' : 'Mark Ready'}
                  </button>
                </div>
                {item.notes && (
                  <p className="text-xs italic text-primary">"{item.notes}"</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment */}
      <div className="flex items-center justify-between border-t border-line pt-3">
        <div className="flex items-center gap-2">
          {order.payment_method === 'counter' ? (
            <Store className="h-3.5 w-3.5 text-ink-soft" />
          ) : (
            <CreditCard className="h-3.5 w-3.5 text-ink-soft" />
          )}
          <span className="text-xs font-medium text-ink-soft">
            {order.payment_method === 'counter' ? 'Counter' : 'Online'}
          </span>
        </div>
        <button
          onClick={() => onTogglePayment(order.id, order.payment_status)}
          disabled={updating}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition-all disabled:opacity-50 ${
            order.payment_status === 'paid'
              ? 'border-cardamom/30 bg-cardamom/10 text-cardamom hover:bg-cardamom/20'
              : 'border-saffron/30 bg-saffron/10 text-primary hover:bg-saffron/20'
          }`}
        >
          {order.payment_status === 'paid' ? (
            <>
              <CheckCircle2 className="h-3 w-3" />
              Paid
            </>
          ) : (
            <>
              <AlertCircle className="h-3 w-3" />
              Unpaid
            </>
          )}
        </button>
      </div>

      {/* Total + Action */}
      <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
        <div>
          <p className="font-mono text-[0.6rem] uppercase text-ink-soft">Total</p>
          <p className="font-mono text-base font-bold text-ink">{formatPrice(order.total)}</p>
        </div>
        {status !== 'completed' && status !== 'cancelled' ? (
          <button
            onClick={() => onUpdateStatus(order.id, nextStatus[status])}
            disabled={updating}
            className={`rounded-full px-4 py-2.5 text-xs font-bold text-surface shadow-sm transition-all active:scale-95 disabled:opacity-50 ${
              status === 'pending'
                ? 'bg-blue-600 hover:bg-blue-700'
                : status === 'preparing'
                  ? 'bg-cardamom hover:bg-cardamom'
                  : 'bg-ink hover:bg-ink'
            }`}
          >
            {updating ? 'Updating...' : nextStatusLabel[status]}
          </button>
        ) : (
          <span className="font-mono text-xs font-medium text-ink-soft">Complete</span>
        )}
      </div>
    </div>
  );
}
