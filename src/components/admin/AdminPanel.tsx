import { useState } from 'react';
import { Flame, UtensilsCrossed, BarChart3, DollarSign, LogOut } from 'lucide-react';
import MenuManager from '@/components/admin/MenuManager';
import TablesManager from '@/components/admin/TablesManager';
import IncomeView from '@/components/admin/IncomeView';
import AnalyticsView from '@/components/admin/AnalyticsView';

type Tab = 'menu' | 'tables' | 'income' | 'analytics';

type AdminPanelProps = {
  onExit: () => void;
};

const TABS: { key: Tab; label: string; icon: typeof Flame }[] = [
  { key: 'menu', label: 'Menu', icon: Flame },
  { key: 'tables', label: 'Tables', icon: UtensilsCrossed },
  { key: 'income', label: 'Income', icon: DollarSign },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export default function AdminPanel({ onExit }: AdminPanelProps) {
  const [tab, setTab] = useState<Tab>('menu');

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-ink">
                <Flame className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-base font-bold text-ink lg:text-lg">Admin Panel</h1>
                <p className="eyebrow">Masala Bites - Management</p>
              </div>
            </div>
            <button
              onClick={onExit}
              className="flex h-9 items-center gap-1.5 rounded-full border border-line bg-bg px-3 text-xs font-semibold text-ink-soft transition-colors hover:border-primary hover:text-primary"
            >
              <LogOut className="h-3.5 w-3.5" />
              Exit
            </button>
          </div>

          {/* Tab navigation */}
          <div className="mt-3 flex gap-1.5 overflow-x-auto hide-scrollbar">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    tab === t.key
                      ? 'bg-ink text-surface'
                      : 'bg-bg-alt text-ink-soft hover:bg-line'
                  }`}
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
        {tab === 'income' && <IncomeView />}
        {tab === 'analytics' && <AnalyticsView />}
      </div>
    </div>
  );
}
