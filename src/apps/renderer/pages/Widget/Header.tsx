import { MouseEventHandler, useEffect, useState } from 'react';
import { FolderSimple, Gear, Globe } from '@phosphor-icons/react';
import { Menu, Transition } from '@headlessui/react';
import { User } from '../../../main/types';
import { SHOW_ANTIVIRUS_TOOL } from '../Settings';
import { useIssues } from '../../hooks/useIssues';
import { UsageIndicator } from '../../components/UsageIndicator';
import { useI18n } from '../../localize/use-i18n';

interface HeadersProps {
  setIsLogoutModalOpen: (isOpen: boolean) => void;
}

const Header: React.FC<HeadersProps> = ({ setIsLogoutModalOpen }) => {
  const { translate } = useI18n();

  const { issues } = useIssues();

  const numberOfIssues = issues.length;

  const numberOfIssuesDisplay = numberOfIssues > 99 ? '99+' : numberOfIssues;

  function onQuitClick() {
    window.electron.quit();
  }

  function onSyncClick() {
    void window.electron.syncManually();
  }

  const handleOpenURL = async (URL: string) => {
    try {
      await window.electron.openUrl(URL);
    } catch (error) {
      window.electron.logger.error({
        msg: 'Error opening URL',
        error,
      });
    }
  };

  const handleLogoutModalOpen = () => {
    setIsLogoutModalOpen(true);
  };

  const AccountSection = () => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
      window.electron
        .getUser()
        .then(setUser)
        .catch(() => {
          setUser(null);
        });
    }, []);

    return (
      <div className="flex flex-1 space-x-2.5 truncate" data-automation-id="headerAccountSection">
        <div className="relative z-0 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface text-base font-semibold uppercase text-primary before:absolute before:inset-0 before:-z-1 before:rounded-full before:bg-primary/20 dark:text-white dark:before:bg-primary/75">
          {`${user?.name.charAt(0) ?? ''}${user?.lastname.charAt(0) ?? ''}`}
        </div>

        <div className="flex flex-1 flex-col truncate">
          <p className="truncate text-sm font-medium text-gray-100" title={user?.email}>
            {user?.email}
          </p>
          {user && <UsageIndicator />}
        </div>
      </div>
    );
  };

  const HeaderItemWrapper = ({
    children,
    active = false,
    onClick,
    disabled,
  }: {
    children: JSX.Element;
    active?: boolean;
    onClick?: MouseEventHandler<HTMLDivElement>;
    disabled?: boolean;
  }) => {
    return (
      <div
        className={`relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg before:absolute before:-inset-px hover:bg-surface hover:shadow hover:ring-1 hover:ring-gray-20 dark:hover:bg-gray-10 ${
          active ? 'bg-surface shadow ring-1 ring-gray-20 dark:bg-gray-10' : undefined
        } ${disabled ? 'pointer-events-none text-gray-40' : undefined}`}
        onClick={onClick}>
        {children}
      </div>
    );
  };

  const DropdownItem = ({ children, active, onClick }: { children: JSX.Element; active?: boolean; onClick?: () => void }) => {
    return (
      <button
        className={`w-full cursor-pointer px-4 py-1.5 text-left text-sm text-gray-80 active:bg-gray-10 ${
          active && 'bg-gray-1 dark:bg-gray-5'
        }`}
        tabIndex={0}
        onKeyDown={onClick}
        onClick={onClick}>
        {children}
      </button>
    );
  };

  const ItemsSection = () => (
    <div className="flex shrink-0 items-center space-x-0.5 text-gray-80">
      <HeaderItemWrapper onClick={() => handleOpenURL('https://drive.internxt.com')}>
        <Globe size={22} />
      </HeaderItemWrapper>

      <HeaderItemWrapper onClick={window.electron.openVirtualDriveFolder} data-automation-id="openVirtualDriveFolder">
        <FolderSimple size={22} />
      </HeaderItemWrapper>

      <Menu as="div" className="relative flex h-8 items-end">
        {({ open }) => (
          <>
            <Menu.Button className="outline-none focus-visible:outline-none">
              <HeaderItemWrapper active={open}>
                <Gear size={22} />
              </HeaderItemWrapper>
            </Menu.Button>

            <Transition
              enter="transition duration-100 ease-out"
              enterFrom="transform scale-95 opacity-0"
              enterTo="transform scale-100 opacity-100"
              leave="transition duration-75 ease-out"
              leaveFrom="transform scale-100 opacity-100"
              leaveTo="transform scale-95 opacity-0"
              className="relative z-10">
              <Menu.Items className="absolute right-0 top-1 w-screen max-w-[270px] origin-top-right whitespace-nowrap rounded-md bg-surface py-1 shadow-xl ring-1 ring-gray-20 focus:outline-none dark:bg-gray-1">
                <Menu.Item>
                  {({ active }) => (
                    <div>
                      <DropdownItem active={active} onClick={() => window.electron.openSettingsWindow()}>
                        <span>{translate('widget.header.dropdown.preferences')}</span>
                      </DropdownItem>
                    </div>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => {
                    return (
                      <div>
                        <DropdownItem active={active} onClick={onSyncClick} data-automation-id="menuItemSync">
                          <span>{translate('widget.header.dropdown.sync')}</span>
                        </DropdownItem>
                      </div>
                    );
                  }}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <div>
                      <DropdownItem active={active} onClick={window.electron.openProcessIssuesWindow} data-automation-id="menuItemIssues">
                        <div className="flex items-center justify-between">
                          <p>{translate('widget.header.dropdown.issues')}</p>
                          {numberOfIssues > 0 && <p className="text-sm font-medium text-red">{numberOfIssuesDisplay}</p>}
                        </div>
                      </DropdownItem>
                    </div>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <div>
                      <DropdownItem
                        active={active}
                        onClick={() => handleOpenURL('https://help.internxt.com')}
                        data-automation-id="menuItemSupport">
                        <span>{translate('widget.header.dropdown.support')}</span>
                      </DropdownItem>
                    </div>
                  )}
                </Menu.Item>
                {SHOW_ANTIVIRUS_TOOL && (
                  <Menu.Item>
                    {({ active }) => (
                      <div>
                        <DropdownItem
                          active={active}
                          onClick={() => window.electron.openSettingsWindow('ANTIVIRUS')}
                          data-automation-id="menuItemAntivirus">
                          <span>{translate('widget.header.dropdown.antivirus')}</span>
                        </DropdownItem>
                      </div>
                    )}
                  </Menu.Item>
                )}
                <Menu.Item>
                  {({ active }) => (
                    <div>
                      <DropdownItem
                        active={active}
                        onClick={() => window.electron.openSettingsWindow('CLEANER')}
                        data-automation-id="menuItemCleaner">
                        <div className="flex flex-row items-center justify-between">
                          <span>{translate('widget.header.dropdown.cleaner')}</span>
                          <div className="flex rounded-full border border-primary bg-primary/5 px-2 py-1 text-primary">
                            {translate('widget.header.dropdown.new')}
                          </div>
                        </div>
                      </DropdownItem>
                    </div>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <div>
                      <DropdownItem active={active} onClick={handleLogoutModalOpen} data-automation-id="menuItemLogout">
                        <span>{translate('widget.header.dropdown.logout')}</span>
                      </DropdownItem>
                    </div>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <div className="border-t border-t-gray-10">
                      <DropdownItem active={active} onClick={onQuitClick} data-automation-id="menuItemQuit">
                        <span>{translate('widget.header.dropdown.quit')}</span>
                      </DropdownItem>
                    </div>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </>
        )}
      </Menu>
    </div>
  );

  return (
    <div className="flex h-14 shrink-0 items-center justify-between space-x-6 border-b border-b-gray-10 bg-gray-1 px-2.5 dark:bg-gray-5">
      <AccountSection />
      <ItemsSection />
    </div>
  );
};

export default Header;
