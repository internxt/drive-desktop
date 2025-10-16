import './App.css';
import './localize/i18n.service';

import { Suspense, useEffect } from 'react';
import { HashRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

import { TranslationProvider } from './context/LocalContext';
import useLanguageChangedListener from './hooks/useLanguage';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';
import Widget from './pages/Widget';
import IssuesPage from './pages/Issues';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './core/tanstack-query/query-client';
import { AuthGuard } from './components/AuthGuard';

function LocationWrapper({ children }: { children: JSX.Element }) {
  const { pathname } = useLocation();
  useEffect(() => {
    window.electron.pathChanged(pathname);
  }, [pathname]);

  return children;
}

export default function App() {
  useLanguageChangedListener();

  return (
    <Router>
      <Suspense fallback={<></>}>
        <TranslationProvider>
          <QueryClientProvider client={queryClient}>
            <LocationWrapper>
              <AuthGuard>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/process-issues" element={<IssuesPage />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/" element={<Widget />} />
                </Routes>
              </AuthGuard>
            </LocationWrapper>
          </QueryClientProvider>
        </TranslationProvider>
      </Suspense>
    </Router>
  );
}
