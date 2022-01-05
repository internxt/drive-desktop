import { useEffect } from 'react';
import {
  MemoryRouter as Router,
  Routes,
  Route,
  useLocation,
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

export default function App() {
  return (
    <Router>
      <LocationWrapper>
        <Routes>
          <Route path="/" element={<Login />} />
        </Routes>
      </LocationWrapper>
    </Router>
  );
}
