import { UilArrowDown, UilArrowUp, UilTrash, UilPen } from '@iconscout/react-unicons';

import FileIcon from '../assets/file.svg';

export type Operation = 'download' | 'upload' | 'delete' | 'rename';

export default function FileWithOperation({
  operation,
  width,
  className = '',
}: {
  operation?: Operation;
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
      <FileIcon />
      {operation && (
        <AuxIcon
          size={width * 0.65}
          className="absolute right-0 top-1/2 text-primary"
        />
      )}
    </div>
  );
}
