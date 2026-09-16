import type { ControlMessage, MailBridgeConnectionSettings } from '@internxt/drive-desktop-core/build/backend/features/mail-bridge';

export const startupTimeoutMs = 30_000;

export type MailBridgeStatus = { status: 'stopped' | 'starting' | 'running'; error: undefined } | { status: 'error'; error: string };
export type { ControlMessage, MailBridgeConnectionSettings };
