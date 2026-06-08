import { useCallback, useEffect, useMemo, useState } from 'react';
import AppFooter from './components/AppFooter';
import { trackAnswer, trackExamSubmit } from './analytics/track';

const FILTER_ALL = 'all';
const FILTER_INCORRECT = 'incorrect';
const FILTER_UNANSWERED = 'unanswered';

const OPTION_LABELS = ['א', 'ב', 'ג', 'ד'];

function loadState(storageKey, legacyStorageKey) {
  try {
    let raw = localStorage.getItem(storageKey);
    if (!raw && legacyStorageKey) {
      raw = localStorage.getItem(legacyStorageKey);
      if (raw) {
        localStorage.setItem(storageKey, raw);
      }
    }
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState(storageKey, state) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
}

function isAnswerCorrect(question, answers) {
  const selected = answers[question.id];
  return selected !== undefined && selected === question.correctIndex;
}

function isAnswered(question, answers) {
  return answers[question.id] !== undefined;
}

function nextQuestionId(questions) {
  return questions.reduce((max, q) => Math.max(max, q.id), 0) + 1;
}

function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildShuffledOrder(questions) {
  return shuffleArray(questions.map((q) => q.id));
}

function syncQuestionOrder(order, questions) {
  const ids = new Set(questions.map((q) => q.id));
  const kept = order.filter((id) => ids.has(id));
  const missing = questions.map((q) => q.id).filter((id) => !kept.includes(id));
  return kept.length === 0 && missing.length > 0
    ? shuffleArray(missing)
    : [...kept, ...shuffleArray(missing)];
}

function sortByOrder(items, order) {
  const rank = new Map(order.map((id, i) => [id, i]));
  return [...items].sort(
    (a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity),
  );
}

function QuestionCard({
  question,
  index,
  answers,
  revealed,
  feedbackMode,
  inputType,
  onAnswer,
  sourceLabel,
  compact = false,
}) {
  const selected = answers[question.id];
  const answered = selected !== undefined;
  const showResult = revealed || (feedbackMode === 'immediate' && answered);
  const correct = isAnswerCorrect(question, answers);

  const cardBorder = showResult
    ? correct
      ? 'border-emerald-500/60 bg-emerald-500/5'
      : 'border-red-500/60 bg-red-500/5'
    : 'border-slate-200/80 dark:border-slate-700/80';

  return (
    <article
      className={`rounded-2xl border ${cardBorder} bg-white/80 p-5 shadow-sm backdrop-blur dark:bg-slate-900/60 ${compact ? '' : 'transition-colors duration-300'}`}
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 min-w-9 items-center justify-center rounded-xl bg-sky-500/15 px-2 font-mono text-sm font-bold text-sky-600 dark:text-sky-400">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
            {question.category}
          </span>
        </div>
        {showResult && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              correct
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-500/20 text-red-700 dark:text-red-300'
            }`}
          >
            {correct ? 'נכון' : 'שגוי'}
          </span>
        )}
      </header>

      <p className="mb-5 text-base font-medium leading-relaxed text-slate-800 dark:text-slate-100">
        {question.question}
      </p>

      {inputType === 'select' ? (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
            בחר תשובה
          </label>
          <select
            value={selected ?? ''}
            disabled={showResult && feedbackMode === 'immediate'}
            onChange={(e) => onAnswer(question.id, Number(e.target.value))}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-sky-500/30 transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 dark:bg-slate-800"
          >
            <option value="" disabled>
              — בחר אפשרות —
            </option>
            {question.options.map((opt, i) => (
              <option key={i} value={i}>
                {OPTION_LABELS[i]}. {opt}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <fieldset className="space-y-2">
          <legend className="sr-only">אפשרויות תשובה</legend>
          {question.options.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrectOption = i === question.correctIndex;
            let optionStyle =
              'border-slate-200 hover:border-sky-400/60 dark:border-slate-700 dark:hover:border-sky-500/50';

            if (showResult) {
              if (isCorrectOption) {
                optionStyle = 'border-emerald-500 bg-emerald-500/10';
              } else if (isSelected && !isCorrectOption) {
                optionStyle = 'border-red-500 bg-red-500/10';
              } else {
                optionStyle = 'border-slate-200 opacity-60 dark:border-slate-700';
              }
            } else if (isSelected) {
              optionStyle = 'border-sky-500 bg-sky-500/10';
            }

            return (
              <label
                key={i}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${optionStyle} ${showResult && feedbackMode === 'immediate' ? 'pointer-events-none' : ''}`}
              >
                <input
                  type="radio"
                  name={`q-${question.id}`}
                  checked={isSelected}
                  disabled={showResult && feedbackMode === 'immediate'}
                  onChange={() => onAnswer(question.id, i)}
                  className="mt-1 h-4 w-4 accent-sky-500"
                />
                <span className="text-sm leading-relaxed">
                  <span className="font-bold text-sky-600 dark:text-sky-400">
                    {OPTION_LABELS[i]}.
                  </span>{' '}
                  {opt}
                </span>
              </label>
            );
          })}
        </fieldset>
      )}

      {showResult && (
        <div
          className={`mt-5 rounded-xl border p-4 text-sm leading-relaxed ${
            correct
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100'
              : 'border-red-500/40 bg-red-500/10 text-red-900 dark:text-red-100'
          }`}
        >
          <p className="mb-1 font-bold">
            {correct ? 'תשובה נכונה' : `תשובה נכונה: ${OPTION_LABELS[question.correctIndex]}`}
          </p>
          {!correct && selected !== undefined && (
            <p className="mb-2 opacity-90">
              בחרת: {OPTION_LABELS[selected]}. {question.options[selected]}
            </p>
          )}
          <p className="font-medium text-slate-700 dark:text-slate-200">
            <span className="text-xs uppercase tracking-wide opacity-70">{sourceLabel}: </span>
            {question.poh}
          </p>
        </div>
      )}
    </article>
  );
}

