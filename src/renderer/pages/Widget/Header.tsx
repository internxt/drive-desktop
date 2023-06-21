import { Menu, Transition } from '@headlessui/react';
import { UilFolderOpen, UilGlobe, UilSetting } from '@iconscout/react-unicons';
import bytes from 'bytes';
import { ReactNode, useEffect, useRef, useState } from 'react';

import { User } from '../../../main/types';
import { useTranslationContext } from '../../context/LocalContext';
import useBackupFatalErrors from '../../hooks/BackupFatalErrors';
import useGeneralIssues from '../../hooks/GeneralIssues';
import useProcessIssues from '../../hooks/ProcessIssues';
import useUsage from '../../hooks/Usage';

export default function Header() {
  const { translate } = useTranslationContext();
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
      <Menu.Items className="absolute right-0 top-5  max-w-[288px] origin-top-right  whitespace-nowrap rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
        <Menu.Item>
          {({ active }) => (
            <div
              role="button"
              tabIndex={0}
              aria-hidden="true"
              onClick={() => window.electron.openSettingsWindow()}
            >
              <DropdownItem active={active}>
                <span>{translate('widget.header.dropdown.preferences')}</span>
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
                <span>{translate('widget.header.dropdown.send-feedback')}</span>
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
                <span>{translate('widget.header.dropdown.support')}</span>
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
                <span>{translate('widget.header.dropdown.logout')}</span>
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
              className="border-t border-t-l-neutral-30"
            >
              <DropdownItem active={active}>
                <span>{translate('widget.header.dropdown.quit')}</span>
              </DropdownItem>
            </div>
          )}
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
        className="rounded-lg outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-blue-60"
      >
        <HeaderItemWrapper>
          <UilGlobe className="h-5 w-5" />
        </HeaderItemWrapper>
      </a>
      <div
        role="button"
        onClick={window.electron.openSyncFolder}
        onKeyPress={window.electron.openSyncFolder}
        tabIndex={0}
        className="rounded-lg outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-blue-60"
      >
        <HeaderItemWrapper>
          <UilFolderOpen className="h-5 w-5" />
        </HeaderItemWrapper>
      </div>
      <Menu as="div" className="relative flex h-8 items-center ">
        <Menu.Button className="rounded-lg outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-offset-blue-60">
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
  const { translate } = useTranslationContext();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    window.electron.getUser().then(setUser);
  }, []);

  const rawUsage = useUsage();

  const usageIsAvailable = rawUsage !== 'loading' && rawUsage !== 'error';

  let usageDisplayElement: JSX.Element;

  if (rawUsage === 'loading') {
    usageDisplayElement = (
      <p className="text-xs text-neutral-500/80">Loading...</p>
    );
  } else if (rawUsage === 'error') {
    usageDisplayElement = <p />;
  } else {
    usageDisplayElement = (
      <p className="text-xs text-neutral-500">{`${bytes.format(
        rawUsage.usageInBytes
      )} ${translate('widget.header.usage.of')} ${
        rawUsage.isInfinite ? '∞' : bytes.format(rawUsage.limitInBytes)
      }`}</p>
    );
  }

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
            className="ml-1 rounded-sm text-xs text-blue-60 outline-none hover:text-blue-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-offset-blue-60 active:text-blue-80"
          >
            {translate('widget.header.usage.upgrade')}
          </a>
        )}
      </div>
    </div>
  );
}

function DropdownItem({
  children,
  active,
  onClick,
}: {
  children: JSX.Element;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={`cursor-pointer px-4 py-1.5 text-sm text-neutral-500 hover:bg-l-neutral-20 active:bg-l-neutral-30 ${
        active && 'bg-l-neutral-20'
      }`}
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
    <div className="relative cursor-pointer rounded-lg p-1.5 hover:bg-l-neutral-30 active:bg-l-neutral-40">
      {children}
    </div>
  );
}
