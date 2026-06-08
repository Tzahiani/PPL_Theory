import { useEffect, useState } from 'react';
import ExamSimulator from './ExamSimulator';
import { isAdminRoute, trackAppVisit, trackModuleOpen, trackSessionEnd } from './analytics/track';
import { getOrCreateVisitorId } from './analytics/visitor';
import { getModuleById } from './config/theoryModules';
import VisitorNameModal from './components/VisitorNameModal';
import AdminStatsPage from './pages/AdminStatsPage';
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
  const [showAdmin, setShowAdmin] = useState(isAdminRoute);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    saveAppSettings({ darkMode });
  }, [darkMode]);

  useEffect(() => {
    getOrCreateVisitorId();
    trackAppVisit();

    const onHashChange = () => setShowAdmin(isAdminRoute());
    window.addEventListener('hashchange', onHashChange);

    const onUnload = () => trackSessionEnd();
    window.addEventListener('pagehide', onUnload);

    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('pagehide', onUnload);
    };
  }, []);

  const handleSelectModule = (moduleId) => {
    trackModuleOpen(moduleId);
    setActiveModuleId(moduleId);
  };

  if (showAdmin) {
    return <AdminStatsPage />;
  }

  const module = activeModuleId ? getModuleById(activeModuleId) : null;

  return (
    <>
      <VisitorNameModal />
      {!module ? (
        <HomePage
          onSelect={handleSelectModule}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
      ) : (
        <ExamSimulator
          module={module}
          onBack={() => setActiveModuleId(null)}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
      )}
    </>
  );
}
