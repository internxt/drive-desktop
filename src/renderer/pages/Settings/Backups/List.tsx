import { Fragment, ReactNode, useEffect, useState } from 'react';
import { UilPlus, UilMinus } from '@iconscout/react-unicons';
import { Dialog, Transition } from '@headlessui/react';
import FolderIcon from '../../../assets/folder.svg';
import Button from '../../../components/Button';
import { Backup } from '../../../../main/device/service';
import Spinner from '../../../assets/spinner.svg';
import Checkbox from '../../../components/Checkbox';

export default function BackupsList({
  onGoToPanel,
}: {
  onGoToPanel: () => void;
}) {
  const [state, setState] = useState<
    { status: 'LOADING' | 'ERROR' } | { status: 'SUCCESS'; backups: Backup[] }
  >({ status: 'LOADING' });

  const [selected, setSelected] = useState<Backup | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  async function handleOnCloseDeleteModal(
    result: 'CANCEL' | 'DELETE' | 'DISABLE'
  ) {
    setShowDeleteModal(false);
    if (result === 'CANCEL') return;

    setState({ status: 'LOADING' });
    try {
      if (result === 'DISABLE')
        await window.electron.disableBackup(selected as Backup);
      else await window.electron.deleteBackup(selected as Backup);
      fetchBackups();
    } catch (err) {
      console.log(err);
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
              setSelected(folder);
            }}
            role="row"
            onKeyDown={() => setSelected(folder)}
            tabIndex={0}
            key={folder.id}
            className={`flex w-full items-center overflow-hidden p-2 transition-colors duration-75 ${
              selected?.id === folder.id
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
          <Button
            className="ml-1"
            disabled={selected === null}
            onClick={() => setShowDeleteModal(true)}
          >
            <UilMinus size="17" />
          </Button>
        </div>
        <Button onClick={onGoToPanel}>Done</Button>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={handleOnCloseDeleteModal}
        nameOfBackup={selected?.name}
      />
    </>
  );
}

function Modal({
  nameOfBackup,
  isOpen,
  onClose,
}: {
  nameOfBackup?: string;
  isOpen: boolean;
  onClose: (result: 'CANCEL' | 'DISABLE' | 'DELETE') => void;
}) {
  const [checkbox, setCheckbox] = useState(false);
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-10 overflow-y-auto"
        onClose={() => onClose('CANCEL')}
      >
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-black/30" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div
              style={{ width: '340px' }}
              className="my-8 inline-block transform overflow-hidden rounded-2xl bg-white p-4 text-left align-middle shadow-xl transition-all"
            >
              <Dialog.Title
                as="h3"
                className="text-center text-lg font-medium leading-6 text-neutral-700"
              >
                Stop backing up &quot;{nameOfBackup}&quot;?
              </Dialog.Title>
              <div className="mt-2">
                <p className="text-center text-sm text-neutral-500/80">
                  This folder will remain in your device.
                </p>
              </div>
              <Checkbox
                label="Also delete this folder from the cloud"
                className="mx-auto mt-6"
                value={checkbox}
                onClick={() => setCheckbox(!checkbox)}
              />

              <div className="mt-6 flex items-center justify-between">
                <Button className="w-full" onClick={() => onClose('CANCEL')}>
                  Cancel
                </Button>
                <Button
                  className="ml-2 w-full"
                  variant="primary"
                  onClick={() => onClose(checkbox ? 'DELETE' : 'DISABLE')}
                >
                  Stop backup
                </Button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
