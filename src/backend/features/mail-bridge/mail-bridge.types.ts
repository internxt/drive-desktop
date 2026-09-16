import type { MailBridgeConnectionSettings } from '@internxt/drive-desktop-core/build/backend/features/mail-bridge';
import type { ChildProcess } from 'node:child_process';
import type { Server, Socket } from 'node:net';

export const startupTimeoutMs = 30_000;

export type MailBridgeStatus = { status: 'stopped' | 'starting' | 'running'; error: undefined } | { status: 'error'; error: string };

export type MailBridgeRuntime = {
  child: ChildProcess;
  server: Server;
  socket: Socket;
  connection: MailBridgeConnectionSettings;
};

export type MailBridgeResources = Partial<Pick<MailBridgeRuntime, 'child' | 'server' | 'socket'>>;
export type { MailBridgeConnectionSettings };
