import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react/jsx-runtime';
import Button from '../../Button';
import { useI18n } from '@/apps/renderer/localize/use-i18n';

interface ConfirmationModalProps {
  show: boolean;
  onCanceled: () => void;
  onConfirmed: () => void;
  title?: string;
  explanation?: string;
  explanation2?: string;
  confirmText?: string;
  cancelText?: string;
  variantButton?: 'primary' | 'secondary' | 'danger';
}

export function ConfirmationModal({
  show,
  onConfirmed,
  onCanceled,
  title,
  explanation,
  explanation2,
  confirmText,
  cancelText,
  variantButton,
}: ConfirmationModalProps) {
  const { translate } = useI18n();

  return (
    <Transition appear show={show} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" onClose={onCanceled}>
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0">
            <Dialog.Overlay className="fixed inset-0 bg-black/30" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span className="inline-block h-screen p-6 align-middle" aria-hidden="true">
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95">
            <div
              style={{ width: '400px' }}
              className="my-8 inline-block transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-xl transition-all dark:bg-black">
              <Dialog.Title as="h3" className="text-neutral-900 mb-4 text-2xl font-medium leading-6">
                {title || translate('settings.backups.delete.deletion-modal.title')}
              </Dialog.Title>
              <div>
                <p className="text-xl text-gray-60">{explanation}</p>
                <p className="mt-2 text-xl text-gray-60">{explanation2}</p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-2">
                <Button className="bold basis-1/2 p-2 text-xl font-medium" size="lg" onClick={onCanceled} variant="secondary">
                  {cancelText}
                </Button>
                <Button
                  className="bold basis-1/2 p-2 text-xl font-medium"
                  size="lg"
                  variant={variantButton || 'danger'}
                  onClick={() => onConfirmed()}>
                  {confirmText}
                </Button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
