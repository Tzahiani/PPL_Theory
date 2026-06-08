import CLOSED_BOOK_QUESTIONS from '../data/defaultQuestions';
import OPEN_BOOK_QUESTIONS from '../data/openBookQuestions';

export const THEORY_MODULES = [
  {
    id: 'closed-book',
    title: 'ספר סגור',
    subtitle: 'Cessna 152 · POH',
    description: 'מבחן תאוריה ללא חומר עזר — שינון POH, מגבלות, נהלים וחירום',
    badge: '152',
    accent: 'sky',
    questionCount: CLOSED_BOOK_QUESTIONS.length,
    storageKey: 'ppl152_closed_book_v1',
    legacyStorageKey: 'ppl152_exam_state_v1',
    defaultQuestions: CLOSED_BOOK_QUESTIONS,
    sourceLabel: 'מקור POH',
    categories: [
      { key: 'מנוע', label: 'מנוע', icon: 'ENG' },
      { key: 'מגבלות', label: 'מגבלות', icon: 'LIM' },
      { key: 'חירום', label: 'חירום', icon: 'EMG' },
      { key: 'נהלים', label: 'נהלים', icon: 'PROC' },
      { key: 'מכשירים', label: 'מכשירים', icon: 'INST' },
      { key: 'ביצועים', label: 'ביצועים', icon: 'PERF' },
      { key: 'מערכות', label: 'מערכות', icon: 'SYS' },
      { key: 'תחזוקה', label: 'תחזוקה', icon: 'MNT' },
    ],
    available: true,
  },
  {
    id: 'open-book',
    title: 'ספר פתוח',
    subtitle: 'Cessna 152 · Open Book',
    description: 'תרגול תאוריה עם גישה לחומר עזר — ביצועים, W&B, אווירודינמיקה ועוד',
    badge: 'OB',
    accent: 'violet',
    questionCount: OPEN_BOOK_QUESTIONS.length,
    storageKey: 'ppl152_open_book_v1',
    defaultQuestions: OPEN_BOOK_QUESTIONS,
    sourceLabel: 'מקור / הסבר',
    categories: [
      { key: 'ביצועים', label: 'ביצועים', icon: 'PERF' },
      { key: 'כללי', label: 'כללי', icon: 'GEN' },
      { key: 'אווירודינמיקה', label: 'אווירודינמיקה', icon: 'AERO' },
      { key: 'ניווט', label: 'ניווט', icon: 'NAV' },
      { key: 'מטאורולogia', label: 'מטאורולogia', icon: 'MET' },
      { key: 'תקנות', label: 'תקנות', icon: 'REG' },
    ],
    available: true,
  },
];

export function getModuleById(id) {
  return THEORY_MODULES.find((m) => m.id === id);
}

export function readModuleProgress(module) {
  try {
    const raw = localStorage.getItem(module.storageKey);
    if (!raw) {
      if (module.legacyStorageKey) {
        const legacy = localStorage.getItem(module.legacyStorageKey);
        if (legacy) return JSON.parse(legacy);
      }
      return null;
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
