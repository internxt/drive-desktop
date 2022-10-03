import { useEffect, useRef } from 'react';
import {
  HashRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import Login from './pages/Login';
import Widget from './pages/Widget';
import ProcessIssues from './pages/ProcessIssues';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';

import './App.css';
import { DeviceProvider } from './context/DeviceContext';

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

export default function App() {
  return (
    <Router>
      <LocationWrapper>
        <LoggedInWrapper>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/process-issues" element={<ProcessIssues />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route
              path="/settings"
              element={
                <DeviceProvider>
                  <Settings />
                </DeviceProvider>
              }
            />
            <Route path="/" element={<Widget />} />
          </Routes>
        </LoggedInWrapper>
      </LocationWrapper>
    </Router>
  );
}