export default function ExamSimulator({ module, onBack, darkMode, setDarkMode }) {
  const STORAGE_KEY = module.storageKey;
  const CATEGORY_META = module.categories;
  const defaultQuestions = module.defaultQuestions;

  const [questions, setQuestions] = useState(defaultQuestions);
  const [answers, setAnswers] = useState({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [activeFilter, setActiveFilter] = useState(FILTER_ALL);
  const [viewMode, setViewMode] = useState('single');
  const [feedbackMode, setFeedbackMode] = useState('immediate');
  const [inputType, setInputType] = useState('radio');
  const [mainTab, setMainTab] = useState('exam');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionOrder, setQuestionOrder] = useState(() =>
    buildShuffledOrder(defaultQuestions),
  );
  const [darkModeLocal, setDarkModeLocal] = useState(true);
  const isDarkModeControlled = setDarkMode !== undefined;
  const resolvedDarkMode = isDarkModeControlled ? darkMode : darkModeLocal;
  const toggleDarkMode = isDarkModeControlled
    ? () => setDarkMode((d) => !d)
    : () => setDarkModeLocal((d) => !d);
  const [hydrated, setHydrated] = useState(false);

  const [form, setForm] = useState({
    id: null,
    category: module.categories[0]?.key ?? 'כללי',
    question: '',
    option0: '',
    option1: '',
    option2: '',
    option3: '',
    correctIndex: 0,
    poh: '',
  });

  useEffect(() => {
    const saved = loadState(STORAGE_KEY, module.legacyStorageKey);
    if (saved) {
      if (saved.questions?.length) setQuestions(saved.questions);
      if (saved.answers) setAnswers(saved.answers);
      if (saved.examSubmitted !== undefined) setExamSubmitted(saved.examSubmitted);
      if (saved.activeFilter) setActiveFilter(saved.activeFilter);
      if (saved.viewMode) setViewMode(saved.viewMode);
      if (saved.feedbackMode) setFeedbackMode(saved.feedbackMode);
      if (saved.inputType) setInputType(saved.inputType);
      if (saved.darkMode !== undefined && !isDarkModeControlled) {
        setDarkModeLocal(saved.darkMode);
      }
      const loadedQuestions = saved.questions?.length ? saved.questions : defaultQuestions;
      const hasProgress = saved.answers && Object.keys(saved.answers).length > 0;
      if (saved.questionOrder?.length && hasProgress) {
        setQuestionOrder(syncQuestionOrder(saved.questionOrder, loadedQuestions));
      } else {
        setQuestionOrder(buildShuffledOrder(loadedQuestions));
      }
    }
    setHydrated(true);
  }, [STORAGE_KEY, defaultQuestions, isDarkModeControlled, module.legacyStorageKey]);

  useEffect(() => {
    if (!hydrated) return;
    saveState(STORAGE_KEY, {
      questions,
      answers,
      examSubmitted,
      activeFilter,
      viewMode,
      feedbackMode,
      inputType,
      darkMode: resolvedDarkMode,
      questionOrder,
    });
  }, [
    hydrated,
    STORAGE_KEY,
    questions,
    answers,
    examSubmitted,
    activeFilter,
    viewMode,
    feedbackMode,
    inputType,
    resolvedDarkMode,
    questionOrder,
  ]);

  useEffect(() => {
    if (!hydrated) return;
    setQuestionOrder((prev) => syncQuestionOrder(prev, questions));
  }, [questions, hydrated]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedDarkMode);
  }, [resolvedDarkMode]);

  const revealed = feedbackMode === 'submit' && examSubmitted;

  const filteredQuestions = useMemo(() => {
    const filtered = questions.filter((q) => {
      if (activeFilter === FILTER_ALL) return true;
      if (activeFilter === FILTER_INCORRECT) {
        return isAnswered(q, answers) && !isAnswerCorrect(q, answers);
      }
      if (activeFilter === FILTER_UNANSWERED) {
        return !isAnswered(q, answers);
      }
      return q.category === activeFilter;
    });
    return sortByOrder(filtered, questionOrder);
  }, [questions, answers, activeFilter, questionOrder]);

  useEffect(() => {
    if (currentIndex >= filteredQuestions.length && filteredQuestions.length > 0) {
      setCurrentIndex(filteredQuestions.length - 1);
    }
  }, [filteredQuestions.length, currentIndex]);

  const stats = useMemo(() => {
    const total = questions.length;
    const answeredCount = questions.filter((q) => isAnswered(q, answers)).length;
    const correctCount = questions.filter((q) => isAnswerCorrect(q, answers)).length;
    const incorrectCount = questions.filter(
      (q) => isAnswered(q, answers) && !isAnswerCorrect(q, answers),
    ).length;
    const unansweredCount = total - answeredCount;
    const scorePct = answeredCount ? Math.round((correctCount / answeredCount) * 100) : 0;
    const progressPct = total ? Math.round((answeredCount / total) * 100) : 0;
    return {
      total,
      answeredCount,
      correctCount,
      incorrectCount,
      unansweredCount,
      scorePct,
      progressPct,
    };
  }, [questions, answers]);

  const handleAnswer = useCallback(
    (questionId, index) => {
      if (revealed) return;
      setAnswers((prev) => ({ ...prev, [questionId]: index }));
      const question = questions.find((q) => q.id === questionId);
      if (question) {
        trackAnswer(module.id, {
          questionId,
          correct: index === question.correctIndex,
          category: question.category,
        });
      }
      if (feedbackMode === 'submit') {
        setExamSubmitted(false);
      }
    },
    [revealed, feedbackMode, questions, module.id],
  );

  const handleShuffle = useCallback(() => {
    setQuestionOrder(buildShuffledOrder(questions));
    setCurrentIndex(0);
  }, [questions]);

  const handleReset = () => {
    if (!window.confirm('לאפס את כל התשובות ולהתחיל מחדש?')) return;
    setAnswers({});
    setExamSubmitted(false);
    setCurrentIndex(0);
    setQuestionOrder(buildShuffledOrder(questions));
  };

  const handleSubmitExam = () => {
    const unanswered = questions.filter((q) => !isAnswered(q, answers));
    if (unanswered.length > 0) {
      const proceed = window.confirm(
        `נותרו ${unanswered.length} שאלות ללא מענה. להגיש בכל זאת?`,
      );
      if (!proceed) return;
    }
    setExamSubmitted(true);
    trackExamSubmit(module.id, {
      scorePct: stats.scorePct,
      answered: stats.answeredCount,
      correct: stats.correctCount,
      total: stats.total,
    });
  };

  const resetForm = () => {
    setForm({
      id: null,
      category: module.categories[0]?.key ?? 'כללי',
      question: '',
      option0: '',
      option1: '',
      option2: '',
      option3: '',
      correctIndex: 0,
      poh: '',
    });
  };

  const handleSaveQuestion = (e) => {
    e.preventDefault();
    const options = [form.option0, form.option1, form.option2, form.option3];
    if (!form.question.trim() || options.some((o) => !o.trim()) || !form.poh.trim()) {
      alert('יש למלא את כל השדות');
      return;
    }

    const payload = {
      id: form.id ?? nextQuestionId(questions),
      category: form.category,
      question: form.question.trim(),
      options: options.map((o) => o.trim()),
      correctIndex: Number(form.correctIndex),
      poh: form.poh.trim(),
    };

    if (form.id) {
      setQuestions((prev) => prev.map((q) => (q.id === form.id ? payload : q)));
    } else {
      setQuestions((prev) => [...prev, payload]);
    }
    resetForm();
  };

  const handleEditQuestion = (q) => {
    setForm({
      id: q.id,
      category: q.category,
      question: q.question,
      option0: q.options[0],
      option1: q.options[1],
      option2: q.options[2],
      option3: q.options[3],
      correctIndex: q.correctIndex,
      poh: q.poh,
    });
    setMainTab('manage');
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleDeleteQuestion = (id) => {
    if (!window.confirm('למחוק שאלה זו?')) return;
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (form.id === id) resetForm();
  };

  const currentQuestion = filteredQuestions[currentIndex];

  if (!hydrated) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-sky-50 dark:from-aviation-navy dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium transition hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
              >
                → חזרה
              </button>
            )}
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-black text-white shadow-lg ${
                module.accent === 'violet'
                  ? 'bg-violet-500 shadow-violet-500/25'
                  : 'bg-sky-500 shadow-sky-500/25'
              }`}
            >
              {module.badge}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {module.title}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {module.subtitle}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleDarkMode}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium transition hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
            >
              {resolvedDarkMode ? 'מצב בהיר' : 'מצב כהה'}
            </button>
            <button
              type="button"
              onClick={handleShuffle}
              className="rounded-xl border border-sky-300 px-3 py-2 text-sm font-medium text-sky-600 transition hover:bg-sky-50 dark:border-sky-700 dark:text-sky-400 dark:hover:bg-sky-950/40"
            >
              ערבוב שאלות
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              איפוס מבחן
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {/* Dashboard */}
        <section className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'סה״כ שאלות', value: stats.total, accent: 'text-sky-500' },
            { label: 'נענו', value: stats.answeredCount, accent: 'text-amber-500' },
            { label: 'נכונות', value: stats.correctCount, accent: 'text-emerald-500' },
            { label: 'אחוז הצלחה', value: `${stats.scorePct}%`, accent: 'text-violet-500' },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 dark:border-slate-700/80 dark:bg-slate-900/70"
            >
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.label}</p>
              <p className={`mt-1 text-3xl font-bold ${item.accent}`}>{item.value}</p>
            </div>
          ))}
        </section>

        {/* Progress bar */}
        <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-700/80 dark:bg-slate-900/70">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-semibold">התקדמות מבחן</span>
            <span className="font-mono text-slate-600 dark:text-slate-300">
              {stats.correctCount}/{stats.total} נכונות · {stats.answeredCount}/{stats.total} נענו
              {stats.answeredCount > 0 && ` · ${stats.scorePct}% הצלחה`}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-l from-sky-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${stats.progressPct}%` }}
            />
          </div>
        </section>

        {/* Main tabs */}
        <div className="flex gap-2">
          {[
            { id: 'exam', label: 'מצב מבחן' },
            { id: 'manage', label: 'ניהול שאלות' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMainTab(tab.id)}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                mainTab === tab.id
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                  : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {mainTab === 'exam' && (
          <>
            {/* Filters */}
            <section className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: FILTER_ALL, label: 'כל השאלות' },
                  { id: FILTER_INCORRECT, label: `שגויות (${stats.incorrectCount})` },
                  { id: FILTER_UNANSWERED, label: `לא נענו (${stats.unansweredCount})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setActiveFilter(f.id);
                      setCurrentIndex(0);
                    }}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                      activeFilter === f.id
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'border border-slate-300 bg-white text-slate-600 hover:border-sky-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_META.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => {
                      setActiveFilter(cat.key);
                      setCurrentIndex(0);
                    }}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      activeFilter === cat.key
                        ? 'bg-amber-500 text-white'
                        : 'border border-slate-300 bg-white text-slate-600 hover:border-amber-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {cat.icon} · {cat.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Controls */}
            <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-4 dark:border-slate-700/80 dark:bg-slate-900/70">
              <div className="flex rounded-xl border border-slate-300 p-1 dark:border-slate-600">
                {[
                  { id: 'single', label: 'שאלה בודדת' },
                  { id: 'list', label: 'רשימה מלאה' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setViewMode(m.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      viewMode === m.id
                        ? 'bg-sky-500 text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <div className="flex rounded-xl border border-slate-300 p-1 dark:border-slate-600">
                {[
                  { id: 'immediate', label: 'משוב מיידי' },
                  { id: 'submit', label: 'הגשה בסוף' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setFeedbackMode(m.id);
                      setExamSubmitted(false);
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      feedbackMode === m.id
                        ? 'bg-violet-500 text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <div className="flex rounded-xl border border-slate-300 p-1 dark:border-slate-600">
                {[
                  { id: 'radio', label: 'רדיו' },
                  { id: 'select', label: 'Dropdown' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setInputType(m.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      inputType === m.id
                        ? 'bg-emerald-500 text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {feedbackMode === 'submit' && (
                <button
                  type="button"
                  onClick={handleSubmitExam}
                  className="mr-auto rounded-xl bg-gradient-to-l from-violet-600 to-sky-600 px-5 py-2 text-sm font-bold text-white shadow-lg transition hover:opacity-90"
                >
                  {examSubmitted ? 'המבחן הוגש' : 'הגש מבחן'}
                </button>
              )}
              <span className="text-xs text-slate-500 dark:text-slate-400">
                מוצגות {filteredQuestions.length} שאלות
              </span>
            </section>

            {/* Questions */}
            {filteredQuestions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 dark:border-slate-600">
                {questions.length === 0
                  ? 'אין שאלות בנושא זה — הוסף שאלות דרך לשונית "ניהול שאלות"'
                  : 'אין שאלות במסנן הנוכחי'}
              </div>
            ) : viewMode === 'single' ? (
              <div className="space-y-4">
                <QuestionCard
                  question={currentQuestion}
                  index={currentIndex}
                  answers={answers}
                  revealed={revealed}
                  feedbackMode={feedbackMode}
                  inputType={inputType}
                  onAnswer={handleAnswer}
                  sourceLabel={module.sourceLabel}
                />
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((i) => i - 1)}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-40 dark:border-slate-600"
                  >
                    → שאלה קודמת
                  </button>
                  <span className="font-mono text-sm text-slate-500">
                    {currentIndex + 1} / {filteredQuestions.length}
                  </span>
                  <button
                    type="button"
                    disabled={currentIndex >= filteredQuestions.length - 1}
                    onClick={() => setCurrentIndex((i) => i + 1)}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-40 dark:border-slate-600"
                  >
                    שאלה הבאה ←
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((q, i) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    index={i}
                    answers={answers}
                    revealed={revealed}
                    feedbackMode={feedbackMode}
                    inputType={inputType}
                    onAnswer={handleAnswer}
                    sourceLabel={module.sourceLabel}
                    compact
                  />
                ))}
              </div>
            )}
          </>
        )}

        {mainTab === 'manage' && (
          <section className="grid gap-6 lg:grid-cols-2">
            <form
              onSubmit={handleSaveQuestion}
              className="space-y-4 rounded-2xl border border-slate-200/80 bg-white/90 p-6 dark:border-slate-700/80 dark:bg-slate-900/70"
            >
              <h2 className="text-lg font-bold">
                {form.id ? `עריכת שאלה #${form.id}` : 'הוספת שאלה חדשה'}
              </h2>
              <div>
                <label className="mb-1 block text-sm font-medium">קטגוריה</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                >
                  {CATEGORY_META.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">נוסח השאלה</label>
                <textarea
                  value={form.question}
                  onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                />
              </div>
              {[0, 1, 2, 3].map((i) => (
                <div key={i}>
                  <label className="mb-1 block text-sm font-medium">
                    אפשרות {OPTION_LABELS[i]}
                  </label>
                  <input
                    value={form[`option${i}`]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [`option${i}`]: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                  />
                </div>
              ))}
              <div>
                <label className="mb-1 block text-sm font-medium">אינדקס תשובה נכונה (0-3)</label>
                <select
                  value={form.correctIndex}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, correctIndex: Number(e.target.value) }))
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                >
                  {[0, 1, 2, 3].map((i) => (
                    <option key={i} value={i}>
                      {OPTION_LABELS[i]} (אינדקס {i})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{module.sourceLabel}</label>
                <input
                  value={form.poh}
                  onChange={(e) => setForm((f) => ({ ...f, poh: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-xl bg-sky-500 px-5 py-2 text-sm font-bold text-white hover:bg-sky-600"
                >
                  {form.id ? 'עדכן שאלה' : 'הוסף שאלה'}
                </button>
                {form.id && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm dark:border-slate-600"
                  >
                    ביטול עריכה
                  </button>
                )}
              </div>
            </form>

            <div className="max-h-[70vh] space-y-2 overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/90 p-4 scrollbar-thin dark:border-slate-700/80 dark:bg-slate-900/70">
              <h2 className="mb-3 text-lg font-bold">כל השאלות ({questions.length})</h2>
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                      #{q.id} · {q.category}
                    </p>
                    <p className="truncate text-sm">{q.question}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => handleEditQuestion(q)}
                      className="rounded-lg bg-sky-500/15 px-2 py-1 text-xs font-semibold text-sky-600 dark:text-sky-400"
                    >
                      ערוך
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="rounded-lg bg-red-500/15 px-2 py-1 text-xs font-semibold text-red-600 dark:text-red-400"
                    >
                      מחק
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <AppFooter subtitle={`${module.title} · Cessna 152`} />
    </div>
  );
}
