import { ProcessFatalErrorName } from '../BackupFatalErrors/BackupFatalErrors';

export type ForcedByUser = 'forced-by-user';
export type BackupCompleted = 'backup-completed';
type BackupFailed = 'failed';

export type StopReason = ForcedByUser | BackupCompleted | BackupFailed;

type StopReasonPayload = {
  'forced-by-user': (payload: undefined) => void;
  'backup-completed': (payload: undefined) => void;
  failed: ({ errorName }: { errorName: ProcessFatalErrorName }) => void;
};

type StopReasonPayloadHandlers = {
  [Property in keyof StopReasonPayload]: Array<StopReasonPayload[Property]>;
};

export class BackupsStopController {
  private controller = new AbortController();
  private stopReason: StopReason | undefined = undefined;
  private abortListener: ((event: Event) => void) | null = null;

  private end: Array<(reason: StopReason) => void> = [];
  private baseEmptyHandler: StopReasonPayloadHandlers = {
    'forced-by-user': [() => {}],
    'backup-completed': [() => {}],
    failed: [() => {}],
  };

  private handlers = this.baseEmptyHandler;
  constructor() {
    this.reset();
  }

  reset() {
    this.stopReason = undefined;
    if (this.abortListener && this.controller.signal) {
      this.controller.signal.removeEventListener('abort', this.abortListener);
    }
    this.controller = new AbortController();
    this.resetHandlers();
    this.resetAbortListener();
  }

  hasStopped(): boolean {
    return this.stopReason !== undefined;
  }

  userCancelledBackup() {
    this.stop('forced-by-user');
  }

  get signal(): AbortSignal {
    return this.controller.signal;
  }

  private stop(reason: StopReason) {
    this.stopReason = reason;
    this.controller.abort({ reason });
  }

  failed(cause: ProcessFatalErrorName) {
    this.stopReason = 'failed';

    this.controller.abort({
      reason: 'failed',
      payload: { errorName: cause },
    });
  }

  private resetHandlers() {
    this.end = [];
    this.handlers = this.baseEmptyHandler;
  }

  private resetAbortListener() {
    this.abortListener = () => {
      const { reason, payload } = this.controller.signal.reason as {
        reason: StopReason;
        payload: { errorName: ProcessFatalErrorName };
      };

      const handlersForReason = this.handlers[reason];

      handlersForReason.forEach((handler: (a: any) => void) => {
        handler(payload);
      });

      this.end.forEach((fn) => fn(reason));
    };

    this.controller.signal.addEventListener('abort', this.abortListener);
  }
}
