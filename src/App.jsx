import { useEffect, useState } from 'react';
import ExamSimulator from './ExamSimulator';
import { getModuleById } from './config/theoryModules';
import HomePage from './pages/HomePage';

const APP_SETTINGS_KEY = 'ppl_theory_app_settings';

function loadAppSettings() {
  try {
    const raw = localStorage.getItem(APP_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveAppSettings(settings) {
  try {
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

export default function App() {
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [darkMode, setDarkMode] = useState(() => loadAppSettings()?.darkMode ?? true);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    saveAppSettings({ darkMode });
  }, [darkMode]);

  const module = activeModuleId ? getModuleById(activeModuleId) : null;

  if (!module) {
    return (
      <HomePage
        onSelect={setActiveModuleId}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    );
  }

  return (
    <ExamSimulator
      module={module}
      onBack={() => setActiveModuleId(null)}
      darkMode={darkMode}
      setDarkMode={setDarkMode}
    />
  );
}
