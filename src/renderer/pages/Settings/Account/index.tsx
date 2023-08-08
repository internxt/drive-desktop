import { useEffect, useState } from 'react';

import { User } from '../../../../main/types';
import Spinner from '../../../assets/spinner.svg';
import useUsage from '../../../hooks/useUsage';
import Usage from './Usage';
import UserInfo from './UserInfo';

export default function AccountSection({ active }: { active: boolean }) {
  const [user, setUser] = useState<User | null>(null);
  const { usage, status, refreshUsage } = useUsage();

  useEffect(() => {
    window.electron.getUser().then(setUser);
  }, []);

  useEffect(() => {
    if (active) refreshUsage();
  }, [active]);

  return (
    <div className={`flex flex-col space-y-6 ${active ? 'block' : 'hidden'}`}>
      {user !== null && <UserInfo user={user} />}

      <div
        className="flex items-center justify-center rounded-lg bg-l-neutral-20 p-6"
        style={{ height: '136px' }}
      >
        {status === 'loading' ? (
          <Spinner className="h-8 w-8 animate-spin fill-neutral-500" />
        ) : status === 'error' ? (
          <p className="text-sm text-red-60">
            We could not fetch your usage details
          </p>
        ) : (
          usage && <Usage {...usage} />
        )}
      </div>
    </div>
  );
}
