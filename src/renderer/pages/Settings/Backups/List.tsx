import { useState } from 'react';
import { UilPlus, UilMinus } from '@iconscout/react-unicons';
import FolderIcon from '../../../assets/folder.svg';
import Button from '../../../components/Button';

export default function BackupsList({
  onGoToPanel,
}: {
  onGoToPanel: () => void;
}) {
  const folders = ['Desktop', 'Documents', 'Downloads'];

  const [selected, setSelected] = useState<string | null>(null);

  return (
    <>
      <p className="text-sm text-neutral-500">
        Folders you want to add to the next backup
      </p>
      <div
        className="mt-4 h-44 overflow-y-auto rounded-lg border border-l-neutral-30 bg-white"
        onClick={() => setSelected(null)}
        role="none"
      >
        {folders.map((folder, i) => (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setSelected(folder);
            }}
            role="row"
            onKeyDown={() => setSelected(folder)}
            tabIndex={0}
            key={folder}
            className={`flex w-full items-center overflow-hidden p-2 transition-colors duration-75 ${
              selected === folder
                ? 'bg-blue-60 text-white'
                : i % 2 !== 0
                ? 'bg-white text-neutral-700'
                : 'bg-l-neutral-10 text-neutral-700'
            }`}
          >
            <FolderIcon className="h-4 w-4 flex-shrink-0" />
            <p
              className="relative ml-1 flex-grow select-none truncate leading-none"
              style={{ top: '1px' }}
            >
              {folder}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex">
          <Button>
            <UilPlus size="17" />
          </Button>
          <Button className="ml-1">
            <UilMinus size="17" />
          </Button>
        </div>
        <div className="flex">
          <Button onClick={onGoToPanel}>Cancel</Button>
          <Button disabled className="ml-1" variant="primary">
            Save
          </Button>
        </div>
      </div>
    </>
  );
}
