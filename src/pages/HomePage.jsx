import { readModuleProgress, THEORY_MODULES } from '../config/theoryModules';
import AppFooter from '../components/AppFooter';

const ACCENT_STYLES = {
  sky: {
    badge: 'bg-sky-500 shadow-sky-500/25',
    ring: 'hover:ring-sky-500/40',
    bar: 'from-sky-500 to-cyan-400',
    text: 'text-sky-600 dark:text-sky-400',
    button: 'bg-sky-500 hover:bg-sky-600',
  },
  violet: {
    badge: 'bg-violet-500 shadow-violet-500/25',
    ring: 'hover:ring-violet-500/40',
    bar: 'from-violet-500 to-purple-400',
    text: 'text-violet-600 dark:text-violet-400',
    button: 'bg-violet-500 hover:bg-violet-600',
  },
  amber: {
    badge: 'bg-amber-500 shadow-amber-500/25',
    ring: 'hover:ring-amber-500/40',
    bar: 'from-amber-500 to-orange-400',
    text: 'text-amber-600 dark:text-amber-400',
    button: 'bg-amber-500 hover:bg-amber-600',
  },
};

function getModuleStats(module) {
  const saved = readModuleProgress(module);
  const questions = saved?.questions?.length
    ? saved.questions
    : module.defaultQuestions;
  const answers = saved?.answers ?? {};
  const total = questions.length;
  const answered = Object.keys(answers).length;
  const correct = questions.filter(
    (q) => answers[q.id] !== undefined && answers[q.id] === q.correctIndex,
  ).length;
  const scorePct = answered ? Math.round((correct / answered) * 100) : 0;
  return { total, answered, correct, scorePct };
}

export default function HomePage({ onSelect, darkMode, setDarkMode }) {
  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-sky-50 dark:from-aviation-navy dark:via-slate-900 dark:to-slate-950"
    >
      <header className="border-b border-slate-200/70 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 text-xl font-black text-white shadow-lg shadow-sky-500/30">
              PPL
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                מרכז תאוריה
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Cessna 152 · בחר נושא ללמידה
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDarkMode((d) => !d)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium transition hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            {darkMode ? 'מצב בהיר' : 'מצב כהה'}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <section className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
            לאיזה מבחן תרצה להתכונן?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
            כל נושא נשמר בנפרד — התקדמות, תשובות והגדרות נשמרים אוטומטית במכשיר שלך
          </p>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          {THEORY_MODULES.map((module) => {
            const styles = ACCENT_STYLES[module.accent] ?? ACCENT_STYLES.sky;
            const stats = getModuleStats(module);
            const progressPct = stats.total
              ? Math.round((stats.answered / stats.total) * 100)
              : 0;

            return (
              <article
                key={module.id}
                className={`group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:ring-2 ${styles.ring} dark:border-slate-700/80 dark:bg-slate-900/70`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-black text-white shadow-lg ${styles.badge}`}
                  >
                    {module.badge}
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {stats.total} שאלות
                  </span>
                </div>

                <h3 className="mt-5 text-2xl font-bold text-slate-900 dark:text-white">
                  {module.title}
                </h3>
                <p className={`mt-1 text-sm font-medium ${styles.text}`}>
                  {module.subtitle}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {module.description}
                </p>

                {stats.total > 0 && (
                  <div className="mt-5 space-y-2">
                    <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                      <span>
                        {stats.answered}/{stats.total} נענו
                        {stats.answered > 0 && ` · ${stats.scorePct}% הצלחה`}
                      </span>
                      <span>{progressPct}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full bg-gradient-to-l transition-all ${styles.bar}`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {stats.total === 0 && (
                  <p className="mt-5 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
                    עדיין אין שאלות — הוסף שאלות דרך מצב ניהול
                  </p>
                )}

                <button
                  type="button"
                  disabled={!module.available}
                  onClick={() => onSelect(module.id)}
                  className={`mt-6 w-full rounded-xl px-5 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${styles.button}`}
                >
                  {module.available ? 'התחל ללמוד' : 'בקרוב'}
                </button>
              </article>
            );
          })}

          <article className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/30">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 text-2xl text-slate-400 dark:border-slate-600">
              +
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">
              נושאים נוספים
            </h3>
            <p className="mt-2 max-w-xs text-sm text-slate-500 dark:text-slate-400">
              Radio, Human Factors, Air Law ועוד — יתווספו בקרוב
            </p>
          </article>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
