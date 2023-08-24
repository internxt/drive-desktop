import { Dialog, Transition } from '@headlessui/react';
import { Minus, Plus } from '@phosphor-icons/react';
import { Fragment, ReactNode, useEffect, useState } from 'react';
import { useTranslationContext } from 'renderer/context/LocalContext';
import { useBackups } from '../../../hooks/useBackups';
import { BackupFatalError } from '../../../../main/background-processes/types/BackupFatalError';
import useBackupFatalErrors from '../../../hooks/BackupFatalErrors';

import { Backup } from '../../../../main/device/service';
import FolderIcon from '../../../assets/folder.svg';
import Spinner from '../../../assets/spinner.svg';
import Button from '../../../components/Button';
import Checkbox from '../../../components/Checkbox';

export interface BackupFolderListProps {
  onGoToPanel: () => void;
}

export default function BackupsFolderList({
  onGoToPanel,
}: BackupFolderListProps) {
  const { translate } = useTranslationContext();

  const { backups, addBackup, disableBackup, deleteBackup } = useBackups();

  const [selected, setSelected] = useState<Backup | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { deleteError } = useBackupFatalErrors();

  async function handleAddBackup() {
    await addBackup();
  }

  async function handleOnCloseDeleteModal(
    result: 'CANCEL' | 'DELETE' | 'DISABLE',
    dontAksAgain?: boolean
  ) {
    setShowDeleteModal(false);
    if (result === 'CANCEL') {
      return;
    }

    if (dontAksAgain) {
      localStorage.setItem('dont-ask-again-on-delete-backup', 'yes');
    }

    if (result === 'DISABLE') {
      await disableBackup(selected as Backup);
    } else {
      await deleteBackup(selected as Backup);
    }

    if (selected) {
      deleteError(selected.id);
    }
  }

  const del = () => {
    const dontAskAgainOnDeleteBackup = localStorage.getItem(
      'dont-ask-again-on-delete-backup'
    );
    if (dontAskAgainOnDeleteBackup === 'yes') {
      handleOnCloseDeleteModal('DISABLE');
    } else {
      setShowDeleteModal(true);
    }
  };

  let content: ReactNode;

  if (backups.status === 'SUCCESS' && backups.backups.length) {
    content = backups.backups.map((folder) => (
      <li
        onClick={(e) => {
          e.stopPropagation();
          setSelected(folder);
        }}
        key={folder.id}
        className={`flex h-8 w-full items-center space-x-2 truncate px-3 outline-none ${
          selected?.id === folder.id
            ? 'bg-primary text-white'
            : 'bg-surface even:bg-gray-5'
        }`}
        title={folder.name}
      >
        <FolderIcon className="h-5 w-5 flex-shrink-0" />

        <p className="truncate">{folder.name}</p>
      </li>
    ));
  } else {
    content = (
      <div className="flex h-full items-center justify-center">
        {backups.status === 'LOADING' ? (
          <Spinner className="h-5 w-5 animate-spin text-gray-100" />
        ) : backups.status === 'ERROR' ? (
          <p className="text-sm font-medium">We could not load your backups</p>
        ) : (
          <p className="text-sm text-gray-50">
            {translate('settings.backups.folders.no-folders')}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-2">
      <p className="text-sm font-medium text-gray-100">
        {translate('settings.backups.folders.explanation')}
      </p>

      <ul
        className="h-48 list-none overflow-y-auto rounded-lg border border-gray-20 bg-surface shadow-sm"
        onClick={() => setSelected(null)}
        role="none"
      >
        {content}
      </ul>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <Button
            variant="secondary"
            disabled={backups.status === 'LOADING'}
            onClick={handleAddBackup}
          >
            <Plus size={16} />
          </Button>
          <Button
            variant="secondary"
            disabled={selected === null}
            onClick={() => del()}
          >
            <Minus size={16} />
          </Button>
        </div>

        <Button onClick={onGoToPanel}>
          {translate('settings.backups.folders.done')}
        </Button>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={handleOnCloseDeleteModal}
        nameOfBackup={selected?.name}
      />
    </div>
  );
}

function Modal({
  nameOfBackup,
  isOpen,
  onClose,
}: {
  nameOfBackup?: string;
  isOpen: boolean;
  onClose: (
    result: 'CANCEL' | 'DISABLE' | 'DELETE',
    dontAksAgain: boolean
  ) => void;
}) {
  const { translate } = useTranslationContext();
  const [checkbox, setCheckbox] = useState(false);
  const [dontAksAgain, setDontAskAgain] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCheckbox(false);
    }
  }, [isOpen]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-10 flex h-full items-center justify-center overflow-y-auto"
        onClose={() => onClose('CANCEL', dontAksAgain)}
      >
        <div className="min-h-screen">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-black/40 dark:bg-gray-50/40" />
          </Transition.Child>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="absolute left-1/2 top-1/2 flex w-80 -translate-x-1/2 -translate-y-1/2 transform flex-col items-stretch space-y-6 overflow-hidden rounded-2xl bg-surface p-5 shadow-xl transition-all dark:bg-gray-1">
              <div className="flex flex-col space-y-2">
                <Dialog.Title
                  as="h3"
                  className="line-clamp-3 text-lg font-medium leading-6 text-gray-100"
                >
                  {translate('settings.backups.folders.stop-baking-up.title')}
                  &quot;<span>{nameOfBackup}</span>&quot;?
                </Dialog.Title>

                <p className="text-sm text-gray-50">
                  {translate(
                    'settings.backups.folders.stop-baking-up.explanation'
                  )}
                </p>
              </div>

              <Checkbox
                label={translate(
                  'settings.backups.folders.stop-baking-up.dont-ask-again'
                )}
                checked={dontAksAgain}
                onClick={() => setDontAskAgain(!dontAksAgain)}
              />

              <div className="flex flex-col items-stretch space-y-2">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() =>
                    onClose(checkbox ? 'DELETE' : 'DISABLE', dontAksAgain)
                  }
                >
                  {translate('settings.backups.folders.stop-baking-up.confirm')}
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => onClose('CANCEL', false)}
                >
                  {translate('settings.backups.folders.stop-baking-up.cancel')}
                </Button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
