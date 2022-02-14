/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
import { UilGlobe, UilFolderOpen, UilSetting } from '@iconscout/react-unicons';
import { Menu, Transition } from '@headlessui/react';
import { ReactNode, useEffect, useRef, useState } from 'react';
import bytes from 'bytes';

import { User } from '../../../main/types';
import useProcessIssues from '../../hooks/ProcessIssues';
import useUsage from '../../hooks/Usage';
import useBackupFatalErrors from '../../hooks/BackupFatalErrors';

export default function Header() {
  const processIssues = useProcessIssues();
  const backupFatalErrors = useBackupFatalErrors();

  const numberOfIssues: number =
    processIssues.length + backupFatalErrors.length;

  const numberOfIssuesDisplay = numberOfIssues > 99 ? '99+' : numberOfIssues;

  /* Electron on MacOS kept focusing the first focusable
  element on start so we had to create a dummy element
  to get that focus, remove it and make itself 
  non-focusable */
  const dummyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (process.env.platform === 'darwin') {
      const listener = () => {
        dummyRef.current?.blur();
        dummyRef.current?.removeEventListener('focus', listener);
        dummyRef.current?.setAttribute('tabindex', '-1');
      };
      dummyRef.current?.addEventListener('focus', listener);
    }
  }, []);

  const dropdown = (
    <Transition
      enter="transition duration-100 ease-out"
      enterFrom="transform scale-95 opacity-0"
      enterTo="transform scale-100 opacity-100"
      leave="transition duration-75 ease-out"
      leaveFrom="transform scale-100 opacity-100"
      leaveTo="transform scale-95 opacity-0"
      className="relative z-10"
    >
      <Menu.Items className="absolute right-0 w-32 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
        <Menu.Item>
          <DropdownItem onClick={() => window.electron.openSettingsWindow()}>
            <span>Preferences</span>
          </DropdownItem>
        </Menu.Item>
        <Menu.Item>
          <DropdownItem onClick={window.electron.openProcessIssuesWindow}>
            <div className="flex items-baseline justify-between">
              <p>Issues</p>
              {numberOfIssues > 0 && (
                <p className="ml-4 text-xs font-semibold text-red-60">
                  {numberOfIssuesDisplay}
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
      {process.env.platform === 'darwin' && (
        <div className="h-0 w-0" tabIndex={0} ref={dummyRef} />
      )}
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
          tabIndex={0}
          onClick={window.electron.openSyncFolder}
          onKeyPress={window.electron.openSyncFolder}
          className="h-5 w-5"
        />
      </HeaderItemWrapper>
      <Menu as="div" className="relative h-7">
        <Menu.Button>
          <SettingsIcon />
        </Menu.Button>
        {dropdown}
      </Menu>
    </div>
  );

  return (
    <div className="flex items-center justify-between p-3">
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

  const rawUsage = useUsage();

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
      )} of ${
        rawUsage.isInfinite ? '∞' : bytes.format(rawUsage.limitInBytes)
      }`}</p>
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
            className="ml-1 text-xs text-blue-60 hover:text-blue-70 active:text-blue-80"
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
      style={{ padding: '6px 16px' }}
      role="button"
      tabIndex={0}
      onKeyDown={onClick}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

function SettingsIcon() {
  return (
    <HeaderItemWrapper>
      <UilSetting className="h-5 w-5" />
    </HeaderItemWrapper>
  );
}

function HeaderItemWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="relative cursor-pointer rounded-lg p-1 hover:bg-l-neutral-30 active:bg-l-neutral-40">
      {children}
    </div>
  );
}
