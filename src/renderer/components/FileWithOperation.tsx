import {
  UilArrowDown,
  UilArrowUp,
  UilTrash,
  UilPen,
} from '@iconscout/react-unicons';
import { ItemKind } from '../../shared/ItemKind';
import FileIcon from '../assets/file.svg';
import FolderIcon from '../assets/folder.svg';

export type Operation = 'download' | 'upload' | 'delete' | 'rename';

export default function FileWithOperation({
  operation,
  itemKind,
  width,
  className = '',
}: {
  operation?: Operation;
  itemKind: ItemKind;
  width: number;
  className?: string;
}) {
  const iconMap = {
    download: UilArrowDown,
    upload: UilArrowUp,
    delete: UilTrash,
    rename: UilPen,
  };

  const AuxIcon = operation ? iconMap[operation] : null;

  return (
    <div className={`relative ${className}`} style={{ width: `${width}px` }}>
      {itemKind === 'FILE' && <FileIcon />}
      {itemKind === 'FOLDER' && <FolderIcon />}
      {operation && (
        <AuxIcon
          size={width * 0.65}
          className="absolute right-0 top-1/2 text-blue-50"
        />
      )}
    </div>
  );
}
