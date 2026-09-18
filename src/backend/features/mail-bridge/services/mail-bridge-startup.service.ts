import {
  waitForControlConnection,
  waitForReadyMessage,
  type MailBridgeReadyMessage,
} from '@internxt/drive-desktop-core/build/backend/features/mail-bridge';
import type { ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import type { Server, Socket } from 'node:net';
import { createBridgeExitError } from '../utils/create-bridge-exit-error';
import { createStartupTimeout } from '../utils/create-startup-timeout';

type MailBridgeReadyResult = { data: MailBridgeReadyMessage; error: undefined } | { data: undefined; error: Error };

type WaitForMailBridgeConnectionProps = {
  server: Server;
  child: ChildProcess;
  getStartupError: () => string | undefined;
};

export async function waitForMailBridgeConnection({
  server,
  child,
  getStartupError,
}: WaitForMailBridgeConnectionProps): Promise<{ data: Socket; error: undefined } | { data: undefined; error: Error }> {
  const cancellation = new AbortController();
  const startupTimeout = createStartupTimeout();

  try {
    return await Promise.race([
      waitForControlConnection({ server }),
      waitForMailBridgeExit({
        child,
        getStartupError,
        message: 'Mail Bridge exited before connecting',
        signal: cancellation.signal,
      }),
      startupTimeout.result,
    ]);
  } finally {
    cancellation.abort();
    startupTimeout.cancel();
  }
}

type WaitForMailBridgeReadyProps = {
  socket: Socket;
  child: ChildProcess;
  getStartupError: () => string | undefined;
};

export async function waitForMailBridgeReady({
  socket,
  child,
  getStartupError,
}: WaitForMailBridgeReadyProps): Promise<MailBridgeReadyResult> {
  const cancellation = new AbortController();
  const startupTimeout = createStartupTimeout();

  try {
    return await Promise.race([
      waitForReadyMessage({ socket }),
      waitForMailBridgeExit({
        child,
        getStartupError,
        message: 'Mail Bridge exited before becoming ready',
        signal: cancellation.signal,
      }),
      startupTimeout.result,
    ]);
  } finally {
    cancellation.abort();
    startupTimeout.cancel();
  }
}

async function waitForMailBridgeExit({
  child,
  getStartupError,
  message,
  signal,
}: {
  child: ChildProcess;
  getStartupError: () => string | undefined;
  message: string;
  signal: AbortSignal;
}): Promise<{ data: undefined; error: Error }> {
  if (child.exitCode !== null) return { data: undefined, error: createBridgeExitError({ message, getStartupError }) };

  try {
    await once(child, 'exit', { signal });
    return { data: undefined, error: createBridgeExitError({ message, getStartupError }) };
  } catch (error) {
    return { data: undefined, error: error instanceof Error ? error : new Error('Mail Bridge failed during startup') };
  }
}
