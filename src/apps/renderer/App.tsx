import './App.css';

import { HashRouter as Router, Route, Routes } from 'react-router-dom';

import Onboarding from './pages/Onboarding';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './core/tanstack-query/query-client';
import { useI18nSetup } from './features/config/use-i18n-setup';
import { useThemeSetup } from './features/config/use-theme-setup';
import { AuthGuard } from './components/AuthGuard';

export function App() {
  useI18nSetup();
  useThemeSetup();

  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/" element={<AuthGuard />} />
        </Routes>
      </QueryClientProvider>
    </Router>
  );
}
