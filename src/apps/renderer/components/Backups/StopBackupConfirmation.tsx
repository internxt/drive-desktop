import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react/jsx-runtime';
import { useTranslationContext } from '../../context/LocalContext';
import Button from '../Button';

interface StopBackupConfirmationProps
  extends React.ButtonHTMLAttributes<HTMLBaseElement> {
  title: string;
  confirmMessage: string;
  show: boolean;
  confirm: () => void;
  cancel: () => void;
}

export function BackupActionConfirmation({
  show,
  confirm,
  confirmMessage,
  cancel,
  title,
  children,
}: StopBackupConfirmationProps) {
  const { translate } = useTranslationContext();

  return (
    <Transition appear show={show} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-10 overflow-y-auto"
        onClose={() => {
          // no-op
        }}
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
                className="text-neutral-700 text-center text-lg font-medium leading-6"
              >
                {title}
              </Dialog.Title>
              <div className="mt-2">
                <p className="text-neutral-500/80 text-center text-sm">
                  {children}
                </p>
              </div>
              <div className="mt-6 flex flex-col items-center">
                <Button className="mt-1 w-full" onClick={cancel}>
                  {translate('settings.backups.folders.stop-baking-up.cancel')}
                </Button>
                <Button className="w-full" variant="primary" onClick={confirm}>
                  {confirmMessage}
                </Button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
