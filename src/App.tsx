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
import { useCart, useTableNumber } from '@/hooks/useCart';

type View = 'table' | 'menu' | 'checkout' | 'confirmation' | 'kitchen' | 'admin';

function App() {
  const [view, setView] = useState<View>('table');
  const [cartOpen, setCartOpen] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const { items, addItem, updateQuantity, removeItem, clearCart, totalItemCount, totalAmount } =
    useCart();
  const { tableNumber, setTableNumber } = useTableNumber();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;

    if (hash === '#kitchen') {
      setView('kitchen');
      return;
    }
    if (hash === '#admin') {
      setView('admin');
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
  }, []);

  if (view === 'table') {
    return (
      <TableSelection
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
          onBack={() => setView('menu')}
          onOrderPlaced={(orderId) => {
            setPlacedOrderId(orderId);
            setCelebrating(true);
            setTimeout(() => {
              setCelebrating(false);
              setView('confirmation');
            }, 2600);
          }}
          onClearCart={clearCart}
        />
        {celebrating && <CelebrationOverlay />}
      </>
    );
  }

  if (view === 'confirmation' && placedOrderId && tableNumber) {
    return (
      <OrderConfirmation
        orderId={placedOrderId}
        tableNumber={tableNumber}
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
