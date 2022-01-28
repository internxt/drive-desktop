import { useEffect, useState } from 'react';
import { User } from '../../../../main/types';
import useUsage from '../../../hooks/Usage';
import UserInfo from './UserInfo';
import Spinner from '../../../assets/spinner.svg';
import Usage from './Usage';

export default function AccountSection({ active }: { active: boolean }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    window.electron.getUser().then(setUser);
  }, []);

  const rawUsage = useUsage();

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
          {rawUsage === 'loading' ? (
            <Spinner className="h-8 w-8 animate-spin fill-neutral-500" />
          ) : rawUsage === 'error' ? (
            <p className="text-sm text-red-60">
              We could not fetch your usage details
            </p>
          ) : (
            <Usage {...rawUsage} />
          )}
        </div>
      </div>
    </div>
  );
}
