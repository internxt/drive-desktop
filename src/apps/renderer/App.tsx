import './App.css';
import './localize/i18n.service';
import { Suspense, useEffect, useRef } from 'react';
import { HashRouter as Router, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { TranslationProvider } from './context/LocalContext';
import { SyncProvider } from './context/SyncContext';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import IssuesPage from './pages/Issues/IssuesPage';
import Settings from './pages/Settings';
import Widget from './pages/Widget';
import { useBackupNotifications } from './hooks/useBackupNotifications';
import { useMarketingNotifications } from './hooks/useMarketingNotifications';
import { useTheme } from './hooks/useTheme';
import i18next from 'i18next';
import { isLanguage } from '../shared/Locale/Language';
import { UsageProvider } from './context/UsageContext/usage-provider';
import { MaxFileSizeRejectionModal } from './pages/MaxFileSizeRejectionModal';

function LocationWrapper({ children }: { children: JSX.Element }) {
  const { pathname } = useLocation();
  useEffect(() => {
    window.electron.pathChanged(pathname);
  }, [pathname]);

  return children;
}

function LoggedInWrapper({ children }: { children: JSX.Element }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const intendedRoute = useRef<null | string>(null);
  const isStandaloneModal = pathname === '/max-file-size-rejection-modal';

  function onUserLoggedInChanged(isLoggedIn: boolean) {
    if (isStandaloneModal) {
      return;
    }

    if (!isLoggedIn) {
      intendedRoute.current = pathname;
      navigate('/login');
    } else if (intendedRoute.current) {
      navigate(intendedRoute.current);
      intendedRoute.current = null;
    }
  }
  useEffect(() => {
    window.electron.onUserLoggedInChanged(onUserLoggedInChanged);
    window.electron.isUserLoggedIn().then(onUserLoggedInChanged);
  }, [isStandaloneModal]);

  return children;
}

function Loader() {
  return <></>;
}

export default function App() {
  useBackupNotifications();
  useMarketingNotifications();
  useTheme();

  // Global IPC → i18next bridge for language changes
  useEffect(() => {
    window.electron.getConfigKey('preferedLanguage').then((value) => {
      const lang = value as string;
      if (lang && isLanguage(lang) && i18next.language !== lang) {
        i18next.changeLanguage(lang);
      }
    });

    const cleanup = window.electron.listenToConfigKeyChange<string>('preferedLanguage', (lang) => {
      if (isLanguage(lang)) {
        i18next.changeLanguage(lang);
      }
    });

    return cleanup;
  }, []);

  return (
    <Router>
      <Suspense fallback={<Loader />}>
        <TranslationProvider>
          <UsageProvider>
            <SyncProvider>
              <LocationWrapper>
                <LoggedInWrapper>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/process-issues" element={<IssuesPage />} />
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route path="/max-file-size-rejection-modal" element={<MaxFileSizeRejectionModal />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/" element={<Widget />} />
                  </Routes>
                </LoggedInWrapper>
              </LocationWrapper>
            </SyncProvider>
          </UsageProvider>
        </TranslationProvider>
      </Suspense>
    </Router>
  );
}
