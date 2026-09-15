import type { MailBridgeSession } from '@internxt/drive-desktop-core/build/backend/features/mail-bridge';
import { createMailBridgeManager } from '../manager/create-mail-bridge-manager';
import type { MailBridgeStatus } from '../manager/constants';

const statusListeners = new Set<(status: MailBridgeStatus) => void>();

const manager = createMailBridgeManager({
  onStatusChange(status) {
    statusListeners.forEach((listener) => listener(status));
  },
});

export function getMailBridgeStatus(): MailBridgeStatus {
  return manager.getStatus();
}

export async function startMailBridge({ session }: { session: MailBridgeSession }) {
  return await manager.start(session);
}

export async function stopMailBridge() {
  return await manager.stop();
}

export function subscribeToMailBridgeStatus({ listener }: { listener: (status: MailBridgeStatus) => void }): () => void {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}
