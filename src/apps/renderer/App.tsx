import './App.css';

import { Suspense } from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';

import { Login } from './pages/Login';
import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';
import Widget from './pages/Widget';
import IssuesPage from './pages/Issues';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './core/tanstack-query/query-client';
import { AuthGuard } from './components/AuthGuard';
import { useI18nSetup } from './features/config/use-i18n-setup';
import { useThemeSetup } from './features/config/use-theme-setup';

export default function App() {
  useI18nSetup();
  useThemeSetup();

  return (
    <Router>
      <Suspense fallback={<></>}>
        <QueryClientProvider client={queryClient}>
          <AuthGuard>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/process-issues" element={<IssuesPage />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/" element={<Widget />} />
            </Routes>
          </AuthGuard>
        </QueryClientProvider>
      </Suspense>
    </Router>
  );
}
