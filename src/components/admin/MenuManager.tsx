import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Minus, Trash2, Search, Star, Flame, X, Image as ImageIcon,
  Pencil, AlertTriangle,
} from 'lucide-react';
import { supabase, CATEGORIES, type MenuItem } from '@/lib/supabase';

function VegMark({ veg, size = 16 }: { veg: boolean; size?: number }) {
  return (
    <div
      className="vegmark"
      style={{ borderColor: veg ? '#3F6E52' : '#A6261B', width: size, height: size }}
    >
      <span
        style={{
          background: veg ? '#3F6E52' : '#A6261B',
          borderRadius: '50%',
          width: size * 0.5,
          height: size * 0.5,
        }}
      />
    </div>
  );
}

function SpiceDots({ level }: { level: number }) {
  if (level === 0) return null;
  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <Flame key={i} className="h-3 w-3" style={{ color: i < level ? '#C1440E' : '#EADFC9' }} />
      ))}
    </div>
  );
}

type EditState = {
  id?: string;
  name: string;
  description: string;
  price: string;
  category: string;
  image_url: string;
  available: boolean;
  sort_order: string;
  veg: boolean;
  spice_level: number;
  is_special: boolean;
};

const EMPTY_EDIT: EditState = {
  name: '',
  description: '',
  price: '',
  category: CATEGORIES[0] as string,
  image_url: '',
  available: true,
  sort_order: '0',
  veg: true,
  spice_level: 0,
  is_special: false,
};

