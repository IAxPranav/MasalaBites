import { useState, useEffect, type ReactNode } from 'react';
import { Lock, ArrowLeft, Receipt, Eye, EyeOff } from 'lucide-react';

const COUNTER_PASSWORD = 'counter2026';

type CashCounterGateProps = {
  children: ReactNode;
  onExit: () => void;
};

export default function CashCounterGate({ children, onExit }: CashCounterGateProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const stored = sessionStorage.getItem('cashcounter-unlocked');
    if (stored === 'true') setUnlocked(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === COUNTER_PASSWORD) {
      setUnlocked(true);
      sessionStorage.setItem('cashcounter-unlocked', 'true');
      setError(false);
    } else {
      setError(true);
      setAttempts((a) => a + 1);
      setPassword('');
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--admin-bg-alt)] px-6" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="w-full max-w-sm">
        <button
          onClick={onExit}
          className="mb-6 flex items-center gap-1.5 text-sm font-medium text-[var(--admin-ink-soft)] transition-colors hover:text-[var(--admin-accent)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to ordering
        </button>

        <div className="rounded-2xl border border-[var(--admin-border)] bg-white p-8 shadow-lg">
          {/* Logo */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[var(--admin-accent)] bg-[var(--admin-accent-soft)]">
              <Receipt className="h-7 w-7 text-[var(--admin-accent)]" />
            </div>
            <h1 className="text-xl font-bold text-[var(--admin-ink)]">Cash Counter</h1>
            <p className="mt-1 text-xs text-[var(--admin-ink-soft)]">Staff access only</p>
          </div>

          {/* Lock icon */}
          <div className="mb-5 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--admin-bg-alt)]">
              <Lock className="h-6 w-6 text-[var(--admin-ink-soft)]" />
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="mb-2 block text-xs font-bold text-[var(--admin-ink)]">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                placeholder="Enter counter password"
                autoFocus
                className={`w-full rounded-xl border bg-[var(--admin-bg-alt)] px-4 py-3 pr-11 text-sm text-[var(--admin-ink)] outline-none transition-colors ${
                  error
                    ? 'border-red-400 bg-red-50'
                    : 'border-[var(--admin-border)] focus:border-[var(--admin-accent)]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--admin-ink-soft)] hover:text-[var(--admin-ink)]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <p className="mt-2 text-xs font-medium text-red-600">
                Incorrect password{attempts > 1 ? ` (${attempts} attempts)` : ''}
              </p>
            )}

            <button
              type="submit"
              className="admin-btn-primary mt-5 w-full justify-center py-3 text-sm"
            >
              Unlock Counter Panel
            </button>
          </form>

          <p className="mt-5 text-center text-[0.65rem] leading-relaxed text-[var(--admin-ink-muted)]">
            Access restricted to authorized counter staff only.
          </p>
        </div>
      </div>
    </div>
  );
}
