import type { ChildProcess } from 'node:child_process';
import type { Server, Socket } from 'node:net';
import type { MailBridgeConnectionSettings } from './constants';

export type MailBridgeManagerState = Readonly<{
  child: ChildProcess | undefined;
  server: Server | undefined;
  socket: Socket | undefined;
  connection: MailBridgeConnectionSettings | undefined;
  stopping: boolean;
}>;

export function createMailBridgeManagerState(): MailBridgeManagerState {
  return {
    child: undefined,
    server: undefined,
    socket: undefined,
    connection: undefined,
    stopping: false,
  };
}

export function updateMailBridgeManagerState({
  state,
  updates,
}: {
  state: MailBridgeManagerState;
  updates: Partial<MailBridgeManagerState>;
}): MailBridgeManagerState {
  return { ...state, ...updates };
}
