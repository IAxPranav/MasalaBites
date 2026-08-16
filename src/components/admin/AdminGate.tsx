import { useState, useEffect, type ReactNode } from 'react';
import { Lock, ArrowLeft, Flame, Eye, EyeOff } from 'lucide-react';

const ADMIN_PASSWORD = 'admin2026';

type AdminGateProps = {
  children: ReactNode;
  onExit: () => void;
};

export default function AdminGate({ children, onExit }: AdminGateProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const stored = sessionStorage.getItem('admin-unlocked');
    if (stored === 'true') setUnlocked(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setUnlocked(true);
      sessionStorage.setItem('admin-unlocked', 'true');
      setError(false);
    } else {
      setError(true);
      setAttempts((a) => a + 1);
      setPassword('');
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-alt px-6">
      <div className="w-full max-w-sm">
        <button
          onClick={onExit}
          className="mb-6 flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to ordering
        </button>

        <div className="rounded-3xl border border-line bg-surface p-8 shadow-xl">
          <div className="mb-6 flex flex-col items-center text-center">
            <img
              src="/logo.png"
              alt="Masala Bites"
              className="mb-3 h-16 w-auto object-contain rounded-2xl"
            />
            <h1 className="font-display text-xl font-bold text-ink">Admin Panel</h1>
            <p className="mt-1 text-xs text-ink-soft">Authorized access only</p>
          </div>

          <div className="mb-5 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink/10">
              <Lock className="h-7 w-7 text-ink" />
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="mb-2 block text-xs font-bold text-ink">Admin Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                placeholder="Enter admin password"
                autoFocus
                className={`w-full rounded-xl border bg-bg px-4 py-3 pr-11 text-sm text-ink outline-none transition-colors ${
                  error ? 'border-chili bg-chili/5' : 'border-line focus:border-primary'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <p className="mt-2 text-xs font-medium text-chili">
                Incorrect password{attempts > 1 ? ` (${attempts} attempts)` : ''}
              </p>
            )}

            <button type="submit" className="btn-primary mt-5 w-full">
              Unlock Admin Panel
            </button>
          </form>

          <p className="mt-5 text-center text-[0.65rem] leading-relaxed text-ink-soft/60">
            Access restricted to authorized restaurant administrators only.
          </p>
        </div>
      </div>
    </div>
  );
}
