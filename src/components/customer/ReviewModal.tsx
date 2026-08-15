import { useState } from 'react';
import { X, Star, Send, MessageSquare } from 'lucide-react';
import { supabase, type MenuItem } from '@/lib/supabase';

type ReviewModalProps = {
  item?: MenuItem | null;
  onClose: () => void;
};

export default function ReviewModal({ item, onClose }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    setSubmitting(true);
    await supabase.from('reviews').insert({
      menu_item_id: item?.id ?? null,
      rating,
      comment: comment.trim() || null,
      customer_name: name.trim() || null,
      show_on_menu: false,
    });
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  const starLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="slide-up w-full max-w-md rounded-t-3xl bg-surface shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-bold text-ink">
              {item ? `Review ${item.name}` : 'Leave a Review'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-alt text-ink-soft hover:bg-line"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cardamom/15">
                <Star className="h-8 w-8 fill-cardamom text-cardamom" />
              </div>
              <h3 className="font-display text-xl font-bold text-ink">Thank you!</h3>
              <p className="text-sm text-ink-soft">Your review has been submitted for approval.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Star rating */}
              <div>
                <p className="mb-3 text-sm font-bold text-ink">Your Rating</p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="star-btn"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          star <= (hoverRating || rating)
                            ? 'fill-saffron text-saffron'
                            : 'text-line'
                        }`}
                      />
                    </button>
                  ))}
                  {(hoverRating || rating) > 0 && (
                    <span className="ml-2 text-sm font-semibold text-ink">
                      {starLabels[hoverRating || rating]}
                    </span>
                  )}
                </div>
                {rating === 0 && (
                  <p className="mt-1.5 text-xs text-ink-soft">Select at least 1 star</p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink">
                  Your Name <span className="font-normal text-ink-soft">(optional)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul S."
                  className="w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-primary"
                />
              </div>

              {/* Comment */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink">
                  Your Review <span className="font-normal text-ink-soft">(optional)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-line bg-bg px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-primary"
                />
              </div>

              <button
                type="submit"
                disabled={rating === 0 || submitting}
                className="btn-primary w-full"
              >
                <Send className="h-4 w-4" />
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
