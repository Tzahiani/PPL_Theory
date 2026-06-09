import { useState } from 'react';
import { setVisitorName } from '../analytics/visitor';

export default function VisitorNameModal({ onRegistered }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setVisitorName(trimmed);
    onRegistered();
  };

  return (
    <div
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-100 via-slate-50 to-sky-50 p-4 dark:from-aviation-navy dark:via-slate-900 dark:to-slate-950"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 text-xl font-black text-white shadow-lg shadow-sky-500/30">
          PPL
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">ברוך הבא למרכז התאוריה</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          הזן את שמך כדי להמשיך. השם נדרש לשימוש באפליקציה.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="השם שלך"
            autoFocus
            required
            minLength={2}
            maxLength={40}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none ring-sky-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
          <button
            type="submit"
            disabled={name.trim().length < 2}
            className="w-full rounded-xl bg-sky-500 py-3 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:opacity-50"
          >
            כניסה לאפליקציה
          </button>
        </form>
      </div>
    </div>
  );
}
