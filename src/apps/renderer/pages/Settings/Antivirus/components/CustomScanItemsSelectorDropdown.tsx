import { Menu, Transition } from '@headlessui/react';
import { ScanType } from '../../../../hooks/antivirus/useAntivirus';
import Button from '../../../../components/Button';
import { DropdownItem } from './DropdownItem';

interface CustomScanItemsSelectorDropdownProps {
  disabled: boolean;
  translate: (key: string) => string;
  onScanItemsButtonClicked: (scanType: ScanType) => void;
}

export const CustomScanItemsSelectorDropdown = ({
  disabled,
  translate,
  onScanItemsButtonClicked,
}: CustomScanItemsSelectorDropdownProps) => {
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
