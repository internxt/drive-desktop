import { ItemBackup } from '../../../../../shared/types/items';
import { BackupListItem } from './BackupItem';
import React, { useState } from 'react';

interface BackupsListProps {
  items: Array<ItemBackup>;
  selected: Array<ItemBackup>;
  setSelected: (backup: ItemBackup) => void;
  onDobleClick?: (backup: ItemBackup) => void;
}

export function BackupsList({
  items,
  selected,
  setSelected,
  onDobleClick,
}: BackupsListProps) {
  const handleClick = (
    e: React.MouseEvent<HTMLLIElement>,
    backup: ItemBackup
  ) => {
    e.stopPropagation();

    // Ignorar si Shift está presionado
    if (e.shiftKey) {
      return;
    }

    setSelected(backup);
  };

  return (
    <ul>
      {items.map((backup, index) => (
        <li
          role="row"
          aria-rowindex={index + 1}
          key={backup.id}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (onDobleClick) {
              onDobleClick(backup);
            }
          }}
          onClick={(e) => handleClick(e, backup)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setSelected(backup);
            }
          }}
          tabIndex={0}
          className={`flex w-full items-center overflow-hidden p-2 transition-colors duration-75 ${
            selected.find((item) => item.id === backup.id)
              ? 'bg-primary text-white'
              : index % 2 !== 0
              ? 'text-neutral-700 bg-white  dark:bg-black'
              : 'bg-l-neutral-10 text-neutral-700  dark:bg-black'
          }`}
        >
          <BackupListItem
            backup={backup}
            selected={
              selected.find((item) => item.id === backup.id) !== undefined
            }
          />
        </li>
      ))}
    </ul>
  );
}
