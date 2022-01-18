import { UilGlobe, UilFolderOpen, UilSetting } from '@iconscout/react-unicons';
import { Menu, Transition } from '@headlessui/react';
import { ReactNode, useEffect, useState } from 'react';
import bytes from 'bytes';

import { User } from '../../../main/types';
import { getUsage, Usage } from '../../utils/usage';

export default function Header() {
  const [numberOfSyncIssues, setNumberOfSyncIssues] = useState(0);

  useEffect(() => {
    const callback = (issues: any[]) => setNumberOfSyncIssues(issues.length);
    window.electron.getSyncIssues().then(callback);
    const removeListener = window.electron.onSyncIssuesChanged(callback);
    return removeListener;
  }, []);

  const dropdown = (
    <Transition
      enter="transition duration-100 ease-out"
      enterFrom="transform scale-95 opacity-0"
      enterTo="transform scale-100 opacity-100"
      leave="transition duration-75 ease-out"
      leaveFrom="transform scale-100 opacity-100"
      leaveTo="transform scale-95 opacity-0"
    >
      <Menu.Items className="absolute py-1 right-0 w-32 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
        <Menu.Item>
          <DropdownItem>
            <span>Preferences</span>
          </DropdownItem>
        </Menu.Item>
        <Menu.Item>
          <DropdownItem>
            <div className="flex items-baseline">
              <p>Sync issues</p>
              {numberOfSyncIssues > 0 && (
                <p className="ml-4 text-red-60 text-xs font-semibold">
                  {numberOfSyncIssues}
                </p>
              )}
            </div>
          </DropdownItem>
        </Menu.Item>
        <Menu.Item>
          <DropdownItem>
            <a
              className="block w-full"
              href="https://help.internxt.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Support
            </a>
          </DropdownItem>
        </Menu.Item>
        <Menu.Item>
          <DropdownItem onClick={window.electron.logout}>
            <span>Log out</span>
          </DropdownItem>
        </Menu.Item>
        <Menu.Item>
          <DropdownItem
            className="border-t border-t-l-neutral-20"
            onClick={window.electron.quit}
          >
            <span>Quit</span>
          </DropdownItem>
        </Menu.Item>
      </Menu.Items>
    </Transition>
  );

  const itemsSection = (
    <div className="flex items-center text-m-neutral-100">
      <a
        href="https://drive.internxt.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        <HeaderItemWrapper>
          <UilGlobe className="h-5 w-5" />
        </HeaderItemWrapper>
      </a>
      <HeaderItemWrapper>
        <UilFolderOpen
          onClick={window.electron.openSyncFolder}
          className="h-5 w-5"
        />
      </HeaderItemWrapper>
      <Menu as="div" className="relative h-7">
        <Menu.Button>
          <SettingsIcon hasIssues={numberOfSyncIssues > 0} />
        </Menu.Button>
        {dropdown}
      </Menu>
    </div>
  );

  return (
    <div className="flex justify-between items-center p-3">
      <AccountSection />
      {itemsSection}
    </div>
  );
}

function AccountSection() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    window.electron.getUser().then(setUser);
  }, []);

  const [rawUsage, setRawUsage] = useState<Usage | 'loading' | 'error'>(
    'loading'
  );

  async function updateUsage() {
    setRawUsage('loading');
    try {
      const usage = await getUsage();
      setRawUsage(usage);
    } catch (err) {
      console.error(err);
      setRawUsage('error');
    }
  }

  useEffect(() => {
    updateUsage();
  }, []);

  const usageIsAvailable = rawUsage !== 'loading' && rawUsage !== 'error';

  let usageDisplayElement: JSX.Element;

  if (rawUsage === 'loading')
    usageDisplayElement = (
      <p className="text-xs text-neutral-500/80">Loading...</p>
    );
  else if (rawUsage === 'error') usageDisplayElement = <p />;
  else
    usageDisplayElement = (
      <p className="text-xs text-neutral-500">{`${bytes.format(
        rawUsage.usageInBytes
      )} of ${bytes.format(rawUsage.limitInBytes)}`}</p>
    );

  return (
    <div className="select-none">
      <p className="text-xs font-semibold text-neutral-700">{user?.email}</p>
      <div className="flex">
        {usageDisplayElement}
        {usageIsAvailable && rawUsage.offerUpgrade && (
          <a
            href="https://drive.internxt.com/storage"
            target="_blank"
            rel="noreferrer noopener"
            className="ml-1 text-xs text-blue-60"
          >
            Upgrade
          </a>
        )}
      </div>
    </div>
  );
}

function DropdownItem({
  children,
  className,
  onClick,
}: {
  children: JSX.Element;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={`cursor-pointer text-sm text-neutral-500 hover:bg-l-neutral-20 active:bg-l-neutral-30 ${className}`}
      style={{ padding: '6px 12px' }}
      role="button"
      tabIndex={0}
      onKeyDown={onClick}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

function SettingsIcon({ hasIssues = false }: { hasIssues?: boolean }) {
  return (
    <HeaderItemWrapper>
      <UilSetting className="h-5 w-5" />
      {hasIssues && (
        <div className="bg-red-60 rounded-full h-2 w-2 absolute top-1 right-1" />
      )}
    </HeaderItemWrapper>
  );
}

function HeaderItemWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="p-1 cursor-pointer hover:bg-l-neutral-30 active:bg-l-neutral-40 rounded-lg relative">
      {children}
    </div>
  );
}
