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

const listenerNotSet = () => {
  // no-op
};

export class BackupsStopController {
  private controller = new AbortController();
  private stopReason: StopReason | undefined = undefined;

  private end: Array<(reason: StopReason) => void> = [];

  private handlers: StopReasonPayloadHandlers = {
    'forced-by-user': [() => listenerNotSet()],
    'backup-completed': [() => listenerNotSet()],
    failed: [() => listenerNotSet()],
  };

  constructor() {
    this.reset();
  }

  reset() {
    this.stopReason = undefined;
    this.controller = new AbortController();

    this.controller.signal.addEventListener('abort', () => {
      const { reason, payload } = this.controller.signal.reason as {
        reason: StopReason;
        payload: { errorName: ProcessFatalErrorName };
      };

      const handlersForReason = this.handlers[reason];

      handlersForReason.forEach((handler: (a: any) => void) => {
        handler(payload);
      });

      this.end.forEach((fn) => fn(reason));
    });
  }

  hasStopped(): boolean {
    return this.stopReason !== undefined;
  }

  userCancelledBackup() {
    this.stop('forced-by-user');
  }

  backupCompleted() {
    this.stop('backup-completed');
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

  on<Reason extends StopReason>(
    reason: Reason,
    handler: StopReasonPayload[Reason]
  ) {
    this.handlers[reason].push(handler);
  }

  onFinished(handler: (reason: StopReason) => void) {
    this.end.push(handler);
  }
}
