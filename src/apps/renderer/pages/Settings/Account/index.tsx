import { useEffect, useState } from 'react';
import { User } from '../../../../main/types';
import Spinner from '../../../assets/spinner.svg';
import Usage from './Usage';
import UserInfo from './UserInfo';
import Button from '../../../components/Button';
import { useTranslationContext } from '../../../context/LocalContext';
import { useGetUsage } from '../../../api/use-get-usage';

export default function AccountSection({ active }: { active: boolean }) {
  const { translate } = useTranslationContext();
  const [user, setUser] = useState<User | null>(null);
  const { data: usage, status, refetch: refreshUsage } = useGetUsage();

  useEffect(() => {
    window.electron
      .getUser()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (active) void refreshUsage();
  }, [active]);

  return (
    <div className={`flex flex-col space-y-8 ${active ? 'block' : 'hidden'}`}>
      {user !== null && <UserInfo user={user} />}

      <div className="flex items-center justify-center rounded-lg border border-gray-10 bg-surface p-4 shadow-sm dark:bg-gray-5">
        {status === 'loading' ? (
          <Spinner className="my-[57px] h-5 w-5 animate-spin" />
        ) : status === 'error' ? (
          <div className="my-4 flex flex-col items-center space-y-2.5">
            <p className="font-medium">{translate('settings.account.usage.loadError.title')}</p>

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
