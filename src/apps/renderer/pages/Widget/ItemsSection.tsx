import { FolderSimple, Gear, Globe } from '@phosphor-icons/react';
import { Menu, Transition } from '@headlessui/react';

import { useTranslationContext } from '../../context/LocalContext';
import { useSyncContext } from '../../context/SyncContext';
import { DropdownItem } from './DropdownItem';
import { HeaderItemWrapper } from './HeaderItemWrapper';

type Props = {
  readonly numberOfIssues: number;
  readonly numberOfIssuesDisplay: number | string;
  onQuitClick: () => void;
  onOpenURL: (url: string) => void;
};

export function ItemsSection({ numberOfIssues, numberOfIssuesDisplay, onQuitClick, onOpenURL }: Props) {
  const { translate } = useTranslationContext();
  const { syncStatus } = useSyncContext();
  const isSyncing = syncStatus === 'RUNNING';

  const handleManualSync = () => {
    if (isSyncing) return;
    window.electron.startRemoteSync().catch((error) => {
      window.electron.logger.error({
        msg: '[RENDERER] Failed to start manual sync from widget menu',
        error,
      });
    });
  };

  return (
    <div className="flex shrink-0 items-center space-x-0.5 text-gray-80">
      <HeaderItemWrapper onClick={() => onOpenURL('https://drive.internxt.com')}>
        <Globe size={22} />
      </HeaderItemWrapper>
      <HeaderItemWrapper
        onClick={() => window.electron.openVirtualDriveFolder()}
        data-automation-id="openVirtualDriveFolder">
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
              <Menu.Items className="absolute right-0 top-1 max-w-[288px] origin-top-right whitespace-nowrap rounded-md bg-surface py-1 shadow-xl ring-1 ring-gray-20 focus:outline-none dark:bg-gray-1">
                <Menu.Item>
                  {({ active }) => (
                    <div>
                      <DropdownItem active={active} onClick={() => window.electron.openSettingsWindow()}>
                        <span>{translate('widget.header.dropdown.preferences')}</span>
                      </DropdownItem>
                    </div>
                  )}
                </Menu.Item>
                <Menu.Item disabled={isSyncing}>
                  {({ active }) => (
                    <div>
                      <DropdownItem active={active} onClick={handleManualSync} disabled={isSyncing}>
                        <span>{translate('widget.header.dropdown.sync')}</span>
                      </DropdownItem>
                    </div>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <div>
                      <DropdownItem
                        active={active}
                        onClick={window.electron.openProcessIssuesWindow}
                        data-automation-id="menuItemIssues">
                        <div className="flex items-center justify-between">
                          <p>{translate('widget.header.dropdown.issues')}</p>
                          {numberOfIssues > 0 && (
                            <p className="text-sm font-medium text-red">{numberOfIssuesDisplay}</p>
                          )}
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
                        onClick={() => onOpenURL('https://help.internxt.com')}
                        data-automation-id="menuItemSupport">
                        <span>{translate('widget.header.dropdown.support')}</span>
                      </DropdownItem>
                    </div>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <div>
                      <DropdownItem
                        active={active}
                        onClick={() => window.electron.openSettingsWindow('CLEANER')}
                        data-automation-id="menuItemCleaner">
                        <div className="flex flex-row items-center justify-end gap-4">
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
                      <DropdownItem
                        active={active}
                        onClick={window.electron.logout}
                        data-automation-id="menuItemLogout">
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
}
