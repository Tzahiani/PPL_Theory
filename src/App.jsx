import { useEffect, useState } from 'react';
import ExamSimulator from './ExamSimulator';
import {
  isAdminRoute,
  trackAppVisit,
  trackModuleOpen,
  trackSessionEnd,
} from './analytics/track';
import { getOrCreateVisitorId, hasVisitorName } from './analytics/visitor';
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
  const [appUnlocked, setAppUnlocked] = useState(hasVisitorName);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    saveAppSettings({ darkMode });
  }, [darkMode]);

  useEffect(() => {
    if (!appUnlocked) return;

    getOrCreateVisitorId();
    trackAppVisit();

    const onUnload = () => trackSessionEnd();
    window.addEventListener('pagehide', onUnload);
    return () => window.removeEventListener('pagehide', onUnload);
  }, [appUnlocked]);

  useEffect(() => {
    const onHashChange = () => setShowAdmin(isAdminRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleSelectModule = (moduleId) => {
    trackModuleOpen(moduleId);
    setActiveModuleId(moduleId);
  };

  const handleNameRegistered = () => {
    setAppUnlocked(true);
  };

  if (showAdmin) {
    return <AdminStatsPage />;
  }

  if (!appUnlocked) {
    return <VisitorNameModal onRegistered={handleNameRegistered} />;
  }

  const module = activeModuleId ? getModuleById(activeModuleId) : null;

  if (!module) {
    return (
      <HomePage
        onSelect={handleSelectModule}
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
