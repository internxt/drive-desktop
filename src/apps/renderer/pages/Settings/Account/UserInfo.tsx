import { User } from '../../../../main/types';
import Button from '../../../components/Button';
import { useTranslationContext } from '../../../context/LocalContext';

export default function UserInfo({ user }: { user: User }) {
  const { translate } = useTranslationContext();

  const Avatar = () => {
    return (
      <div className="relative z-0 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface text-xl font-semibold uppercase text-primary before:absolute before:inset-0 before:-z-1 before:rounded-full before:bg-primary/20 dark:text-white dark:before:bg-primary/75">
        {`${user?.name.charAt(0) ?? ''}${user?.lastname.charAt(0) ?? ''}`}
      </div>
    );
  };

  return (
    <div className="flex items-center space-x-4 truncate">
      <Avatar />

      <div className="flex flex-1 flex-col truncate">
        <p className="truncate text-lg font-medium leading-6 text-gray-100">{`${user.name} ${user.lastname}`}</p>
        <p className="truncate text-sm leading-4 text-gray-60">{user.email}</p>
      </div>

      <Button variant="secondary" onClick={window.electron.logout}>
        {translate('settings.account.logout')}
      </Button>
    </div>
  );
}
