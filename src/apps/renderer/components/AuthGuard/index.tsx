import { useEffect, useState } from 'react';
import { Login } from '../../pages/Login';
import { DraggableModal } from './draggable-modal';
import { AUTH, Dimensions } from './get-dimensions';
import { LoggedPage } from './logged-page';
import { User } from '@/apps/main/types';

function onMouseDown(e: React.MouseEvent<HTMLDivElement>) {
  if (e.target === e.currentTarget) {
    void globalThis.window.electron.hideFrontend();
  }
}

export function AuthGuard() {
  const [user, setUser] = useState<User | null>(null);
  const [workArea, setWorkArea] = useState<Dimensions | undefined>(undefined);

  useEffect(() => {
    globalThis.window.electron.onUserLoggedInChanged(setUser);
    void globalThis.window.electron.isUserLoggedIn().then(setUser);
    void globalThis.window.electron.getWorkArea().then((wa) => setWorkArea(wa));
  }, []);

  function renderContent() {
    if (user === null) {
      return (
        <DraggableModal workArea={workArea} dimensions={AUTH}>
          <Login />
        </DraggableModal>
      );
    }

    return <LoggedPage user={user} workArea={workArea} />;
  }

  return (
    <div className="relative h-screen w-screen bg-transparent" onMouseDown={onMouseDown}>
      {renderContent()}
    </div>
  );
}
