import pkg from '../../package.json';

export default function AppFooter({ subtitle }) {
  return (
    <footer className="border-t border-slate-200/70 py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-500">
      {subtitle && <p className="mb-2">{subtitle}</p>}
      <p>Cessna 152 Theory Hub · גרסה {pkg.version}</p>
      <p className="mt-1">פותח ע״י יצחק אנידג׳אר · ממאגר השאלות של יצחק סבח</p>
      <p className="mt-1">נתונים נשמרים ב-LocalStorage</p>
    </footer>
  );
}
