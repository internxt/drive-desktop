import { useEffect, useState } from 'react';

import { User } from '../../../../main/types';
import Spinner from '../../../assets/spinner.svg';
import useUsage from '../../../hooks/useUsage';
import Usage from './Usage';
import UserInfo from './UserInfo';

export default function AccountSection({ active }: { active: boolean }) {
  const [user, setUser] = useState<User | null>(null);
  const { usage, refreshUsage } = useUsage();

  useEffect(() => {
    window.electron.getUser().then(setUser);
  }, []);

  useEffect(() => {
    if (active) refreshUsage();
  }, [active]);

  return (
    <div className={active ? 'block' : 'hidden'}>
      {user !== null && (
        <UserInfo name={`${user.name} ${user.lastname}`} email={user.email} />
      )}
      <div className="mt-8">
        <div
          className="flex h-full w-full items-center justify-center rounded-lg bg-l-neutral-20 p-6"
          style={{ height: '136px' }}
        >
          {usage === 'loading' ? (
            <Spinner className="h-8 w-8 animate-spin fill-neutral-500" />
          ) : usage === 'error' ? (
            <p className="text-sm text-red-60">
              We could not fetch your usage details
            </p>
          ) : (
            <Usage {...usage} />
          )}
        </div>
      </div>
    </div>
  );
}
