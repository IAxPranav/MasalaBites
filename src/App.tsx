import { useState, useEffect } from 'react';
import { ArrowRight, Flame } from 'lucide-react';
import TableSelection from '@/components/customer/TableSelection';
import MenuScreen from '@/components/customer/MenuScreen';
import CartDrawer from '@/components/customer/CartDrawer';
import CheckoutScreen from '@/components/customer/CheckoutScreen';
import OrderConfirmation from '@/components/customer/OrderConfirmation';
import KitchenPanel from '@/components/kitchen/KitchenPanel';
import KitchenGate from '@/components/kitchen/KitchenGate';
import AdminPanel from '@/components/admin/AdminPanel';
import AdminGate from '@/components/admin/AdminGate';
import CelebrationOverlay from '@/components/customer/CelebrationOverlay';
import { supabase } from '@/lib/supabase';
import { useCart, useTableNumber } from '@/hooks/useCart';

type View = 'table' | 'menu' | 'checkout' | 'confirmation' | 'kitchen' | 'admin';
type PaymentMethod = 'counter' | 'online';

const CUSTOMER_PHONE_KEY = 'masala-bites-customer-phone';
const ACTIVE_ORDER_KEY = 'masala-bites-active-order';

function readStorageString(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function App() {
  const [view, setView] = useState<View>('table');
  const [cartOpen, setCartOpen] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(() => readStorageString(ACTIVE_ORDER_KEY));
  const [customerPhone, setCustomerPhone] = useState<string | null>(() => readStorageString(CUSTOMER_PHONE_KEY));
  const [celebrating, setCelebrating] = useState(false);
  const [celebratingPaymentMethod, setCelebratingPaymentMethod] = useState<PaymentMethod | null>(null);
  const { items, addItem, updateQuantity, removeItem, clearCart, totalItemCount, totalAmount } =
    useCart();
  const { tableNumber, setTableNumber } = useTableNumber();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    const savedPhone = readStorageString(CUSTOMER_PHONE_KEY);
    const savedOrderId = readStorageString(ACTIVE_ORDER_KEY);

    if (savedPhone) {
      setCustomerPhone(savedPhone);
    }

    if (hash === '#kitchen') {
      setView('kitchen');
      return;
    }
    if (hash === '#admin') {
      setView('admin');
      return;
    }

    if (savedOrderId && tableNumber) {
      setPlacedOrderId(savedOrderId);
      setView('confirmation');
      return;
    }

    const tableParam = params.get('table');
    if (tableParam) {
      const num = parseInt(tableParam, 10);
      if (num >= 1 && num <= 12) {
        setTableNumber(num);
        setView('menu');
        return;
      }
    }

    if (tableNumber) {
      setView('menu');
    }
  }, [tableNumber, setTableNumber]);

  useEffect(() => {
    if (!customerPhone) return;

    const normalizePhone = (phone: string) => phone.replace(/\D/g, '');
    const phoneValue = normalizePhone(customerPhone);
    if (!phoneValue) return;

    const fetchLatestOrder = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_phone', phoneValue)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return;

      setPlacedOrderId(data.id);
      setTableNumber(data.table_number);
      window.localStorage.setItem(ACTIVE_ORDER_KEY, data.id);
      setView('confirmation');
    };

    fetchLatestOrder();
  }, [customerPhone, setTableNumber]);

  const persistCustomerPhone = (phone: string | null) => {
    setCustomerPhone(phone);
    if (!phone) {
      localStorage.removeItem(CUSTOMER_PHONE_KEY);
      return;
    }
    localStorage.setItem(CUSTOMER_PHONE_KEY, phone);
  };

  const handleOrderPlaced = (orderId: string, paymentMethod: PaymentMethod) => {
    setPlacedOrderId(orderId);
    localStorage.setItem(ACTIVE_ORDER_KEY, orderId);
    setCelebrating(true);
    setCelebratingPaymentMethod(paymentMethod);
    setTimeout(() => {
      setCelebrating(false);
      setCelebratingPaymentMethod(null);
      setView('confirmation');
    }, 2600);
  };

  if (view === 'table') {
    return (
      <TableSelection
        customerPhone={customerPhone}
        onCustomerPhoneChange={persistCustomerPhone}
        onSelect={(num) => {
          setTableNumber(num);
          setView('menu');
        }}
      />
    );
  }

  if (view === 'menu' && tableNumber) {
    return (
      <>
        <MenuScreen
          tableNumber={tableNumber}
          cartItems={items}
          onAddItem={addItem}
          onUpdateQuantity={updateQuantity}
          onOpenCart={() => setCartOpen(true)}
          cartCount={totalItemCount}
          cartTotal={totalAmount}
          activeOrderId={placedOrderId}
          onViewOrderStatus={() => setView('confirmation')}
        />
        <CartDrawer
          open={cartOpen}
          items={items}
          onClose={() => setCartOpen(false)}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          onCheckout={() => {
            setCartOpen(false);
            setView('checkout');
          }}
          totalAmount={totalAmount}
          tableNumber={tableNumber}
        />
      </>
    );
  }

  if (view === 'checkout' && tableNumber) {
    return (
      <>
        <CheckoutScreen
          items={items}
          totalAmount={totalAmount}
          tableNumber={tableNumber}
          customerPhone={customerPhone}
          onCustomerPhoneChange={persistCustomerPhone}
          onBack={() => setView('menu')}
          onOrderPlaced={(orderId, paymentMethod) => handleOrderPlaced(orderId, paymentMethod)}
          onClearCart={clearCart}
        />
        {celebrating && celebratingPaymentMethod && (
          <CelebrationOverlay paymentMethod={celebratingPaymentMethod} />
        )}
      </>
    );
  }

  if (view === 'confirmation' && placedOrderId && tableNumber) {
    return (
      <OrderConfirmation
        orderId={placedOrderId}
        tableNumber={tableNumber}
        customerPhone={customerPhone}
        onBackToMenu={() => setView('menu')}
      />
    );
  }

  if (view === 'kitchen') {
    return (
      <KitchenGate onExit={() => setView('table')}>
        <KitchenPanel onExit={() => setView('table')} />
      </KitchenGate>
    );
  }

  if (view === 'admin') {
    return (
      <AdminGate onExit={() => setView('table')}>
        <AdminPanel onExit={() => setView('table')} />
      </AdminGate>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <button onClick={() => setView('table')} className="btn-primary">
        Go Home
      </button>
    </div>
  );
}

export default App;
