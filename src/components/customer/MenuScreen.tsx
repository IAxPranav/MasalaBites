import { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, Plus, Minus, X, Flame, Star, ShoppingBag, ChefHat, Receipt, MessageSquare, Store } from 'lucide-react';
import { supabase, CATEGORIES, type MenuItem, type CartItem, type Review, spiceLabel } from '@/lib/supabase';
import ReviewModal from '@/components/customer/ReviewModal';

type MenuScreenProps = {
  tableNumber: number;
  cartItems: CartItem[];
  onAddItem: (item: MenuItem, quantity: number, notes: string) => void;
  onUpdateQuantity: (menuItemId: string, notes: string, delta: number) => void;
  onOpenCart: () => void;
  cartCount: number;
  cartTotal: number;
  activeOrderId: string | null;
  onViewOrderStatus: () => void;
  onOpenGrocery: () => void;
};

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

export default function MenuScreen({
  tableNumber,
  cartItems,
  onAddItem,
  onUpdateQuantity,
  onOpenCart,
  cartCount,
  cartTotal,
  activeOrderId,
  onViewOrderStatus,
  onOpenGrocery,
}: MenuScreenProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [detailItem, setDetailItem] = useState<MenuItem | null>(null);
  const [detailQty, setDetailQty] = useState(1);
  const [detailNotes, setDetailNotes] = useState('');
  const [bumpKey, setBumpKey] = useState(0);
  const [itemReviews, setItemReviews] = useState<Review[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTargetItem, setReviewTargetItem] = useState<MenuItem | null>(null);

  const fetchItemReviews = useCallback(async (itemId: string) => {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('menu_item_id', itemId)
      .eq('show_on_menu', true)
      .order('created_at', { ascending: false })
      .limit(5);
    setItemReviews((data as Review[]) || []);
  }, []);

  useEffect(() => {
    fetchMenu();
  }, []);

  useEffect(() => {
    if (detailItem) {
      fetchItemReviews(detailItem.id);
    } else {
      setItemReviews([]);
    }
  }, [detailItem, fetchItemReviews]);

  const fetchMenu = async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('available', true)
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true });

    if (error) console.error('Error fetching menu:', error);
    setMenuItems(data || []);
    setLoading(false);
  };

  const filteredItems = useMemo(() => {
    let items = menuItems;
    if (activeCategory !== 'All') {
      items = items.filter((item) => item.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q),
      );
    }
    return items;
  }, [menuItems, activeCategory, search]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    for (const item of filteredItems) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [filteredItems]);

  const getCartQuantity = (menuItemId: string): number => {
    return cartItems
      .filter((item) => item.menu_item_id === menuItemId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  const openDetail = (item: MenuItem) => {
    setDetailItem(item);
    setDetailQty(1);
    setDetailNotes('');
  };

  const openReview = (item: MenuItem | null = null) => {
    setReviewTargetItem(item);
    setShowReviewModal(true);
  };

  const submitDetail = () => {
    if (detailItem) {
      onAddItem(detailItem, detailQty, detailNotes.trim());
      setBumpKey((k) => k + 1);
    }
    setDetailItem(null);
  };

  const formatPrice = (price: number) => `¥${Math.round(price)}`;

  return (
    <div className="min-h-screen bg-bg pb-32 lg:pb-12">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-bg-alt/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-5 pt-5 pb-3 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <p className="eyebrow">Table {tableNumber}</p>
                <h1 className="font-display text-xl font-bold text-ink lg:text-2xl">Our Menu</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Grocery Store Button */}
              <button
                onClick={onOpenGrocery}
                className="flex items-center gap-1.5 rounded-full border border-cardamom/40 bg-cardamom/10 px-3.5 py-2 text-xs font-bold text-cardamom transition-all hover:bg-cardamom/20 active:scale-95 shadow-sm"
              >
                <Store className="h-4 w-4" />
                <span className="hidden sm:inline">Grocery Store</span>
                <span className="sm:hidden">Grocery</span>
              </button>

              {/* Logo */}
              <img
                src="/logo.png"
                alt="Masala Bites"
                className="h-10 w-auto object-contain rounded-xl"
              />
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-4 max-w-xl">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes..."
              className="w-full rounded-full border border-line bg-surface py-3 pl-11 pr-10 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft focus:border-primary"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-ink-soft hover:bg-bg-alt"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1 hide-scrollbar lg:mx-0 lg:flex-wrap lg:px-0">
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
        </div>
        <div className="h-px w-full bg-line" />
      </div>

      {/* Menu Content */}
      <div className="mx-auto max-w-7xl px-5 py-5 lg:px-8 lg:py-8">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="menu-card animate-pulse">
                <div className="mb-3 h-28 rounded-xl bg-bg-alt" />
                <div className="h-3 w-2/3 rounded bg-bg-alt" />
                <div className="mt-2 h-2.5 w-full rounded bg-bg-alt" />
                <div className="mt-3 h-4 w-1/3 rounded bg-bg-alt" />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="mb-3 h-12 w-12 text-line" />
            <p className="text-sm font-medium text-ink-soft">No dishes found</p>
            <p className="mt-1 text-xs text-ink-soft/70">Try a different search or category</p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} id={`cat-${category}`}>
                <div className="mb-4 flex items-baseline gap-2">
                  <h2 className="font-display text-xl font-semibold text-ink lg:text-2xl">{category}</h2>
                  <span className="font-mono text-xs text-ink-soft">{items.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {items.map((item) => {
                    const cartQty = getCartQuantity(item.id);
                    return (
                      <div
                        key={item.id}
                        className="menu-card cursor-pointer"
                        onClick={() => openDetail(item)}
                      >
                        {/* Image */}
                        <div className="relative mb-3 overflow-hidden rounded-xl">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            loading="lazy"
                            className="h-28 w-full object-cover transition-transform duration-300 hover:scale-105 lg:h-32"
                          />
                          {item.is_special && (
                            <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-ink/80 px-2 py-1 backdrop-blur-sm">
                              <Star className="h-2.5 w-2.5 text-saffron" />
                              <span className="font-mono text-[0.6rem] font-bold text-saffron">CHEF'S</span>
                            </div>
                          )}
                          <div className="absolute right-2 top-2">
                            <VegMark veg={item.veg} />
                          </div>
                        </div>

                        {/* Details */}
                        <h3 className="text-sm font-bold leading-tight text-ink">{item.name}</h3>
                        <p className="mt-1 line-clamp-2 text-[0.7rem] leading-relaxed text-ink-soft">
                          {item.description}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <SpiceDots level={item.spice_level} />
                          {item.spice_level > 0 && (
                            <span className="font-mono text-[0.6rem] text-ink-soft">
                              {spiceLabel(item.spice_level)}
                            </span>
                          )}
                        </div>

                        {/* Price + Add */}
                        <div className="mt-3 flex items-center justify-between">
                          <span className="font-mono text-base font-bold text-ink">
                            {formatPrice(item.price)}
                          </span>
                          {cartQty > 0 ? (
                            <div
                              className="stepper-sm"
                              key={bumpKey}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button onClick={() => onUpdateQuantity(item.id, '', -1)}>
                                <Minus className="h-3 w-3" />
                              </button>
                              <span>{cartQty}</span>
                              <button
                                onClick={() => {
                                  onAddItem(item, 1, '');
                                  setBumpKey((k) => k + 1);
                                }}
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddItem(item, 1, '');
                                setBumpKey((k) => k + 1);
                              }}
                              className="add-btn"
                            >
                              <Plus className="h-3 w-3" />
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating buttons - Bottom Right (Consistent on all screen sizes) */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-center gap-3">
        {/* Order Status FAB - above cart */}
        {activeOrderId && (
          <button
            onClick={onViewOrderStatus}
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-cardamom bg-cardamom text-surface shadow-lg shadow-cardamom/30 transition-all active:scale-90"
            style={{ animation: 'fadeIn 0.3s ease' }}
            aria-label="Order Status"
          >
            <div className="relative">
              <Receipt className="h-5 w-5" />
              <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-saffron opacity-70" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-saffron" />
              </span>
            </div>
          </button>
        )}
        {/* Cart FAB - always visible */}
        <button
          onClick={onOpenCart}
          className={`flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-all active:scale-90 ${
            cartCount > 0
              ? 'bg-primary text-surface shadow-primary/40'
              : 'border-2 border-line bg-surface text-ink-soft'
          }`}
          style={{ animation: 'fadeIn 0.3s ease' }}
          aria-label="Cart"
        >
          <div className="relative">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-saffron font-mono text-[0.65rem] font-bold text-ink">
                {cartCount}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Dish Detail Modal */}
      {detailItem && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center"
          onClick={() => setDetailItem(null)}
        >
          <div
            className="slide-up flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-surface shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Hero Image */}
            <div className="relative h-56 flex-shrink-0 overflow-hidden sm:h-64">
              <img
                src={detailItem.image_url}
                alt={detailItem.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
              <button
                onClick={() => setDetailItem(null)}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-ink shadow-lg backdrop-blur-sm transition-colors hover:bg-surface"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="mb-2 flex items-center gap-2">
                  <VegMark veg={detailItem.veg} size={20} />
                  {detailItem.is_special && (
                    <div className="flex items-center gap-1 rounded-full bg-saffron px-2 py-1">
                      <Star className="h-3 w-3 text-ink" />
                      <span className="font-mono text-[0.6rem] font-bold text-ink">CHEF'S SPECIAL</span>
                    </div>
                  )}
                </div>
                <h2 className="font-display text-2xl font-bold text-surface">{detailItem.name}</h2>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center gap-3">
                <span className="font-mono text-2xl font-bold text-ink">
                  {formatPrice(detailItem.price)}
                </span>
                <div className="flex items-center gap-2">
                  <SpiceDots level={detailItem.spice_level} />
                  {detailItem.spice_level > 0 && (
                    <span className="font-mono text-xs text-ink-soft">
                      {spiceLabel(detailItem.spice_level)}
                    </span>
                  )}
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                {detailItem.description}
              </p>

              <div className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-bg-alt/50 p-3">
                <ChefHat className="h-4 w-4 text-primary" />
                <p className="text-xs text-ink-soft">
                  {detailItem.veg ? 'Vegetarian dish' : 'Non-vegetarian dish'} from our {detailItem.category} selection
                </p>
              </div>

              {/* Reviews */}
              {itemReviews.length > 0 && (
                <div className="mt-5">
                  <div className="mb-2 flex items-center gap-2">
                    <Star className="h-4 w-4 fill-saffron text-saffron" />
                    <span className="text-xs font-bold text-ink">Customer Reviews</span>
                    <span className="font-mono text-xs text-ink-soft">({itemReviews.length})</span>
                  </div>
                  <div className="space-y-2">
                    {itemReviews.map((review) => (
                      <div key={review.id} className="rounded-xl border border-line bg-bg-alt/40 p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map((s) => (
                              <Star key={s} className={`h-3 w-3 ${s <= review.rating ? 'fill-saffron text-saffron' : 'text-line'}`} />
                            ))}
                          </div>
                          {review.customer_name && (
                            <span className="text-xs font-medium text-ink-soft">{review.customer_name}</span>
                          )}
                        </div>
                        {review.comment && (
                          <p className="mt-1 text-xs leading-relaxed text-ink-soft">"{review.comment}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Write review button */}
              <button
                onClick={() => openReview(detailItem)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-bg-alt/50 py-2.5 text-xs font-semibold text-ink-soft transition-colors hover:border-primary/40 hover:text-primary"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Write a Review
              </button>

              {/* Notes */}
              <div className="mt-5">
                <label className="mb-2 block text-xs font-bold text-ink">
                  Special Instructions
                </label>
                <textarea
                  value={detailNotes}
                  onChange={(e) => setDetailNotes(e.target.value)}
                  placeholder="e.g. Extra spicy, no onions, less oil..."
                  rows={2}
                  className="w-full resize-none rounded-xl border border-line p-3 text-sm text-ink outline-none transition-colors focus:border-primary"
                />
              </div>

              {/* Quantity + Add */}
              <div className="mt-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-ink-soft">QTY</span>
                  <div className="stepper-sm" style={{ background: '#C1440E', padding: '0.35em 0.5em' }}>
                    <button
                      onClick={() => setDetailQty((q) => Math.max(1, q - 1))}
                      style={{ background: 'rgba(255,255,255,0.18)', border: 'none', color: '#fff' }}
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span style={{ color: '#fff' }}>{detailQty}</span>
                    <button
                      onClick={() => setDetailQty((q) => q + 1)}
                      style={{ background: 'rgba(255,255,255,0.18)', border: 'none', color: '#fff' }}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <button onClick={submitDetail} className="btn-primary">
                  <Plus className="h-4 w-4" />
                  Add - {formatPrice(detailItem.price * detailQty)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating review button */}
      <button
        onClick={() => openReview(null)}
        className="fixed bottom-5 left-5 z-40 flex items-center gap-1.5 rounded-full border border-line bg-surface/95 px-4 py-2.5 text-xs font-semibold text-ink-soft shadow-lg backdrop-blur-sm transition-all hover:border-primary hover:text-primary active:scale-95"
        style={{ animation: 'fadeIn 0.4s ease' }}
      >
        <Star className="h-3.5 w-3.5 fill-saffron text-saffron" />
        <span>Reviews</span>
      </button>

      {/* Review Modal */}
      {showReviewModal && (
        <ReviewModal
          item={reviewTargetItem}
          onClose={() => {
            setShowReviewModal(false);
            setReviewTargetItem(null);
          }}
        />
      )}
    </div>
  );
}