export default function MenuManager() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true });
    if (error) console.error('Error fetching menu items:', error);
    setItems((data as MenuItem[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filtered = items.filter((item) => {
    if (activeCategory !== 'All' && item.category !== activeCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    }
    return true;
  });

  const handleSave = async () => {
    if (!editing || !editing.name.trim() || !editing.price) return;
    setSaving(true);
    const payload = {
      name: editing.name.trim(),
      description: editing.description.trim(),
      price: parseFloat(editing.price),
      category: editing.category,
      image_url: editing.image_url.trim(),
      available: editing.available,
      sort_order: parseInt(editing.sort_order || '0', 10),
      veg: editing.veg,
      spice_level: editing.spice_level,
      is_special: editing.is_special,
    };

    if (editing.id) {
      const { error } = await supabase.from('menu_items').update(payload).eq('id', editing.id);
      if (error) console.error('Error updating item:', error);
    } else {
      const { error } = await supabase.from('menu_items').insert(payload);
      if (error) console.error('Error creating item:', error);
    }

    setSaving(false);
    setEditing(null);
    fetchItems();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('menu_items').delete().eq('id', deleteId);
    if (error) console.error('Error deleting item:', error);
    setDeleteId(null);
    fetchItems();
  };

  const startEdit = (item: MenuItem) => {
    setEditing({
      id: item.id,
      name: item.name,
      description: item.description,
      price: String(item.price),
      category: item.category,
      image_url: item.image_url,
      available: item.available,
      sort_order: String(item.sort_order),
      veg: item.veg,
      spice_level: item.spice_level,
      is_special: item.is_special,
    });
  };

  const formatPrice = (price: number) => `₹${Math.round(price)}`;

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dishes..."
            className="w-full rounded-full border border-line bg-surface py-2.5 pl-11 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft focus:border-primary"
          />
        </div>
        <button
          onClick={() => setEditing({ ...EMPTY_EDIT })}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" />
          Add New Dish
        </button>
      </div>

      {/* Category filter */}
      <div className="mb-4 flex gap-2 overflow-x-auto hide-scrollbar">
        {['All', ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`chip ${activeCategory === cat ? 'is-active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl border border-line bg-surface" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm font-medium text-ink-soft">No dishes found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`flex gap-3 rounded-2xl border bg-surface p-3 transition-shadow hover:shadow-md ${
                !item.available ? 'border-line opacity-60' : 'border-line'
              }`}
            >
              <img
                src={item.image_url}
                alt={item.name}
                className="h-16 w-16 flex-shrink-0 rounded-xl object-cover"
              />
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <VegMark veg={item.veg} size={14} />
                    <h3 className="text-sm font-bold text-ink">{item.name}</h3>
                  </div>
                  <span className="font-mono text-sm font-bold text-ink">
                    {formatPrice(item.price)}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs text-ink-soft">{item.description}</p>
                <div className="mt-1 flex items-center gap-2">
                  <SpiceDots level={item.spice_level} />
                  {item.is_special && (
                    <span className="flex items-center gap-0.5 rounded-full bg-saffron/15 px-1.5 py-0.5">
                      <Star className="h-2.5 w-2.5 text-saffron" />
                      <span className="font-mono text-[0.6rem] font-bold text-saffron">SPECIAL</span>
                    </span>
                  )}
                  {!item.available && (
                    <span className="font-mono text-[0.6rem] font-bold text-chili">UNAVAILABLE</span>
                  )}
                </div>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="font-mono text-[0.65rem] text-ink-soft">{item.category}</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => startEdit(item)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-bg-alt text-ink-soft transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(item.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-bg-alt text-ink-soft transition-colors hover:bg-chili/10 hover:text-chili"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Create Modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center"
          onClick={() => setEditing(null)}
        >
          <div
            className="slide-up flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-surface shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-display text-lg font-bold text-ink">
                {editing.id ? 'Edit Dish' : 'New Dish'}
              </h2>
              <button onClick={() => setEditing(null)} className="icon-btn">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {/* Image preview + URL */}
              <div className="mb-4 flex gap-4">
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-line bg-bg-alt">
                  {editing.image_url ? (
                    <img src={editing.image_url} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-line" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-bold text-ink">Image URL</label>
                  <input
                    type="text"
                    value={editing.image_url}
                    onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                    placeholder="/butter-chicken.webp"
                    className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-primary"
                  />
                  <p className="mt-1 text-[0.65rem] text-ink-soft">
                    Use paths like /butter-chicken.webp or full URLs
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-ink">Name</label>
                  <input
                    type="text"
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    placeholder="Butter Chicken"
                    className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-primary"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-ink">Description</label>
                  <textarea
                    value={editing.description}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    placeholder="Tender chicken in a creamy tomato curry..."
                    rows={2}
                    className="w-full resize-none rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-ink">Price (¥)</label>
                    <input
                      type="number"
                      value={editing.price}
                      onChange={(e) => setEditing({ ...editing, price: e.target.value })}
                      placeholder="1200"
                      className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-ink">Category</label>
                    <select
                      value={editing.category}
                      onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                      className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-primary"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-ink">Sort Order</label>
                    <input
                      type="number"
                      value={editing.sort_order}
                      onChange={(e) => setEditing({ ...editing, sort_order: e.target.value })}
                      className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-ink">Spice Level</label>
                    <select
                      value={editing.spice_level}
                      onChange={(e) => setEditing({ ...editing, spice_level: parseInt(e.target.value, 10) })}
                      className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-primary"
                    >
                      <option value={0}>None</option>
                      <option value={1}>Mild</option>
                      <option value={2}>Medium</option>
                      <option value={3}>Hot</option>
                    </select>
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setEditing({ ...editing, veg: !editing.veg })}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-all ${
                      editing.veg
                        ? 'border-cardamom/30 bg-cardamom/10 text-cardamom'
                        : 'border-line bg-bg-alt text-ink-soft'
                    }`}
                  >
                    <VegMark veg={editing.veg} size={12} />
                    Vegetarian
                  </button>
                  <button
                    onClick={() => setEditing({ ...editing, is_special: !editing.is_special })}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-all ${
                      editing.is_special
                        ? 'border-saffron/30 bg-saffron/15 text-saffron'
                        : 'border-line bg-bg-alt text-ink-soft'
                    }`}
                  >
                    <Star className="h-3 w-3" />
                    Chef's Special
                  </button>
                  <button
                    onClick={() => setEditing({ ...editing, available: !editing.available })}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-all ${
                      editing.available
                        ? 'border-cardamom/30 bg-cardamom/10 text-cardamom'
                        : 'border-chili/30 bg-chili/10 text-chili'
                    }`}
                  >
                    {editing.available ? 'Available' : 'Unavailable'}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-line px-5 py-4">
              <button onClick={() => setEditing(null)} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editing.name.trim() || !editing.price}
                className="btn-primary flex-1"
              >
                {saving ? 'Saving...' : editing.id ? 'Save Changes' : 'Create Dish'}
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
            <h3 className="text-center font-display text-lg font-bold text-ink">Delete this dish?</h3>
            <p className="mt-1 text-center text-sm text-ink-soft">
              This will remove it from the menu permanently. Existing orders will keep their records.
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
