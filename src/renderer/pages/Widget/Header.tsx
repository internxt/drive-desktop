import { useEffect, useRef, useState } from 'react';
import { FolderSimple, Gear, Globe } from '@phosphor-icons/react';
import { Menu, Transition } from '@headlessui/react';
import bytes from 'bytes';

import { User } from '../../../main/types';
import { useTranslationContext } from '../../context/LocalContext';
import useBackupFatalErrors from '../../hooks/BackupFatalErrors';
import useGeneralIssues from '../../hooks/GeneralIssues';
import useProcessIssues from '../../hooks/ProcessIssues';
import useUsage from '../../hooks/useUsage';
import useVirtualDriveStatus from '../../hooks/VirtualDriveStatus';
import { reportError } from '../../utils/errors';

export default function Header() {
  const { translate } = useTranslationContext();
  const { status: virtualDriveStatus } = useVirtualDriveStatus();
  const processIssues = useProcessIssues();
  const generalIssues = useGeneralIssues();
  const backupFatalErrors = useBackupFatalErrors();

  const numberOfIssues: number =
    processIssues.length + backupFatalErrors.length + generalIssues.length;

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

  const handleOpenDriveWeb = async () => {
    try {
      await window.electron.openUrl('https://drive.internxt.com');
    } catch (error) {
      reportError(error);
    }
  };

  const AccountSection = () => {
    const { translate } = useTranslationContext();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
      window.electron.getUser().then(setUser);
    }, []);

    const { usage, status } = useUsage();

    let displayUsage: string;

    if (status === 'loading') {
      displayUsage = 'Loading...';
    } else if (status === 'error') {
      displayUsage = '';
    } else if (usage) {
      displayUsage = `${bytes.format(usage.usageInBytes)} ${translate(
        'widget.header.usage.of'
      )} ${usage.isInfinite ? '∞' : bytes.format(usage.limitInBytes)}`;
    } else {
      displayUsage = '';
    }

    return (
      <div className="flex flex-1 space-x-2.5 truncate">
        <div className="relative z-0 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-lg font-semibold uppercase text-primary before:absolute before:inset-0 before:-z-1 before:rounded-full before:bg-primary/20 dark:text-white dark:before:bg-primary/75">
          {user?.name === 'My' && user?.lastname === 'Internxt'
            ? user?.email.charAt(0)
            : `${user?.name.charAt(0) ?? ''}${user?.lastname.charAt(0) ?? ''}`}
        </div>

        <div className="flex flex-1 flex-col truncate">
          <p
            className="truncate text-sm font-medium text-gray-100"
            title={user?.email}
          >
            {user?.email}
          </p>
          <p className="text-xs text-gray-50">{displayUsage}</p>
        </div>
      </div>
    );
  };

  const HeaderItemWrapper = ({
    children,
    active = false,
  }: {
    children: JSX.Element;
    active?: boolean;
  }) => {
    return (
      <div
        className={`relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg hover:bg-surface hover:shadow hover:ring-1 hover:ring-gray-20 dark:hover:bg-gray-10 ${
          active
            ? 'bg-surface shadow ring-1 ring-gray-20 dark:bg-gray-10'
            : undefined
        }`}
      >
        {children}
      </div>
    );
  };

  const DropdownItem = ({
    children,
    active,
    onClick,
  }: {
    children: JSX.Element;
    active?: boolean;
    onClick?: () => void;
  }) => {
    return (
      <button
        className={`w-full cursor-pointer px-4 py-1.5 text-left text-sm text-gray-80 active:bg-gray-10 ${
          active && 'bg-gray-1 dark:bg-gray-5'
        }`}
        tabIndex={0}
        onKeyDown={onClick}
        onClick={onClick}
      >
        {children}
      </button>
    );
  };

  const ItemsSection = () => (
    <div className="flex shrink-0 items-center text-gray-80">
      {process.env.platform === 'darwin' && (
        <div className="h-0 w-0" tabIndex={0} ref={dummyRef} />
      )}
      <a onClick={handleOpenDriveWeb}>
        <HeaderItemWrapper>
          <Globe size={22} />
        </HeaderItemWrapper>
      </a>

      <div
        onClick={window.electron.openSyncFolder}
        className={
          virtualDriveStatus !== 'MOUNTED'
            ? 'pointer-events-none text-gray-40'
            : undefined
        }
      >
        <HeaderItemWrapper>
          <FolderSimple size={22} />
        </HeaderItemWrapper>
      </div>

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
              className="relative z-10"
            >
              <Menu.Items className="absolute right-0 top-1 max-w-[288px] origin-top-right whitespace-nowrap rounded-md bg-surface py-1 shadow-xl ring-1 ring-gray-20 focus:outline-none dark:bg-gray-1">
                <Menu.Item>
                  {({ active }) => (
                    <div
                      role="button"
                      tabIndex={0}
                      aria-hidden="true"
                      onClick={() => window.electron.openSettingsWindow()}
                    >
                      <DropdownItem active={active}>
                        <span>
                          {translate('widget.header.dropdown.preferences')}
                        </span>
                      </DropdownItem>
                    </div>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <div
                      role="button"
                      tabIndex={0}
                      aria-hidden="true"
                      onClick={() => window.electron.openFeedbackWindow()}
                    >
                      <DropdownItem active={active}>
                        <span>
                          {translate('widget.header.dropdown.send-feedback')}
                        </span>
                      </DropdownItem>
                    </div>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <div
                      role="button"
                      tabIndex={0}
                      aria-hidden="true"
                      onClick={window.electron.openProcessIssuesWindow}
                    >
                      <DropdownItem active={active}>
                        <div className="flex items-baseline justify-between">
                          <p>{translate('widget.header.dropdown.issues')}</p>
                          {numberOfIssues > 0 && (
                            <p className="ml-4 text-xs font-semibold text-red-60">
                              {numberOfIssuesDisplay}
                            </p>
                          )}
                        </div>
                      </DropdownItem>
                    </div>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <a
                      className="block w-full"
                      href="https://help.internxt.com"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <DropdownItem active={active}>
                        <span>
                          {translate('widget.header.dropdown.support')}
                        </span>
                      </DropdownItem>
                    </a>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <div
                      role="button"
                      tabIndex={0}
                      aria-hidden="true"
                      onClick={window.electron.logout}
                    >
                      <DropdownItem active={active}>
                        <span>
                          {translate('widget.header.dropdown.logout')}
                        </span>
                      </DropdownItem>
                    </div>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <div
                      role="button"
                      tabIndex={0}
                      aria-hidden="true"
                      onClick={window.electron.quit}
                      className="border-t border-t-gray-10"
                    >
                      <DropdownItem active={active}>
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
}
