import { QueryClientProvider } from '@tanstack/react-query';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import { AuthGuard } from './components/AuthGuard';
import { queryClient } from './core/tanstack-query/query-client';
import { useI18nSetup } from './features/config/use-i18n-setup';
import { useThemeSetup } from './features/config/use-theme-setup';
import { MaxFileSizeRejectionModal } from './pages/MaxFileSizeRejectionModal';
import Onboarding from './pages/Onboarding';

export function App() {
  useI18nSetup();
  useThemeSetup();

  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/max-file-size-rejection-modal" element={<MaxFileSizeRejectionModal />} />
          <Route path="/" element={<AuthGuard />} />
        </Routes>
      </QueryClientProvider>
    </Router>
  );
}
