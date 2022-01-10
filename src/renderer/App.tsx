import { useEffect } from 'react';
import {
  MemoryRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import Login from './pages/Login';

import './App.css';

function LocationWrapper({ children }: { children: JSX.Element }) {
  const { pathname } = useLocation();

  useEffect(() => {
    window.electron.pathChanged(pathname);
  }, [pathname]);

  return children;
}

function LoggedInWrapper({ children }: { children: JSX.Element }) {
  const navigate = useNavigate();

  function onUserLoggedInChanged(value: boolean) {
    if (!value) navigate('/login');
    else navigate('/');
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
            <Route
              path="/"
              element={
                <div>
                  <button type="button" onClick={window.electron.logout}>
                    Logout
                  </button>
                </div>
              }
            />
          </Routes>
        </LoggedInWrapper>
      </LocationWrapper>
    </Router>
  );
}
