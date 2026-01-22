import './App.css';
import './localize/i18n.service';
import { Suspense, useEffect, useRef } from 'react';
import { HashRouter as Router, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { TranslationProvider } from './context/LocalContext';
import useLanguageChangedListener from './hooks/useLanguage';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import IssuesPage from './pages/Issues/IssuesPage';
import Settings from './pages/Settings';
import Widget from './pages/Widget';
import { useBackupNotifications } from './hooks/useBackupNotifications';
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

  function onUserLoggedInChanged(isLoggedIn: boolean) {
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
  }, []);

  return children;
}

function Loader() {
  return <></>;
}

export default function App() {
  useLanguageChangedListener();
  useBackupNotifications();

  return (
    <Router>
      <Suspense fallback={<Loader />}>
        <TranslationProvider>
          <LocationWrapper>
            <LoggedInWrapper>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/process-issues" element={<IssuesPage />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/" element={<Widget />} />
              </Routes>
            </LoggedInWrapper>
          </LocationWrapper>
        </TranslationProvider>
      </Suspense>
    </Router>
  );
}
