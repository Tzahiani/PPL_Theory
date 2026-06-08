import { useRef } from 'react';
import pkg from '../../package.json';
import { openAdminRoute } from '../analytics/track';

export default function AppFooter({ subtitle }) {
  const clickCount = useRef(0);
  const clickTimer = useRef(null);

  const handleVersionClick = () => {
    clickCount.current += 1;
    clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => {
      clickCount.current = 0;
    }, 800);
    if (clickCount.current >= 5) {
      clickCount.current = 0;
      openAdminRoute();
    }
  };

  return (
    <footer className="border-t border-slate-200/70 py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-500">
      {subtitle && <p className="mb-2">{subtitle}</p>}
      <p>
        Cessna 152 Theory Hub ·{' '}
        <button
          type="button"
          onClick={handleVersionClick}
          className="cursor-default select-none border-none bg-transparent p-0 text-inherit"
          aria-hidden
        >
          גרסה {pkg.version}
        </button>
      </p>
      <p className="mt-1">פותח ע״י יצחק אנידג׳אר · ממאגר השאלות של יצחק סבח</p>
      <p className="mt-1">נתונים נשמרים ב-LocalStorage</p>
    </footer>
  );
}
