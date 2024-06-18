import { useEffect, useState } from 'react';
import { User } from '../../../../main/types';
import Spinner from '../../../assets/spinner.svg';
import useUsage from '../../../hooks/useUsage';
import Usage from './Usage';
import UserInfo from './UserInfo';
import Button from '../../../components/Button';
import { useTranslationContext } from '../../../context/LocalContext';

export default function AccountSection({ active }: { active: boolean }) {
  const { translate } = useTranslationContext();
  const [user, setUser] = useState<User | null>(null);
  const { usage, status, refreshUsage } = useUsage();

  useEffect(() => {
    window.electron.getUser().then(setUser);
  }, []);

  useEffect(() => {
    if (active) refreshUsage();
  }, [active]);

  return (
    <div
      className={`flex w-full flex-col space-y-8 ${
        active ? 'block' : 'hidden'
      }`}
    >
      {user !== null && <UserInfo user={user} />}

      <div className="flex items-center justify-center rounded-lg border border-gray-10 bg-surface p-4 shadow-sm dark:bg-gray-5">
        {status === 'loading' ? (
          <Spinner className="my-[57px] h-5 w-5 animate-spin" />
        ) : status === 'error' ? (
          <div className="my-4 flex flex-col items-center space-y-2.5">
            <p className="font-medium">
              {translate('settings.account.usage.loadError.title')}
            </p>

            <Button variant="secondary" onClick={() => refreshUsage()}>
              {translate('settings.account.usage.loadError.action')}
            </Button>
          </div>
        ) : (
          usage && <Usage {...usage} />
        )}
      </div>
    </div>
  );
}
