import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Trash2, Users, AlertTriangle, X, QrCode, Sparkles, Printer, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Table = {
  id: string;
  number: number;
  capacity: number;
  created_at?: string;
};

const DEFAULT_TABLES: Omit<Table, 'id'>[] = [
  { number: 1, capacity: 2 },
  { number: 2, capacity: 2 },
  { number: 3, capacity: 4 },
  { number: 4, capacity: 4 },
  { number: 5, capacity: 4 },
  { number: 6, capacity: 6 },
  { number: 7, capacity: 2 },
  { number: 8, capacity: 4 },
  { number: 9, capacity: 6 },
  { number: 10, capacity: 4 },
  { number: 11, capacity: 2 },
  { number: 12, capacity: 8 },
];

const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }

    .qr-print-card,
    .qr-print-card * {
      visibility: visible;
    }

    .qr-print-card {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      min-height: 100vh;
      background: white;
      padding: 32px;
      box-shadow: none !important;
      border: none !important;
    }

    .qr-print-controls {
      display: none !important;
    }
  }
`;

const DEFAULT_HOSTINGER_DOMAIN = 'https://mediumpurple-quail-739736.hostingersite.com';

export default function TablesManager() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [newCapacity, setNewCapacity] = useState('4');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  // qrModalState: null = closed, 0 = Generic/Select Table QR, >0 = Table Number
  const [qrModalState, setQrModalState] = useState<number | null>(null);
  const [printAllMode, setPrintAllMode] = useState(false);
  const [error, setError] = useState('');

  const getBaseAppUrl = useCallback(() => {
    return import.meta.env.VITE_PUBLIC_APP_URL || DEFAULT_HOSTINGER_DOMAIN;
  }, []);

  const getTableUrl = useCallback((number: number) => {
    const baseUrl = getBaseAppUrl();
    const url = new URL(baseUrl);
    url.search = '';
    url.hash = '';
    url.searchParams.set('table', String(number));
    return url.toString();
  }, [getBaseAppUrl]);

  const getGenericUrl = useCallback(() => {
    const baseUrl = getBaseAppUrl();
    const url = new URL(baseUrl);
    url.search = '';
    url.hash = '';
    return url.toString();
  }, [getBaseAppUrl]);

  const fetchTables = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .order('number', { ascending: true });

      if (error) console.error('Error fetching tables from DB:', error);

      if (data && data.length > 0) {
        setTables(data as Table[]);
      } else {
        // If DB has no tables yet, seed default tables (1-12)
        const fallbackWithIds = DEFAULT_TABLES.map((t, idx) => ({
          ...t,
          id: `default-${t.number}`,
        }));
        setTables(fallbackWithIds);

        // Try inserting default tables into Supabase in the background
        try {
          await supabase.from('tables').insert(DEFAULT_TABLES);
        } catch {
          // ignore if already seeded or RLS restricted
        }
      }
    } catch {
      // Fallback
      setTables(DEFAULT_TABLES.map((t) => ({ ...t, id: `default-${t.number}` })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const handleAdd = async () => {
    const num = parseInt(newNumber, 10);
    const cap = parseInt(newCapacity, 10);
    if (!num || num < 1) {
      setError('Enter a valid table number');
      return;
    }
    if (tables.some((t) => t.number === num)) {
      setError('Table number already exists');
      return;
    }
    const { error } = await supabase.from('tables').insert({ number: num, capacity: cap || 4 });
    if (error) {
      // Add locally if DB fails
      setTables((prev) => [...prev, { id: `local-${num}`, number: num, capacity: cap || 4 }].sort((a, b) => a.number - b.number));
    }
    setShowAdd(false);
    setNewNumber('');
    setNewCapacity('4');
    setError('');
    fetchTables();
  };

  const handleDelete = async (id: string) => {
    if (!id) return;
    await supabase.from('tables').delete().eq('id', id);
    setTables((prev) => prev.filter((t) => t.id !== id));
    setDeleteId(null);
    fetchTables();
  };

  const handleCapacityChange = async (id: string, delta: number, current: number) => {
    const newCap = Math.max(1, current + delta);
    setTables((prev) => prev.map((t) => (t.id === id ? { ...t, capacity: newCap } : t)));
    await supabase.from('tables').update({ capacity: newCap }).eq('id', id);
  };

  const handlePrintCard = (tableNum: number) => {
    setQrModalState(tableNum);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handlePrintAll = () => {
    setPrintAllMode(true);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const totalSeats = tables.reduce((sum, t) => sum + t.capacity, 0);

  return (
    <div>
      <style>{printStyles}</style>

      {/* Summary Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-[var(--admin-border)] bg-white px-4 py-3 shadow-sm">
            <p className="font-mono text-2xl font-bold text-ink">{tables.length}</p>
            <p className="font-mono text-[0.6rem] text-ink-soft">TABLES</p>
          </div>
          <div className="rounded-xl border border-[var(--admin-border)] bg-white px-4 py-3 shadow-sm">
            <p className="font-mono text-2xl font-bold text-ink">{totalSeats}</p>
            <p className="font-mono text-[0.6rem] text-ink-soft">TOTAL SEATS</p>
          </div>
          <button
            onClick={fetchTables}
            title="Refresh tables"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--admin-border)] bg-white text-ink-soft hover:text-ink shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Print All QRs Button */}
          <button
            onClick={handlePrintAll}
            className="admin-btn-ghost flex items-center gap-1.5 py-2.5 px-4 text-xs font-semibold shadow-sm"
          >
            <Printer className="h-4 w-4 text-[var(--admin-accent)]" />
            Print All QRs
          </button>

          <button onClick={() => setShowAdd(true)} className="admin-btn-primary">
            <Plus className="h-4 w-4" />
            Add Table
          </button>
        </div>
      </div>

      {/* Generic Select Table QR Code Card (Entrance / Reception QR) */}
      <div className="mb-6 rounded-2xl border-2 border-dashed border-[var(--admin-accent)]/40 bg-[var(--admin-accent-soft)] p-5 transition-all shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-xl border border-[var(--admin-border)] bg-white p-2 shadow-sm shrink-0">
              <QRCodeSVG
                value={getGenericUrl()}
                size={84}
                bgColor="#ffffff"
                fgColor="#111827"
                level="H"
                includeMargin
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--admin-accent)] px-2.5 py-0.5 text-[0.65rem] font-bold text-white uppercase tracking-wider">
                <Sparkles className="h-3 w-3" />
                Generic Entrance QR
              </div>
              <h3 className="mt-1.5 text-base font-bold text-ink">Main QR Code — Select Table</h3>
              <p className="mt-0.5 max-w-md text-xs text-ink-soft">
                Place this QR code at your entrance, reception, or cash counter. Customers can scan to choose their table number and browse the menu.
              </p>
              <p className="mt-1.5 font-mono text-[11px] text-primary break-all">{getGenericUrl()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => handlePrintCard(0)}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--admin-border)] bg-white px-3.5 py-2 text-xs font-semibold text-ink shadow-sm hover:bg-slate-50 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </button>
            <button
              onClick={() => setQrModalState(0)}
              className="admin-btn-primary shrink-0 text-xs"
            >
              <QrCode className="h-4 w-4" />
              View QR
            </button>
          </div>
        </div>
      </div>

      {/* Section Title */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink">Individual Table QR Codes</h3>
        <span className="font-mono text-xs text-ink-soft">{tables.length} tables active</span>
      </div>

      {/* Tables grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl border border-line bg-surface" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {tables.map((table) => (
            <div
              key={table.id || table.number}
              className="group relative flex flex-col items-center justify-center rounded-2xl border border-[var(--admin-border)] bg-white p-4 transition-all hover:shadow-md hover:border-slate-300"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink font-mono text-sm font-bold text-white shadow-sm">
                T{table.number}
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <Users className="h-3 w-3 text-ink-soft" />
                <span className="font-mono text-xs text-ink-soft">{table.capacity} seats</span>
              </div>
              <div className="mt-2.5 rounded-xl border border-line bg-white p-1.5 shadow-sm">
                <QRCodeSVG
                  value={getTableUrl(table.number)}
                  size={76}
                  bgColor="#ffffff"
                  fgColor="#111827"
                  level="H"
                  includeMargin
                />
              </div>

              {/* Capacity stepper */}
              <div className="mt-2.5 flex items-center gap-1.5">
                <button
                  onClick={() => handleCapacityChange(table.id, -1, table.capacity)}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-line bg-bg-alt text-ink-soft transition-colors hover:border-primary hover:text-primary"
                >
                  <span className="text-xs">−</span>
                </button>
                <button
                  onClick={() => handleCapacityChange(table.id, 1, table.capacity)}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-line bg-bg-alt text-ink-soft transition-colors hover:border-primary hover:text-primary"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              {/* Buttons: View & Print */}
              <div className="mt-3 flex w-full gap-1.5">
                <button
                  onClick={() => setQrModalState(table.number)}
                  className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-line bg-bg-alt py-1.5 text-[11px] font-semibold text-ink-soft transition-colors hover:border-primary hover:text-primary"
                >
                  <QrCode className="h-3 w-3" />
                  View
                </button>
                <button
                  onClick={() => handlePrintCard(table.number)}
                  title={`Print Table ${table.number} QR Card`}
                  className="inline-flex items-center justify-center rounded-lg border border-[var(--admin-border)] bg-white px-2 py-1.5 text-[11px] font-semibold text-ink hover:bg-slate-50 transition-colors"
                >
                  <Printer className="h-3 w-3 text-primary" />
                </button>
              </div>

              {/* Delete button */}
              <button
                onClick={() => setDeleteId(table.id)}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full text-ink-soft opacity-0 transition-all hover:bg-chili/10 hover:text-chili group-hover:opacity-100"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add table modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm"
          onClick={() => setShowAdd(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-surface p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink">Add New Table</h2>
              <button onClick={() => setShowAdd(false)} className="icon-btn">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink">Table Number</label>
                <input
                  type="number"
                  value={newNumber}
                  onChange={(e) => { setNewNumber(e.target.value); setError(''); }}
                  placeholder="13"
                  autoFocus
                  className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink">Capacity (seats)</label>
                <input
                  type="number"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(e.target.value)}
                  placeholder="4"
                  className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-primary"
                />
              </div>
              {error && <p className="text-xs font-medium text-chili">{error}</p>}
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
              <button onClick={handleAdd} className="btn-primary flex-1">
                Add Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single QR Preview / Print Modal */}
      {qrModalState !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm"
          onClick={() => setQrModalState(null)}
        >
          <div
            className="qr-print-card w-full max-w-sm rounded-3xl bg-surface p-6 shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Masala Bites" className="h-10 w-auto object-contain" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-ink-soft">Masala Bites</p>
                  <h2 className="font-display text-xl font-bold text-ink">
                    {qrModalState === 0 ? 'Main Entrance QR' : `Table ${qrModalState}`}
                  </h2>
                </div>
              </div>
              <button onClick={() => setQrModalState(null)} className="icon-btn qr-print-controls">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex justify-center rounded-2xl bg-white p-4 border border-line shadow-sm">
              <QRCodeSVG
                value={qrModalState === 0 ? getGenericUrl() : getTableUrl(qrModalState)}
                size={220}
                bgColor="#ffffff"
                fgColor="#111827"
                level="H"
                includeMargin
              />
            </div>

            <p className="mt-4 text-center text-sm font-bold text-ink">
              {qrModalState === 0
                ? 'Scan to open Masala Bites & select table'
                : `Scan to order from Table ${qrModalState}`}
            </p>
            <p className="mt-1 break-all text-center text-[11px] font-mono text-primary">
              {qrModalState === 0 ? getGenericUrl() : getTableUrl(qrModalState)}
            </p>

            <div className="qr-print-controls mt-5 flex gap-3">
              <button onClick={() => setQrModalState(null)} className="btn-secondary flex-1 justify-center">
                Close
              </button>
              <button onClick={() => window.print()} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Printer className="h-4 w-4" />
                Print QR Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print All QRs Modal */}
      {printAllMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm overflow-y-auto p-4"
          onClick={() => setPrintAllMode(false)}
        >
          <div
            className="qr-print-card w-full max-w-4xl rounded-3xl bg-white p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Masala Bites" className="h-12 w-auto object-contain" />
                <div>
                  <h2 className="text-xl font-bold text-ink">Masala Bites — All Table QR Codes</h2>
                  <p className="text-xs text-ink-soft">Ready for printing table cards</p>
                </div>
              </div>
              <div className="qr-print-controls flex items-center gap-2">
                <button onClick={() => window.print()} className="admin-btn-primary flex items-center gap-2">
                  <Printer className="h-4 w-4" />
                  Print All
                </button>
                <button onClick={() => setPrintAllMode(false)} className="icon-btn">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Grid of cards for print */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {/* Main entrance QR */}
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/40 p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Entrance QR</p>
                <h4 className="font-bold text-sm text-ink mb-2">Select Table</h4>
                <QRCodeSVG value={getGenericUrl()} size={140} bgColor="#ffffff" fgColor="#111827" level="H" includeMargin />
                <p className="mt-2 text-[10px] font-mono text-ink-soft break-all">{getGenericUrl()}</p>
              </div>

              {/* All individual tables */}
              {tables.map((t) => (
                <div key={t.number} className="flex flex-col items-center justify-center rounded-2xl border border-line p-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Masala Bites</p>
                  <h4 className="font-bold text-base text-ink mb-2">Table {t.number}</h4>
                  <QRCodeSVG value={getTableUrl(t.number)} size={140} bgColor="#ffffff" fgColor="#111827" level="H" includeMargin />
                  <p className="mt-2 text-[10px] font-mono text-primary break-all">{getTableUrl(t.number)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm"
          onClick={() => setDeleteId(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-surface p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-chili/10">
                <AlertTriangle className="h-7 w-7 text-chili" />
              </div>
            </div>
            <h3 className="text-center font-display text-lg font-bold text-ink">Delete this table?</h3>
            <p className="mt-1 text-center text-sm text-ink-soft">
              Past orders for this table will remain in the records.
            </p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 rounded-full bg-chili px-5 py-2.5 font-semibold text-surface transition-colors hover:bg-chili/90">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
