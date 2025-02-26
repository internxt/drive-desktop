import { Dialog, Transition } from '@headlessui/react';
import { Fragment, ReactNode } from 'react';
import Button from '../../../../components/Button';

export const ActionDialog = ({
  showDialog,
  title,
  children,
  cancelText,
  confirmText,
  confirmButtonVariant,
  onCancel,
  onConfirm,
  confirmButtonTestId,
}: {
  showDialog: boolean;
  title: string;
  children: ReactNode;
  cancelText: string;
  confirmText: string;
  confirmButtonVariant?: 'danger' | 'primary' | 'secondary' | undefined;
  onCancel: () => void;
  onConfirm: () => void;
  confirmButtonTestId?: string;
}) => (
  <Transition appear show={showDialog} as={Fragment}>
    <Dialog
      as="div"
      className="fixed inset-0 z-10 overflow-y-auto bg-black/40"
      onClose={() => {
        //
      }}
    >
      <div className="min-h-screen px-4 text-center ">
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

        <span className="inline-block h-screen align-middle" aria-hidden="true">
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
            className="my-8 inline-block transform overflow-hidden rounded-2xl bg-surface p-4 text-left align-middle shadow transition-all"
          >
            <Dialog.Title
              as="h3"
              className="text-neutral-700 mb-3 text-lg font-medium leading-6"
            >
              {title}
            </Dialog.Title>
            <div className="flex w-full flex-col gap-3">
              <div className="">{children}</div>
              <div className="flex flex-row items-center gap-4">
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={onCancel}
                >
                  {cancelText}
                </Button>
                <Button
                  className="w-full"
                  variant={confirmButtonVariant ?? 'danger'}
                  onClick={onConfirm}
                  data-testid={confirmButtonTestId}
                >
                  {confirmText}
                </Button>
              </div>
            </div>
          </div>
        </Transition.Child>
      </div>
    </Dialog>
  </Transition>
);
