import { useI18n } from '@/apps/renderer/localize/use-i18n';
import { User } from '../../../../main/types';
import Button from '../../../components/Button';
import { Avatar } from '../../Widget/Avatar';

export function UserInfo({ user }: { user: User }) {
  const { translate } = useI18n();

  return (
    <div className="flex items-center space-x-4 truncate">
      <Avatar user={user} className="h-12 w-12 text-lg" />

      <div className="flex flex-1 flex-col truncate">
        <p className="truncate text-lg font-medium leading-6 text-gray-100">{`${user.name} ${user.lastname}`}</p>
        <p className="truncate text-sm leading-4 text-gray-60">{user.email}</p>
      </div>

      <Button variant="secondary" onClick={globalThis.window.electron.logout}>
        {translate('settings.account.logout')}
      </Button>
    </div>
  );
}
