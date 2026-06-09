import { User } from '../../../main/types';
import { UsageIndicator } from '../../components/UsageIndicator';
import { Avatar } from './Avatar';
import { ItemsSection } from './items-section';

type HeadersProps = {
  user: User;
  setIsLogoutModalOpen: (isOpen: boolean) => void;
};

const Header: React.FC<HeadersProps> = ({ user, setIsLogoutModalOpen }) => {
  const AccountSection = () => {
    return (
      <div className="flex flex-1 space-x-2.5 truncate" data-automation-id="headerAccountSection">
        <Avatar user={user} className="h-9 w-9 text-base" />

        <div className="flex flex-1 flex-col truncate">
          <p data-automation-id="header-userEmail" className="truncate text-sm font-medium text-gray-100" title={user?.email}>
            {user?.email}
          </p>
          {user && <UsageIndicator />}
        </div>
      </div>
    );
  };
  return (
    <div className="flex h-14 shrink-0 items-center justify-between space-x-6 rounded-t border-b border-b-gray-10 bg-gray-1 px-2.5 dark:bg-gray-5">
      <AccountSection />
      <ItemsSection setIsLogoutModalOpen={setIsLogoutModalOpen} />
    </div>
  );
};

export default Header;
