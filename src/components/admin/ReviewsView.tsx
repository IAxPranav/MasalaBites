import { useState, useEffect, useCallback } from 'react';
import { Star, Eye, EyeOff, MessageSquare, Trash2, RefreshCw } from 'lucide-react';
import { supabase, type Review, type MenuItem } from '@/lib/supabase';

type ReviewWithItem = Review & {
  menu_items?: { name: string } | null;
};

export default function ReviewsView() {
  const [reviews, setReviews] = useState<ReviewWithItem[]>([]);
  const [menuItems, setMenuItems] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error('Error fetching reviews:', error);
    setReviews((data as ReviewWithItem[]) || []);
    setLoading(false);
  }, []);

  const fetchMenuItems = useCallback(async () => {
    const { data } = await supabase.from('menu_items').select('id, name');
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((item: { id: string; name: string }) => { map[item.id] = item.name; });
      setMenuItems(map);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
    fetchMenuItems();
  }, [fetchReviews, fetchMenuItems]);

  const toggleShowOnMenu = async (review: Review) => {
    setTogglingId(review.id);
    await supabase
      .from('reviews')
      .update({ show_on_menu: !review.show_on_menu })
      .eq('id', review.id);
    setTogglingId(null);
    fetchReviews();
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review permanently?')) return;
    await supabase.from('reviews').delete().eq('id', id);
    fetchReviews();
  };

  const approvedCount = reviews.filter((r) => r.show_on_menu).length;
  const pendingCount = reviews.filter((r) => !r.show_on_menu).length;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--admin-border)] border-t-[var(--admin-accent)]" />
      </div>
    );
  }

  return (
    <div className="admin-font">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--admin-ink)]">Customer Reviews</h2>
          <p className="mt-0.5 text-sm text-[var(--admin-ink-soft)]">
            Approve reviews to display them on the menu
          </p>
        </div>
        <button
          onClick={fetchReviews}
          className="admin-btn-ghost"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="admin-card text-center">
          <p className="admin-mono text-2xl font-bold text-[var(--admin-ink)]">{reviews.length}</p>
          <p className="mt-0.5 text-xs text-[var(--admin-ink-soft)]">Total Reviews</p>
        </div>
        <div className="admin-card text-center">
          <p className="admin-mono text-2xl font-bold text-[var(--admin-green)]">{approvedCount}</p>
          <p className="mt-0.5 text-xs text-[var(--admin-ink-soft)]">Showing on Menu</p>
        </div>
        <div className="admin-card text-center">
          <p className="admin-mono text-2xl font-bold text-[var(--admin-amber)]">{pendingCount}</p>
          <p className="mt-0.5 text-xs text-[var(--admin-ink-soft)]">Pending Approval</p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--admin-bg-alt)]">
            <MessageSquare className="h-8 w-8 text-[var(--admin-border)]" />
          </div>
          <p className="text-sm font-medium text-[var(--admin-ink-soft)]">No reviews yet</p>
          <p className="mt-1 text-xs text-[var(--admin-ink-muted)]">
            Customer reviews will appear here once submitted
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`admin-card flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between ${
                review.show_on_menu ? 'border-l-4 border-l-[var(--admin-green)]' : ''
              }`}
            >
              {/* Left: Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Stars */}
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${
                          s <= review.rating
                            ? 'fill-[#E3A72B] text-[#E3A72B]'
                            : 'text-[var(--admin-border)]'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-[var(--admin-ink)]">
                    {review.rating}/5
                  </span>
                  {review.show_on_menu && (
                    <span className="rounded-md border border-[#BBF7D0] bg-[var(--admin-green-soft)] px-2 py-0.5 text-[0.65rem] font-semibold text-[var(--admin-green)]">
                      Showing on menu
                    </span>
                  )}
                </div>

                {review.comment && (
                  <p className="mt-2 text-sm text-[var(--admin-ink)] leading-relaxed">
                    "{review.comment}"
                  </p>
                )}

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--admin-ink-soft)]">
                  <span>
                    By: <span className="font-medium text-[var(--admin-ink)]">
                      {review.customer_name || 'Anonymous'}
                    </span>
                  </span>
                  {review.menu_item_id && menuItems[review.menu_item_id] && (
                    <span>
                      Item: <span className="font-medium text-[var(--admin-ink)]">
                        {menuItems[review.menu_item_id]}
                      </span>
                    </span>
                  )}
                  {!review.menu_item_id && (
                    <span className="text-[var(--admin-ink-muted)]">General review</span>
                  )}
                  <span>{formatDate(review.created_at)}</span>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                <button
                  onClick={() => toggleShowOnMenu(review)}
                  disabled={togglingId === review.id}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 ${
                    review.show_on_menu
                      ? 'border-[#BBF7D0] bg-[var(--admin-green-soft)] text-[var(--admin-green)] hover:bg-green-100'
                      : 'border-[var(--admin-border)] bg-[var(--admin-bg-alt)] text-[var(--admin-ink-soft)] hover:border-[var(--admin-green)] hover:text-[var(--admin-green)]'
                  }`}
                >
                  {review.show_on_menu ? (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      Showing
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      Hidden
                    </>
                  )}
                </button>
                <button
                  onClick={() => deleteReview(review.id)}
                  className="flex items-center gap-1 rounded-lg border border-transparent px-2 py-1.5 text-xs font-medium text-[var(--admin-ink-muted)] transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
