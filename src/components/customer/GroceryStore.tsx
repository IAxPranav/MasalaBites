import { ShoppingBag, Clock, Sparkles, ArrowLeft } from 'lucide-react';

type GroceryStoreProps = {
  onBack: () => void;
};

export default function GroceryStore({ onBack }: GroceryStoreProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-center">
      {/* Back */}
      <button
        onClick={onBack}
        className="absolute left-5 top-5 flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:border-primary hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Animated icon */}
      <div className="relative mb-8">
        <div className="flex h-32 w-32 items-center justify-center rounded-3xl border-2 border-line bg-surface shadow-xl">
          <ShoppingBag className="h-16 w-16 text-line" />
        </div>
        {/* Floating sparkles */}
        <div
          className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-saffron shadow-md"
          style={{ animation: 'bumpAnim 2s ease infinite' }}
        >
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div
          className="absolute -bottom-2 -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary shadow-md"
          style={{ animation: 'bumpAnim 2.4s ease infinite 0.4s' }}
        >
          <Clock className="h-3 w-3 text-white" />
        </div>
      </div>

      {/* Text */}
      <p className="eyebrow mb-3">Coming Soon</p>
      <h1 className="font-display text-3xl font-bold text-ink lg:text-4xl">
        Masala Bites
        <br />
        <span className="text-primary">Grocery Store</span>
      </h1>
      <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">
        Fresh spices, authentic ingredients, and ready-to-cook meal kits — delivered straight to
        your door. We're working hard to bring this to you.
      </p>

      {/* Progress bar */}
      <div className="mt-8 w-full max-w-xs">
        <div className="mb-2 flex items-center justify-between text-xs text-ink-soft">
          <span className="font-mono">Development in progress</span>
          <span className="font-mono font-bold text-primary">68%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-bg-alt">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-saffron"
            style={{ width: '68%', transition: 'width 1s ease' }}
          />
        </div>
      </div>

      {/* Badge */}
      <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-cardamom/30 bg-cardamom/10 px-5 py-2.5">
        <div className="h-2 w-2 rounded-full bg-cardamom" style={{ animation: 'bumpAnim 1.5s ease infinite' }} />
        <span className="text-sm font-semibold text-cardamom">Notify me when it's live</span>
      </div>
    </div>
  );
}
