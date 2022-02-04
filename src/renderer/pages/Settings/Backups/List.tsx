import { ReactNode, useEffect, useState } from 'react';
import { UilPlus, UilMinus } from '@iconscout/react-unicons';
import FolderIcon from '../../../assets/folder.svg';
import Button from '../../../components/Button';
import { Backup } from '../../../../main/device/service';
import Spinner from '../../../assets/spinner.svg';

export default function BackupsList({
  onGoToPanel,
}: {
  onGoToPanel: () => void;
}) {
  const [state, setState] = useState<
    { status: 'LOADING' | 'ERROR' } | { status: 'SUCCESS'; backups: Backup[] }
  >({ status: 'LOADING' });

  const [selected, setSelected] = useState<number | null>(null);

  useEffect(fetchBackups, []);

  function fetchBackups() {
    setState({ status: 'LOADING' });
    window.electron
      .getBackups()
      .then((backups) => {
        setState({ status: 'SUCCESS', backups });
        setSelected(null);
      })
      .catch(() => {
        setState({ status: 'ERROR' });
      });
  }

  async function handleAddBackup() {
    setState({ status: 'LOADING' });
    try {
      await window.electron.addBackup();
      fetchBackups();
    } catch {
      setState({ status: 'ERROR' });
    }
  }

  let content: ReactNode;

  if (state.status === 'SUCCESS' && state.backups.length) {
    content = (
      <>
        {state.backups.map((folder, i) => (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setSelected(folder.id);
            }}
            role="row"
            onKeyDown={() => setSelected(folder.id)}
            tabIndex={0}
            key={folder.id}
            className={`flex w-full items-center overflow-hidden p-2 transition-colors duration-75 ${
              selected === folder.id
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
              {folder.name}
            </p>
          </div>
        ))}
      </>
    );
  } else {
    content = (
      <div className="flex h-full items-center justify-center">
        {state.status === 'LOADING' ? (
          <Spinner className="h-6 w-6 animate-spin fill-l-neutral-50" />
        ) : state.status === 'ERROR' ? (
          <p className="text-sm text-red-50">We could not load your backups</p>
        ) : (
          <p className="text-sm text-l-neutral-50">No backups yet</p>
        )}
      </div>
    );
  }

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
        {content}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex">
          <Button onClick={handleAddBackup}>
            <UilPlus size="17" />
          </Button>
          <Button className="ml-1" disabled={selected === null}>
            <UilMinus size="17" />
          </Button>
        </div>
        <Button onClick={onGoToPanel}>Done</Button>
      </div>
    </>
  );
}
