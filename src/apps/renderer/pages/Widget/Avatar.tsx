import { User } from '@/apps/main/types';
import { useState } from 'react';

type Props = {
  user: User | null;
};

export function Avatar({ user }: Props) {
  const [imgError, setImgError] = useState(false);

  function renderContent() {
    if (!user) return '';

    if (user.avatar && !imgError) {
      return <img src={user.avatar} className="h-full w-full object-cover" onError={() => setImgError(true)} />;
    }

    return `${user.name.charAt(0)}${user.lastname.charAt(0)}`;
  }

  return (
    <div className="relative z-0 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface text-base font-semibold uppercase text-primary before:absolute before:inset-0 before:-z-1 before:rounded-full before:bg-primary/20 dark:text-white dark:before:bg-primary/75">
      {renderContent()}
    </div>
  );
}
