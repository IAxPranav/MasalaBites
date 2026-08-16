import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Users, AlertTriangle, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Table = {
  id: string;
  number: number;
  capacity: number;
  created_at: string;
};

export default function TablesManager() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [newCapacity, setNewCapacity] = useState('4');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchTables = useCallback(async () => {
    const { data, error } = await supabase.from('tables').select('*').order('number', { ascending: true });
    if (error) console.error('Error fetching tables:', error);
    setTables((data as Table[]) || []);
    setLoading(false);
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
      setError(error.message);
      return;
    }
    setShowAdd(false);
    setNewNumber('');
    setNewCapacity('4');
    setError('');
    fetchTables();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('tables').delete().eq('id', deleteId);
    if (error) console.error('Error deleting table:', error);
    setDeleteId(null);
    fetchTables();
  };

  const handleCapacityChange = async (id: string, delta: number, current: number) => {
    const newCap = Math.max(1, current + delta);
    await supabase.from('tables').update({ capacity: newCap }).eq('id', id);
    fetchTables();
  };

  const totalSeats = tables.reduce((sum, t) => sum + t.capacity, 0);

  return (
    <div>
      {/* Summary */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="rounded-xl border border-line bg-surface px-4 py-3">
            <p className="font-mono text-2xl font-bold text-ink">{tables.length}</p>
            <p className="font-mono text-[0.6rem] text-ink-soft">TABLES</p>
          </div>
          <div className="rounded-xl border border-line bg-surface px-4 py-3">
            <p className="font-mono text-2xl font-bold text-ink">{totalSeats}</p>
            <p className="font-mono text-[0.6rem] text-ink-soft">TOTAL SEATS</p>
          </div>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          Add Table
        </button>
      </div>

      {/* Tables grid */}
      {loading ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-line bg-surface" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {tables.map((table) => (
            <div
              key={table.id}
              className="group relative flex flex-col items-center justify-center rounded-2xl border border-line bg-surface p-5 transition-shadow hover:shadow-md"
            >
              <span className="font-display text-2xl font-bold text-ink">{table.number}</span>
              <div className="mt-2 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-ink-soft" />
                <span className="font-mono text-xs text-ink-soft">{table.capacity}</span>
              </div>
              {/* Capacity stepper */}
              <div className="mt-3 flex items-center gap-1.5">
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
              <button onClick={handleDelete} className="flex-1 rounded-full bg-chili px-5 py-2.5 font-semibold text-surface transition-colors hover:bg-chili/90">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
