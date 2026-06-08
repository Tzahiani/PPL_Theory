import { useCallback, useEffect, useState } from 'react';
import {
  analyticsEnabled,
  clearAdminSession,
  closeAdminRoute,
  fetchAdminStats,
  loadAdminSession,
  saveAdminSession,
} from '../analytics/track';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDay(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
  });
}

function pct(num, den) {
  if (!den) return 0;
  return Math.round((num / den) * 100);
}

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/60">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function eventLabel(type) {
  const labels = {
    app_visit: 'כניסה לאפליקציה',
    module_open: 'פתיחת נושא',
    answer: 'תשובה',
    exam_submit: 'הגשת מבחן',
    session_end: 'סיום סשן',
  };
  return labels[type] ?? type;
}

function moduleLabel(id) {
  const labels = {
    'closed-book': 'ספר סגור',
    'open-book': 'ספר פתוח',
  };
  return labels[id] ?? id ?? '—';
}

export default function AdminStatsPage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  const loadStats = useCallback(async (adminKey) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAdminStats(adminKey);
      setStats(data);
      setAuthenticated(true);
      saveAdminSession(adminKey);
    } catch (err) {
      setError(err.message || 'שגיאה');
      setAuthenticated(false);
      clearAdminSession();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = loadAdminSession();
    if (saved) loadStats(saved);
  }, [loadStats]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    loadStats(password.trim());
  };

  const handleLogout = () => {
    clearAdminSession();
    setAuthenticated(false);
    setStats(null);
    setPassword('');
  };

  const handleClose = () => {
    closeAdminRoute();
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  };

  if (!analyticsEnabled()) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
        <div className="max-w-md rounded-2xl border border-amber-300 bg-amber-50 p-6 text-center dark:border-amber-700 dark:bg-amber-950/40">
          <p className="font-semibold text-amber-900 dark:text-amber-200">Analytics לא מוגדר</p>
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-300">
            הגדר VITE_SUPABASE_URL ו-VITE_SUPABASE_ANON_KEY והרץ את supabase/setup.sql
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="mt-4 rounded-xl bg-slate-800 px-4 py-2 text-sm text-white"
          >
            חזרה
          </button>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
        >
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">סטטיסטיקות — מנהל</h1>
          <p className="mt-1 text-sm text-slate-500">גישה מוגבלת</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="סיסמת מנהל"
            autoFocus
            className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-sky-500 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-50"
            >
              {loading ? 'טוען...' : 'כניסה'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm dark:border-slate-600"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    );
  }

  const summary = stats?.summary ?? {};
  const accuracy = pct(summary.correct_answers, summary.total_answers);

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-950 dark:to-slate-900"
    >
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">לוח סטטיסטיקות</h1>
            <p className="text-xs text-slate-500">נגיש רק למנהל · לא מוצג למשתמשים</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => loadStats(loadAdminSession())}
              disabled={loading}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600"
            >
              רענון
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600"
            >
              יציאה
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl bg-slate-800 px-3 py-2 text-sm text-white dark:bg-slate-700"
            >
              חזרה לאפליקציה
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="מבקרים ייחודיים" value={summary.unique_visitors ?? 0} />
          <StatCard label="עם שם" value={summary.named_visitors ?? 0} />
          <StatCard
            label="כניסות (7 ימים)"
            value={summary.visits_7d ?? 0}
            hint={`היום: ${summary.visits_today ?? 0}`}
          />
          <StatCard
            label="זמן סשן ממוצע"
            value={`${summary.avg_session_sec ?? 0} שנ׳`}
          />
          <StatCard label="סה״כ תשובות" value={summary.total_answers ?? 0} />
          <StatCard
            label="דיוק כללי"
            value={`${accuracy}%`}
            hint={`${summary.correct_answers ?? 0} נכונות`}
          />
          <StatCard label="הגשות מבחן" value={summary.exam_submissions ?? 0} />
          <StatCard label="סה״כ כניסות" value={summary.total_visits ?? 0} />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">מי נכנס</h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                <tr className="text-right text-slate-500">
                  <th className="px-4 py-3 font-medium">שם</th>
                  <th className="px-4 py-3 font-medium">כניסות</th>
                  <th className="px-4 py-3 font-medium">תשובות</th>
                  <th className="px-4 py-3 font-medium">דיוק</th>
                  <th className="px-4 py-3 font-medium">מבחנים</th>
                  <th className="px-4 py-3 font-medium">נושאים</th>
                  <th className="px-4 py-3 font-medium">נראה לאחרונה</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.visitors ?? []).map((v) => (
                  <tr key={v.visitor_id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {v.visitor_name}
                    </td>
                    <td className="px-4 py-3">{v.visit_count}</td>
                    <td className="px-4 py-3">{v.answer_count}</td>
                    <td className="px-4 py-3">{pct(v.correct_count, v.answer_count)}%</td>
                    <td className="px-4 py-3">{v.exam_submissions}</td>
                    <td className="px-4 py-3">{v.modules_used}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(v.last_seen)}</td>
                  </tr>
                ))}
                {(stats?.visitors ?? []).length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      אין נתונים עדיין
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">לפי נושא</h2>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                  <tr className="text-right text-slate-500">
                    <th className="px-4 py-3 font-medium">נושא</th>
                    <th className="px-4 py-3 font-medium">פתיחות</th>
                    <th className="px-4 py-3 font-medium">תשובות</th>
                    <th className="px-4 py-3 font-medium">ציון ממוצע</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.modules ?? []).map((m) => (
                    <tr key={m.module_id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="px-4 py-3 font-medium">{moduleLabel(m.module_id)}</td>
                      <td className="px-4 py-3">{m.opens}</td>
                      <td className="px-4 py-3">
                        {m.answers} ({pct(m.correct, m.answers)}%)
                      </td>
                      <td className="px-4 py-3">{m.avg_score_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
              קטגוריות חלשות
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                  <tr className="text-right text-slate-500">
                    <th className="px-4 py-3 font-medium">נושא</th>
                    <th className="px-4 py-3 font-medium">קטגוריה</th>
                    <th className="px-4 py-3 font-medium">טעויות</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.weak_categories ?? []).map((c, i) => (
                    <tr key={`${c.module_id}-${c.category}-${i}`} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="px-4 py-3">{moduleLabel(c.module_id)}</td>
                      <td className="px-4 py-3">{c.category}</td>
                      <td className="px-4 py-3 text-red-600">{c.wrong_count}</td>
                    </tr>
                  ))}
                  {(stats?.weak_categories ?? []).length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                        אין מספיק נתונים
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
            פעילות יומית (30 יום)
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                <tr className="text-right text-slate-500">
                  <th className="px-4 py-3 font-medium">תאריך</th>
                  <th className="px-4 py-3 font-medium">כניסות</th>
                  <th className="px-4 py-3 font-medium">תשובות</th>
                  <th className="px-4 py-3 font-medium">מבקרים</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.daily ?? []).map((d) => (
                  <tr key={d.day} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-3">{formatDay(d.day)}</td>
                    <td className="px-4 py-3">{d.visits}</td>
                    <td className="px-4 py-3">{d.answers}</td>
                    <td className="px-4 py-3">{d.unique_visitors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
            אירועים אחרונים
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                <tr className="text-right text-slate-500">
                  <th className="px-4 py-3 font-medium">זמן</th>
                  <th className="px-4 py-3 font-medium">שם</th>
                  <th className="px-4 py-3 font-medium">אירוע</th>
                  <th className="px-4 py-3 font-medium">נושא</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recent_events ?? []).map((e, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-3 text-slate-500">{formatDate(e.created_at)}</td>
                    <td className="px-4 py-3">{e.visitor_name || '—'}</td>
                    <td className="px-4 py-3">{eventLabel(e.event_type)}</td>
                    <td className="px-4 py-3">{moduleLabel(e.module_id)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
