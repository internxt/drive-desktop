import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { WidgetSkeleton } from '../WidgetSkeleton';

interface AuthGuardProps {
  children: JSX.Element;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const intendedRoute = useRef<null | string>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showContent, setShowContent] = useState(pathname !== '/');

  function onUserLoggedInChanged(isLoggedIn: boolean) {
    setIsAuthLoading(false);
    if (!isLoggedIn) {
      intendedRoute.current = pathname;
      navigate('/login');
    } else if (intendedRoute.current) {
      navigate(intendedRoute.current);
      intendedRoute.current = null;
    }

    // Add delay only for the main widget route
    if (pathname === '/') {
      setTimeout(() => setShowContent(true), 1000);
    } else {
      setShowContent(true);
    }
  }

  useEffect(() => {
    window.electron.onUserLoggedInChanged(onUserLoggedInChanged);
    window.electron.isUserLoggedIn().then(onUserLoggedInChanged);
  }, []);

  if (isAuthLoading) {
    return pathname === '/' ? <WidgetSkeleton /> : <></>;
  }

  if (!showContent && pathname === '/') {
    return <WidgetSkeleton />;
  }

  return children;
}
