import Button from '../../../../components/Button';
import { Menu, Transition } from '@headlessui/react';
import { ScanType } from '../../../../hooks/antivirus/useAntivirus';
import { useI18n } from '@/apps/renderer/localize/use-i18n';
import { TranslationFn } from '@internxt/drive-desktop-core/build/frontend/core/i18n';

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

const CustomScanItemsSelectorDropdown = ({
  disabled,
  translate,
  onScanItemsButtonClicked,
}: {
  disabled: boolean;
  translate: TranslationFn;
  onScanItemsButtonClicked: (scanType: ScanType) => void;
}) => {
  return (
    <Menu as="div" className="relative flex h-8 items-end">
      <Menu.Button className="outline-none focus-visible:outline-none">
        <Button disabled={disabled}>{translate('settings.antivirus.scanOptions.customScan.action')}</Button>
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
                <DropdownItem active={active} onClick={() => onScanItemsButtonClicked('files')}>
                  <span>{translate('settings.antivirus.scanOptions.customScan.selector.files')}</span>
                </DropdownItem>
              </div>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <div>
                <DropdownItem active={active} onClick={() => onScanItemsButtonClicked('folders')}>
                  <span>{translate('settings.antivirus.scanOptions.customScan.selector.folders')}</span>
                </DropdownItem>
              </div>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

interface ChooseItemsStateProps {
  isUserElegible: boolean;
  onScanButtonClicked: (scanType: ScanType) => void;
  onScanUserSystemButtonClicked: () => void;
}

export const ChooseItemsState = ({ isUserElegible, onScanButtonClicked, onScanUserSystemButtonClicked }: ChooseItemsStateProps) => {
  const { translate } = useI18n();

  return (
    <div className="flex flex-col gap-4 p-10">
      <div className="flex w-full flex-row items-center justify-between rounded-lg border border-gray-10 bg-surface px-4 py-3">
        <p className="font-medium text-gray-80">{translate('settings.antivirus.scanOptions.systemScan.text')}</p>
        <Button onClick={onScanUserSystemButtonClicked} disabled={!isUserElegible}>
          {translate('settings.antivirus.scanOptions.systemScan.action')}
        </Button>
      </div>

      <div className="flex w-full flex-row items-center justify-between rounded-lg border border-gray-10 bg-surface px-4 py-3">
        <p className="font-medium text-gray-80">{translate('settings.antivirus.scanOptions.customScan.text')}</p>
        <CustomScanItemsSelectorDropdown translate={translate} disabled={!isUserElegible} onScanItemsButtonClicked={onScanButtonClicked} />
      </div>
    </div>
  );
};
