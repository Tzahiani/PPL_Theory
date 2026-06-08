import { useEffect, useState } from 'react';
import { dismissNamePrompt, setVisitorName, shouldShowNamePrompt } from '../analytics/visitor';
import { analyticsEnabled } from '../analytics/track';

export default function VisitorNameModal() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    if (analyticsEnabled() && shouldShowNamePrompt()) {
      setOpen(true);
    }
  }, []);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setVisitorName(trimmed);
    setOpen(false);
  };

  const handleSkip = () => {
    dismissNamePrompt();
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div
        dir="rtl"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">ברוך הבא!</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          איך לקרוא לך? השם ישמש לזיהוי התקדמותך (לא יוצג לאחרים).
        </p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="השם שלך"
            autoFocus
            maxLength={40}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none ring-sky-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 rounded-xl bg-sky-500 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:opacity-50"
            >
              המשך
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              דלג
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
