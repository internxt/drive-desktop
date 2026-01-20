import { useEffect, useState } from 'react';
import { WidgetSkeleton } from '../WidgetSkeleton';
import { Login } from '../../pages/Login';
import { DraggableModal } from './draggable-modal';
import { AUTH, Dimensions } from './get-dimensions';
import { LoggedPage } from './logged-page';

function onMouseDown(e: React.MouseEvent<HTMLDivElement>) {
  if (e.target === e.currentTarget) {
    void globalThis.window.electron.hideFrontend();
  }
}

export function AuthGuard() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [workArea, setWorkArea] = useState<Dimensions | undefined>(undefined);

  useEffect(() => {
    globalThis.window.electron.onUserLoggedInChanged(setIsLoggedIn);
    void globalThis.window.electron.isUserLoggedIn().then(setIsLoggedIn);
    void globalThis.window.electron.getWorkArea().then((wa) => setWorkArea(wa));
  }, []);

  function renderContent() {
    if (isLoggedIn === null) {
      return <WidgetSkeleton />;
    }

    if (isLoggedIn === false) {
      return (
        <DraggableModal workArea={workArea} dimensions={AUTH}>
          <Login />
        </DraggableModal>
      );
    }

    return <LoggedPage workArea={workArea} />;
  }

  return (
    <div className="relative h-screen w-screen bg-transparent" onMouseDown={onMouseDown}>
      {renderContent()}
    </div>
  );
}
