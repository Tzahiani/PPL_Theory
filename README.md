# PPL Theory Hub — Cessna 152

אפליקציית תרגול תאוריה לרישיון PPL על מטוס Cessna 152.  
כוללת מבחני **ספר סגור** (POH) ו**ספר פתוח**, עם שמירת התקדמות מקומית ומערכת סטטיסטיקות נסתרת למנהל.

**פותח ע״י:** יצחק אנידג׳אר  
**מאגר שאלות:** יצחק סבח

---

## תוכן עניינים

- [קישורים](#קישורים)
- [יכולות](#יכולות)
- [דרישות](#דרישות)
- [התקנה והרצה מקומית](#התקנה-והרצה-מקומית)
- [משתני סביבה](#משתני-סביבה)
- [הגדרת סטטיסטיקות (Supabase)](#הגדרת-סטטיסטיקות-supabase)
- [גישה ללוח המנהל](#גישה-ללוח-המנהל)
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
- ערבוב שאלות, איפוס תשובות, סטטיסטיקות בזמן אמת
- **ניהול שאלות** — הוספה, עריכה ומחיקה (נשמר ב-LocalStorage)
- מצב כהה / בהיר

### זיהוי משתמש

- כניסה לאפליקציה **דורשת הזנת שם** (מינימום 2 תווים)
- אין אפשרות להמשיך באופן אנונימי
- השם נשמר ב-LocalStorage לכניסות הבאות

### סטטיסטיקות (מנהל בלבד)

מערכת איסוף נתונים מרוחקת (Supabase) שעוקבת אחרי:

- כניסות לאפליקציה ומשך סשן
- פתיחת נושאים
- תשובות (נכון/שגוי + קטגוריה)
- הגשות מבחן וציונים
- **מי נכנס** — טבלת משתמשים לפי שם
- קטגוריות חלשות, פעילות יומית, אירועים אחרונים

> לוח הסטטיסטיקות **לא מוצג** למשתמשים רגילים — רק למנהל עם סיסמה.

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
cp .env.example .env   # ערוך לפי הצורך
npm run dev
```

האפליקציה תיפתח ב-[http://localhost:5173](http://localhost:5173).

### בנייה לפרודקשן

```bash
npm run build
npm run preview
```

---

## משתני סביבה

צור קובץ `.env` בשורש הפרויקט (ראה `.env.example`):

| משתנה | חובה | תיאור |
|--------|------|--------|
| `VITE_SUPABASE_URL` | לסטטיסטיקות | כתובת הפרויקט ב-Supabase |
| `VITE_SUPABASE_ANON_KEY` | לסטטיסטיקות | מפתח anon public מ-Supabase |
| `VITE_ADMIN_PATH` | לא | נתיב hash סודי ללוח מנהל (ברירת מחדל: `ppl-ya-stats`) |

> בלי Supabase האפליקציה עובדת כרגיל — רק הסטטיסטיקות לא יופעלו.

---

## הגדרת סטטיסטיקות (Supabase)

### 1. צור פרויקט

1. היכנס ל-[supabase.com](https://supabase.com) וצור פרויקט חינמי
2. העתק מ-**Settings → API**:
   - Project URL → `VITE_SUPABASE_URL`
   - anon public key → `VITE_SUPABASE_ANON_KEY`

### 2. הרץ את סכמת ה-DB

1. פתח **SQL Editor** ב-Supabase
2. הדבק את התוכן של [`supabase/setup.sql`](supabase/setup.sql)
3. **חשוב:** החלף `CHANGE_ME_ADMIN_KEY` בסיסמת מנהל חזקה לפני ההרצה
4. הרץ את הסקריפט

### 3. הגדר Secrets ל-GitHub Pages

ב-GitHub: **Settings → Secrets and variables → Actions**, הוסף:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_PATH` (אופציונלי)

### אבטחה

- משתמשים יכולים **לשלוח** אירועים בלבד (INSERT)
- **קריאת** הסטטיסטיקות דורשת סיסמת מנהל — נבדקת בצד השרver דרך פונקציית `get_admin_stats`
- אין קישור גלוי ללוח המנהל באפליקציה

---

## גישה ללוח המנהל

| דרך | פרטים |
|-----|--------|
| **URL סודי** | `https://tzahiani.github.io/PPL_Theory/#/ppl-ya-stats` |
| **קיצור נסתר** | לחיצה **5 פעמים** על מספר הגרסה בפוטר |

לאחר הכניסה — הזן את **סיסמת המנהל** שהגדרת ב-`setup.sql` (`CHANGE_ME_ADMIN_KEY`).

### מה מוצג בלוח

- מבקרים ייחודיים, כניסות (היום / 7 ימים)
- טבלת **מי נכנס** — שם, כניסות, תשובות, דיוק, מבחנים
- סטטיסטיקות לפי נושא (ספר סגור / פתוח)
- קטגוריות עם הכי הרבה טעויות
- פעילות יומית (30 יום)
- לוג אירועים אחרונים

---

## פריסה ל-GitHub Pages

הפריסה אוטומטית בכל push ל-`main` דרך GitHub Actions (`.github/workflows/deploy.yml`).

### הגדרה חד-פעמית

1. **Settings → Pages → Build and deployment → Source:** GitHub Actions
2. הוסף את ה-Secrets (ראה למעלה)
3. Push ל-`main` — האתר יעלה אוטומטית

> ה-`base path` מוגדר ל-`/PPL_Theory/` ב-[`vite.config.js`](vite.config.js).

---

## מבנה הפרויקט

```
PPL_Theory/
├── src/
│   ├── App.jsx                 # ניתוב ראשי, שער שם, analytics
│   ├── ExamSimulator.jsx       # סימולטור מבחן + ניהול שאלות
│   ├── pages/
│   │   ├── HomePage.jsx        # עמוד בית — בחירת נושא
│   │   └── AdminStatsPage.jsx  # לוח סטטיסטיקות (מנהל)
│   ├── components/
│   │   ├── AppFooter.jsx
│   │   └── VisitorNameModal.jsx
│   ├── analytics/
│   │   ├── track.js            # שליחת אירועים + RPC מנהל
│   │   └── visitor.js          # זיהוי משתמש + שם
│   ├── config/
│   │   └── theoryModules.js    # הגדרת מודולים
│   └── data/
│       ├── defaultQuestions.js # שאלות ספר סגור
│       └── openBookQuestions.js# שאלות ספר פתוח
├── supabase/
│   └── setup.sql               # סכמת DB + פונקציית מנהל
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
- **Supabase** — אחסון סטטיסטיקות
- **GitHub Pages** — אירוח
- **LocalStorage** — שמירת התקדמות ושאלות מותאמות

---

## רישיון

פרויקט פרטי. כל הזכויות על מאגר השאלות שייכות ליצחק סבח.
