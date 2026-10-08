import type { ControlMessage } from '@internxt/drive-desktop-core/build/backend/features/mail-bridge';

/**
 * Creates the error reported when the running Bridge sends an unsupported control message.
 */
export function createUnexpectedControlMessageError(message: ControlMessage): Error {
  return message.type === 'error'
    ? new Error(`Mail Bridge stopped: ${message.error.code}`)
    : new Error('Mail Bridge sent an unexpected control message');
}
