import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import { Fragment, useCallback, useState } from 'react';
import { useTranslationContext } from 'renderer/context/LocalContext';

import { ProcessIssue } from '../../../workers/types';
import Spinner from '../../assets/spinner.svg';
import { longMessages, shortMessages } from '../../messages/process-error';

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
  data: Pick<ProcessIssue, 'errorName' | 'errorDetails'> | null;
  onClose: () => void;
}) {
  const { translate, language } = useTranslationContext();

  const reportingPhaseHeight = language === 'en' ? '273px' : '289px';

  const [height, setHeight] = useState(0);

  const measuredRef = useCallback((node) => {
    setTimeout(() => {
      if (node !== null) {
        setHeight(node.scrollHeight);
      }
    }, 0);
  }, []);

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

  const supportParagraph = (
    <>
      {translate('issues.report-modal.help-url')}{' '}
      <a
        href="https://help.internxt.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-50 underline"
      >
        help.internxt.com
      </a>
      .&nbsp; {translate('issues.report-modal.report')}
    </>
  );

  async function handleSubmit() {
    setRequestState('SENDING');
    const result = await window.electron.sendReport({
      errorDetails: data!.errorDetails,
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
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
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
            <motion.div
              variants={{
                INITIAL: { height },
                REPORTING: {
                  height: stateIsError(requestState)
                    ? '305px'
                    : reportingPhaseHeight,
                },
              }}
              animate={phase}
              transition={{ duration: 0.08, type: 'spring' }}
              className="my-6 inline-block w-full max-w-md transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all"
            >
              <div className="p-5" ref={measuredRef}>
                <Dialog.Title
                  as="h3"
                  className="font-medium leading-6 text-gray-90"
                >
                  {dialogTitle}
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-xs text-gray-50">
                    {phase === 'INITIAL' ? errorDescription : supportParagraph}
                  </p>
                </div>
                {phase === 'REPORTING' && (
                  <>
                    <p className="mt-2 text-xs text-gray-50">
                      {translate('issues.report-modal.user-comments')}
                    </p>
                    <textarea
                      value={userComment}
                      onChange={(e) => setUserComment(e.target.value)}
                      className="mt-1 h-16 w-full resize-none rounded-md border border-l-neutral-40 p-1 text-xs text-gray-80 caret-gray-60 outline-none"
                    />
                    <div className="mt-2 flex items-center">
                      <input
                        checked={includeLogs}
                        onChange={(e) => setIncludeLogs(e.target.checked)}
                        type="checkbox"
                      />
                      <p className="ml-1 text-xs text-gray-50">
                        {translate('issues.report-modal.include-logs')}
                      </p>
                    </div>
                    {stateIsError(requestState) && (
                      <p className="mt-4 text-xs text-red-60">
                        {errorMessages[requestState]}
                      </p>
                    )}
                  </>
                )}

                <div className="mt-4 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() =>
                      phase === 'INITIAL' ? onClose() : setPhase('INITIAL')
                    }
                    className="rounded-lg border border-l-neutral-30 px-4 py-1 text-sm text-gray-70 hover:bg-l-neutral-20 active:bg-l-neutral-30"
                  >
                    {translate(
                      phase === 'INITIAL'
                        ? 'issues.report-modal.actions.close'
                        : 'issues.report-modal.actions.cancel'
                    )}
                  </button>

                  <button
                    disabled={requestState === 'SENDING'}
                    type="button"
                    onClick={() =>
                      phase === 'INITIAL'
                        ? setPhase('REPORTING')
                        : handleSubmit()
                    }
                    className="h-7 w-20 rounded-lg bg-blue-60 px-4 py-1 text-sm text-white hover:bg-blue-70 active:bg-blue-80 disabled:bg-blue-30"
                  >
                    {phase === 'INITIAL' ? (
                      translate('issues.report-modal.actions.report')
                    ) : requestState === 'SENDING' ? (
                      <Spinner
                        className="mx-auto animate-spin fill-white"
                        width="18"
                        height="18"
                      />
                    ) : (
                      translate('issues.report-modal.actions.send')
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
