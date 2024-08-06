import { BackupInfo } from '../../../../../backups/BackupInfo';
import { BackupListItem } from './BackupItem';

interface BackupsListProps {
  backups: Array<BackupInfo>;
  selected: BackupInfo | null;
  setSelected: (backup: BackupInfo) => void;
}

export function BackupsList({
  backups,
  selected,
  setSelected,
}: BackupsListProps) {
  return (
    <ul>
      {backups.map((backup, index) => (
        <li
          onClick={(e) => {
            e.stopPropagation();
            setSelected(backup);
          }}
          role="row"
          onKeyDown={() => setSelected(backup)}
          tabIndex={0}
          key={backup.folderId}
          className={`flex w-full items-center overflow-hidden p-2 transition-colors duration-75 ${
            selected?.folderId === backup.folderId
              ? 'bg-primary text-white'
              : index % 2 !== 0
              ? 'text-neutral-700 bg-white'
              : 'bg-l-neutral-10 text-neutral-700'
          }`}
        >
          <BackupListItem
            backup={backup}
            selected={selected?.folderId === backup.folderId}
          />
        </li>
      ))}
    </ul>
  );
}
