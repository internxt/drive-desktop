import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { useTranslationContext } from 'renderer/context/LocalContext';

import { ErrorDetails, ProcessIssue } from '../../../workers/types';
import { longMessages, shortMessages } from '../../messages/process-error';
import Button from 'renderer/components/Button';
import TextArea from 'renderer/components/TextArea';
import Checkbox from 'renderer/components/Checkbox';

const posibleErrorStates = ['ERROR', 'TOO_MANY_REPORTS'] as const;
type ErrorReportRequestState = (typeof posibleErrorStates)[number];
type ReportRequestState = 'READY' | 'SENDING' | ErrorReportRequestState;

const stateIsError = (maybe: unknown): maybe is ErrorReportRequestState =>
  typeof maybe === 'string' &&
  posibleErrorStates.includes(maybe as ErrorReportRequestState);

const errorMessages: Record<ErrorReportRequestState, string> = {
  ERROR:
    'We could not send your request, make sure you are connected to the internet',
  TOO_MANY_REPORTS: 'Reached reporting errors day limit',
};

export function ReportModal({
  data,
  onClose,
}: {
  data: Pick<ProcessIssue, 'errorName'> | null;
  onClose: () => void;
}) {
  const { translate } = useTranslationContext();

  const [phase, setPhase] = useState<'INITIAL' | 'REPORTING'>('INITIAL');

  const [requestState, setRequestState] = useState<ReportRequestState>('READY');

  const [includeLogs, setIncludeLogs] = useState(true);
  const [userComment, setUserComment] = useState('');

  const dialogTitle = data
    ? translate(shortMessages[data.errorName])
    : undefined;
  const errorDescription = data
    ? translate(longMessages[data.errorName])
    : undefined;

  const handleOpenURL = async (URL: string) => {
    try {
      await window.electron.openUrl(URL);
    } catch (error) {
      reportError(error);
    }
  };

  const supportParagraph = (
    <>
      {translate('issues.report-modal.help-url')}{' '}
      <span
        className="cursor-pointer text-primary"
        onClick={() => handleOpenURL('https://help.internxt.com')}
      >
        help.internxt.com
      </span>
      .&nbsp; {translate('issues.report-modal.report')}
    </>
  );

  async function handleSubmit() {
    setRequestState('SENDING');
    // Send reports throw the issues windows was disabled
    const result = await window.electron.sendReport({
      errorDetails: {} as ErrorDetails,
      userComment,
      includeLogs,
    });

    if (result.state === 'OK') {
      onClose();

      return;
    }

    if (result.state === 'TOO_MANY_REPORTS') {
      setRequestState('TOO_MANY_REPORTS');

      return;
    }

    setRequestState('ERROR');
  }

  return (
    <Transition appear show={data !== null} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-10 overflow-y-auto"
        onClose={onClose}
      >
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-black/40 dark:bg-gray-50/40" />
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
            <div className="my-6 inline-block w-full max-w-md transform overflow-hidden rounded-xl bg-surface p-5 text-left align-middle shadow-xl transition-all dark:bg-gray-1">
              <div className="flex flex-col space-y-2">
                <Dialog.Title
                  as="h3"
                  className="font-medium leading-6 text-gray-100"
                >
                  {dialogTitle}
                </Dialog.Title>

                <p className="text-sm text-gray-60">
                  {phase === 'INITIAL' ? errorDescription : supportParagraph}
                </p>

                {phase === 'REPORTING' && (
                  <div className="flex h-40 flex-col space-y-1.5">
                    <p className="text-sm font-medium text-gray-100">
                      {translate('issues.report-modal.user-comments')}
                    </p>

                    <TextArea
                      value={userComment}
                      onChange={(e) => setUserComment(e.target.value)}
                      customClassName="flex-1"
                      resize="none"
                    />

                    {stateIsError(requestState) && (
                      <p className="text-sm text-red">
                        {errorMessages[requestState]}
                      </p>
                    )}

                    <Checkbox
                      checked={includeLogs}
                      onClick={() => setIncludeLogs(!includeLogs)}
                      label={translate('issues.report-modal.include-logs')}
                    />
                  </div>
                )}

                <div className="flex shrink-0 items-center justify-end space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      phase === 'INITIAL' ? onClose() : setPhase('INITIAL')
                    }
                  >
                    {translate(
                      phase === 'INITIAL'
                        ? 'issues.report-modal.actions.close'
                        : 'issues.report-modal.actions.cancel'
                    )}
                  </Button>

                  <Button
                    disabled={requestState === 'SENDING'}
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      phase === 'INITIAL'
                        ? setPhase('REPORTING')
                        : handleSubmit()
                    }
                  >
                    {phase === 'INITIAL'
                      ? translate('issues.report-modal.actions.report')
                      : translate('issues.report-modal.actions.send')}
                  </Button>
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
