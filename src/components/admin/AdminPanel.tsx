import { useState } from 'react';
import {
  UtensilsCrossed,
  BarChart3,
  DollarSign,
  LogOut,
  ChefHat,
  Layers,
  Star,
  Flame,
} from 'lucide-react';
import MenuManager from '@/components/admin/MenuManager';
import TablesManager from '@/components/admin/TablesManager';
import IncomeView from '@/components/admin/IncomeView';
import AnalyticsView from '@/components/admin/AnalyticsView';
import ReviewsView from '@/components/admin/ReviewsView';
import KitchenPanel from '@/components/kitchen/KitchenPanel';

type Tab = 'menu' | 'tables' | 'kitchen' | 'income' | 'analytics' | 'reviews';

type AdminPanelProps = {
  onExit: () => void;
};

const TABS: { key: Tab; label: string; icon: typeof Flame }[] = [
  { key: 'menu', label: 'Menu', icon: Layers },
  { key: 'tables', label: 'Tables', icon: UtensilsCrossed },
  { key: 'kitchen', label: 'Kitchen', icon: ChefHat },
  { key: 'income', label: 'Income', icon: DollarSign },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'reviews', label: 'Reviews', icon: Star },
];

export default function AdminPanel({ onExit }: AdminPanelProps) {
  const [tab, setTab] = useState<Tab>('menu');

  return (
    <div className="admin-shell">
      {/* Header */}
      <div className="admin-header">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            {/* Logo + Title */}
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Masala Bites"
                className="h-9 w-auto object-contain rounded-lg shadow-sm"
              />
              <div>
                <h1 className="admin-font text-sm font-bold text-[var(--admin-ink)] lg:text-base">
                  Masala Bites
                </h1>
                <p className="admin-mono text-[0.6rem] tracking-widest uppercase text-[var(--admin-ink-muted)]">
                  Admin Panel
                </p>
              </div>
            </div>

            {/* Exit */}
            <button
              onClick={onExit}
              className="admin-btn-ghost"
            >
              <LogOut className="h-3.5 w-3.5" />
              Exit
            </button>
          </div>

          {/* Tab navigation */}
          <div className="flex gap-1 overflow-x-auto pb-2 hide-scrollbar">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  id={`admin-tab-${t.key}`}
                  onClick={() => setTab(t.key)}
                  className={`admin-tab ${tab === t.key ? 'is-active' : ''}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:px-8">
        {tab === 'menu' && <MenuManager />}
        {tab === 'tables' && <TablesManager />}
        {tab === 'kitchen' && (
          <KitchenPanel onExit={() => setTab('menu')} isAdminView={true} />
        )}
        {tab === 'income' && <IncomeView />}
        {tab === 'analytics' && <AnalyticsView />}
        {tab === 'reviews' && <ReviewsView />}
      </div>
    </div>
  );
}
