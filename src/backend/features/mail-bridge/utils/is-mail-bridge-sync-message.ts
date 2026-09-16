import type { ControlMessage } from '@internxt/drive-desktop-core/build/backend/features/mail-bridge';

/**
 * Identifies control messages that report synchronization activity after startup.
 */
export function isMailBridgeSyncMessage(message: ControlMessage): boolean {
  return message.type === 'sync_started' || message.type === 'sync_progress' || message.type === 'sync_finished';
}
