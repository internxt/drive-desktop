import { UilMinus } from '@iconscout/react-unicons';
import { useState } from 'react';
import Button from '../../../../components/Button';
import { useTranslationContext } from '../../../../context/LocalContext';
import FolderIcon from '../../../../assets/folder.svg';

import { useAntivirus } from '../../../../hooks/antivirus/useAntivirus';
import { SelectedItemToScanProps } from '../../../../../main/antivirus/Antivirus';

interface BackupFolderSelectorProps {
  onClose: () => void;
}

export default function ItemsToScanSelector({
  onClose,
}: BackupFolderSelectorProps) {
  const { translate } = useTranslationContext();
  const { selectedItems, onRemoveItemFromList } = useAntivirus();
  const [selectedItem, setSelectedItem] =
    useState<SelectedItemToScanProps | null>(null);

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex">
        <h1 className="text-lg font-normal">Selected Items</h1>
        <div className="ml-auto text-gray-50">
          {selectedItems.length > 0 &&
            translate('settings.backups.selected-folder', {
              count: selectedItems.length,
            })}{' '}
        </div>
      </div>
      <div
        className="border-l-neutral-30  h-44 overflow-y-auto rounded-lg border border-gray-20 bg-white dark:bg-black"
        onClick={() => setSelectedItem(null)}
        role="none"
      >
        <ul>
          {selectedItems.map((itemToScan, index) => (
            <li
              role="row"
              aria-rowindex={index + 1}
              key={itemToScan.id}
              onClick={(e: React.MouseEvent<HTMLLIElement>) => {
                e.stopPropagation();
                setSelectedItem(itemToScan);
              }}
              onKeyDown={() => setSelectedItem(itemToScan)}
              tabIndex={0}
              className={`flex w-full items-center overflow-hidden p-2 transition-colors duration-75 ${
                selectedItem?.id === itemToScan.id
                  ? 'bg-primary text-white'
                  : index % 2 !== 0
                  ? 'text-neutral-700 bg-white  dark:bg-black'
                  : 'bg-l-neutral-10 text-neutral-700  dark:bg-black'
              }`}
            >
              <div className="flex w-full justify-between">
                <span className="flex-grow">
                  <FolderIcon className="inline h-4 w-4 flex-shrink-0" />
                  <p
                    className="relative ml-1 inline select-none truncate leading-none"
                    style={{ top: '1px' }}
                  >
                    {itemToScan.itemName}
                  </p>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className=" flex items-center justify-between">
        <div className="flex">
          <Button
            className="ml-1"
            disabled={selectedItem === null}
            onClick={() =>
              onRemoveItemFromList(selectedItem as SelectedItemToScanProps)
            }
            variant="secondary"
          >
            <UilMinus size="17" />
          </Button>
        </div>
        <span className="flex gap-2">
          <Button onClick={onClose} variant="secondary">
            {translate('settings.backups.folders.cancel')}
          </Button>
          <Button onClick={onClose}>
            {translate('settings.backups.folders.save')}
          </Button>
        </span>
      </div>
    </div>
  );
}
