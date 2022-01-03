import { useEffect } from 'react';
import {
  MemoryRouter as Router,
  Routes,
  Route,
  useLocation,
  Link,
} from 'react-router-dom';
import './App.css';

const Hello = () => {
  return (
    <div>
      <Link to="/another">Hey</Link>
    </div>
  );
};

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
          <Route path="/" element={<Hello />} />
          <Route path="/another" element={<Hello />} />
        </Routes>
      </LocationWrapper>
    </Router>
  );
}
