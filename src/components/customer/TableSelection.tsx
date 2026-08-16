import { useEffect, useState } from 'react';
import { Users, ArrowRight, Flame, ShoppingBag, Store } from 'lucide-react';

type TableSelectionProps = {
  customerPhone: string | null;
  onCustomerPhoneChange: (phone: string | null) => void;
  onSelect: (table: number) => void;
  onGroceryStore: () => void;
};

const TABLES = Array.from({ length: 12 }, (_, i) => ({
  number: i + 1,
  capacity: [2, 2, 4, 4, 4, 6, 2, 4, 6, 4, 2, 8][i],
}));

export default function TableSelection({
  customerPhone,
  onCustomerPhoneChange,
  onSelect,
  onGroceryStore,
}: TableSelectionProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [loginPhone, setLoginPhone] = useState(customerPhone ?? '');

  useEffect(() => {
    setLoginPhone(customerPhone ?? '');
  }, [customerPhone]);

  const handleLogin = () => {
    const cleanPhone = loginPhone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone) return;
    onCustomerPhoneChange(cleanPhone);
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="bg-bg-alt border-b border-line">
        <div className="mx-auto max-w-6xl px-6 pt-8 pb-8 lg:px-10 lg:pt-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Masala Bites"
                className="h-14 w-auto object-contain rounded-xl"
              />
              <div>
                <p className="eyebrow">Masala Bites</p>
                <p className="font-display text-lg font-bold text-ink">Modern Indian Kitchen</p>
              </div>
            </div>

            {/* Grocery button in header */}
            <button
              onClick={onGroceryStore}
              className="flex items-center gap-1.5 rounded-full border border-cardamom/40 bg-cardamom/10 px-4 py-2 text-xs font-bold text-cardamom transition-all hover:bg-cardamom/20 active:scale-95 shadow-sm"
            >
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">Grocery Store</span>
              <span className="sm:hidden">Grocery</span>
            </button>
          </div>

          <div className="mt-8 lg:mt-10">
            <p className="eyebrow mb-2">Step 1</p>
            <h1 className="font-display text-3xl font-medium leading-tight text-ink lg:text-5xl">
              Which table<br />are you at?
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-soft lg:text-base">
              Find your table number on the QR card placed on your table. This helps us bring your
              order to the right spot.
            </p>
          </div>
        </div>
      </div>

      {/* Table Grid */}
      <div className="mx-auto max-w-6xl px-6 py-6 lg:px-10 lg:py-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
            <Users className="h-4 w-4 text-primary" />
            Select Table
          </h2>
          <span className="font-mono text-xs text-ink-soft">12 tables</span>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {TABLES.map((table) => {
            const isSelected = selected === table.number;
            return (
              <button
                key={table.number}
                onClick={() => setSelected(table.number)}
                className={`relative flex flex-col items-center justify-center rounded-2xl border-2 p-5 transition-all duration-200 active:scale-95 lg:p-7 ${
                  isSelected
                    ? 'border-primary bg-primary text-surface shadow-lg shadow-primary/20'
                    : 'border-line bg-surface text-ink hover:border-primary/40 hover:bg-bg-alt'
                }`}
              >
                <span className="font-display text-2xl font-bold lg:text-3xl">{table.number}</span>
                <span
                  className={`mt-0.5 font-mono text-[0.65rem] ${
                    isSelected ? 'text-surface/70' : 'text-ink-soft'
                  }`}
                >
                  {table.capacity} SEATS
                </span>
                {isSelected && (
                  <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-surface">
                    <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <button
          disabled={selected === null}
          onClick={() => selected && onSelect(selected)}
          className="btn-primary mt-6 w-full lg:w-auto"
        >
          View Menu
          <ArrowRight className="h-4 w-4" />
        </button>

        <div className="mt-6 rounded-2xl border border-line bg-surface p-4 lg:mt-8">
          <p className="text-center text-sm font-bold text-ink">Already ordered something? Please log in</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="tel"
              value={loginPhone}
              onChange={(e) => setLoginPhone(e.target.value)}
              placeholder="Enter phone number"
              className="w-full rounded-xl border border-line bg-bg-alt px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-primary"
            />
            <button onClick={handleLogin} className="btn-secondary shrink-0 justify-center">
              Log in
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-ink-soft">
          <Flame className="h-3.5 w-3.5 text-primary" />
          <span>Freshly prepared authentic Indian cuisine</span>
        </div>

        {/* Grocery Store CTA Card */}
        <div className="mt-8 rounded-2xl border border-dashed border-cardamom/40 bg-cardamom/5 p-5 text-center">
          <div className="mb-2 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-cardamom/30 bg-cardamom/10">
              <ShoppingBag className="h-6 w-6 text-cardamom" />
            </div>
          </div>
          <p className="text-sm font-bold text-ink">Masala Bites Grocery Store</p>
          <p className="mt-0.5 text-xs text-ink-soft">Shop authentic spices, ingredients & ready meal kits at home</p>
          <button
            onClick={onGroceryStore}
            className="mt-3 inline-flex items-center justify-center gap-2 rounded-full border border-cardamom/40 bg-cardamom/10 px-6 py-2.5 text-xs font-bold text-cardamom transition-all hover:bg-cardamom/20 active:scale-95 shadow-sm"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Visit Grocery Store (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
}
