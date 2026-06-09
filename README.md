# PPL Theory Hub — Cessna 152

אפליקציית תרגול תאוריה לרישיון PPL על מטוס Cessna 152.  
כוללת מבחני **ספר סגור** (POH) ו**ספר פתוח**, עם שמירת התקדמות מקומית.

**פותח ע״י:** יצחק אנידג׳אר  
**מאגר שאלות:** יצחק סבח

---

## תוכן עניינים

- [קישורים](#קישורים)
- [יכולות](#יכולות)
- [דרישות](#דרישות)
- [התקנה והרצה מקומית](#התקנה-והרצה-מקומית)
- [פריסה ל-GitHub Pages](#פריסה-ל-github-pages)
- [מבנה הפרויקט](#מבנה-הפרויקט)
- [סקריפטים](#סקריפטים)

---

## קישורים

| | |
|---|---|
| **אתר חי** | [https://tzahiani.github.io/PPL_Theory/](https://tzahiani.github.io/PPL_Theory/) |
| **Repository** | [github.com/Tzahiani/PPL_Theory](https://github.com/Tzahiani/PPL_Theory) |

---

## יכולות

### מודולי תרגול

| מודול | תיאור |
|-------|--------|
| **ספר סגור** | מבחן תאוריה ללא חומר עזר — שינון POH, מגבלות, נהלים, חירום ועוד |
| **ספר פתוח** | תרגול עם חומר עזר — ביצועים, W&B, אווירודינמיקה, ניווט, מטאורולogia, תקנות |

### סימולטור מבחן

- תצוגת שאלה בודדת או רשימה מלאה
- משוב מיידי או משוב רק לאחר הגשת מבחן
- בחירת תשובה ב-radio או ב-select
- סינון לפי קטגוריה, שגויות ולא נענו
- ערבוב שאלות, איפוס תשובות, מעקב התקדמות בזמן אמת
- **ניהול שאלות** — הוספה, עריכה ומחיקה (נשמר ב-LocalStorage)
- מצב כהה / בהיר

### כניסה לאפליקציה

- כניסה **דורשת הזנת שם** (מינימום 2 תווים)
- השם נשמר ב-LocalStorage לכניסות הבאות

---

## דרישות

- [Node.js](https://nodejs.org/) 20+
- npm

---

## התקנה והרצה מקומית

```bash
git clone https://github.com/Tzahiani/PPL_Theory.git
cd PPL_Theory
npm install
npm run dev
```

האפליקציה תיפתח ב-[http://localhost:5173](http://localhost:5173).

### בנייה לפרודקשן

```bash
npm run build
npm run preview
```

---

## פריסה ל-GitHub Pages

הפריסה אוטומטית בכל push ל-`main` דרך GitHub Actions (`.github/workflows/deploy.yml`).

### הגדרה חד-פעמית

1. **Settings → Pages → Build and deployment → Source:** GitHub Actions
2. Push ל-`main` — האתר יעלה אוטומטית

> ה-`base path` מוגדר ל-`/PPL_Theory/` ב-[`vite.config.js`](vite.config.js).

---

## מבנה הפרויקט

```
PPL_Theory/
├── src/
│   ├── App.jsx                 # ניתוב ראשי + שער כניסה
│   ├── ExamSimulator.jsx       # סימולטור מבחן + ניהול שאלות
│   ├── pages/
│   │   └── HomePage.jsx        # עמוד בית — בחירת נושא
│   ├── components/
│   │   ├── AppFooter.jsx
│   │   └── VisitorNameModal.jsx
│   ├── config/
│   │   └── theoryModules.js    # הגדרת מודולים
│   └── data/
│       ├── defaultQuestions.js # שאלות ספר סגור
│       └── openBookQuestions.js# שאלות ספר פתוח
├── scripts/
│   └── generate_open_book.py   # המרת JSON לקובץ שאלות
└── .github/workflows/
    └── deploy.yml              # CI/CD → GitHub Pages
```

---

## סקריפטים

| פקודה | תיאור |
|--------|--------|
| `npm run dev` | שרת פיתוח |
| `npm run build` | בנייה לפרודקשן |
| `npm run preview` | תצוגה מקדימה של הבנייה |

---

## טכנולוגיות

- **React 18** + **Vite 6**
- **Tailwind CSS 3**
- **GitHub Pages** — אירוח
- **LocalStorage** — שמירת התקדמות ושאלות מותאמות

---

## רישיון

פרויקט פרטי. כל הזכויות על מאגר השאלות שייכות ליצחק סבח.
