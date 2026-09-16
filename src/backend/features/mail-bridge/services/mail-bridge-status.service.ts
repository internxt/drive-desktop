import type { MailBridgeStatus } from '../manager/constants';

/**
 * Owns the non-secret lifecycle state shown to Desktop callers and notifies the
 * renderer-facing callback whenever that state changes.
 */
export function createMailBridgeStatus({ onStatusChange }: { onStatusChange: (status: MailBridgeStatus) => void }) {
  let status: MailBridgeStatus = { status: 'stopped', error: undefined };

  return {
    getStatus: () => status,
    setStatus: (nextStatus: MailBridgeStatus) => {
      status = nextStatus;
      onStatusChange(nextStatus);
    },
  };
}
