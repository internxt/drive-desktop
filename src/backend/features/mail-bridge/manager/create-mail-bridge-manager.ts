import { logger } from '@internxt/drive-desktop-core/build/backend';
import {
  closeControlServer,
  createConnectionSettings,
  createControlServer,
  sendControlMessage,
  waitForControlConnection,
  waitForReadyMessage,
  type MailBridgeSession,
} from '@internxt/drive-desktop-core/build/backend/features/mail-bridge';
import type { ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { Server, Socket } from 'node:net';
import { captureMailBridgeStartupStderr, createMailBridgeStateDirectory, spawnMailBridge } from '../services/mail-bridge-process.service';
import { createMailBridgeStatus } from '../services/mail-bridge-status.service';
import { createControlEndpoint } from '../utils/create-control-endpoint';
import { type MailBridgeStatus, startupTimeoutMs } from './constants';
import { createMailBridgeManagerState, updateMailBridgeManagerState } from './state';

type ControlChannel = { endpoint: string; server: Server };
type ControlChannelResult = { data: ControlChannel; error: undefined } | { data: undefined; error: Error };

export function createMailBridgeManager({ onStatusChange }: { onStatusChange: (status: MailBridgeStatus) => void }) {
  let state = createMailBridgeManagerState();
  const { getStatus, setStatus } = createMailBridgeStatus({ onStatusChange });

  async function start(session: MailBridgeSession) {
    const { status: currentStatus } = getStatus();
    if (currentStatus === 'running' && state.connection) return { data: state.connection, error: undefined };
    if (currentStatus === 'starting') return { data: undefined, error: new Error('Mail Bridge is already starting') };

    setStatus({ status: 'starting', error: undefined });

    const settings = await startBridge({ session });
    if (settings.error) return failStartup({ error: settings.error });

    state = updateMailBridgeManagerState({ state, updates: { connection: settings.data } });
    setStatus({ status: 'running', error: undefined });

    state.child?.once('exit', () => {
      if (!state.stopping) void handleUnexpectedExit();
    });
    return settings;
  }

  async function startBridge({ session }: { session: MailBridgeSession }) {
    const { data, error } = await openControlChannel();
    if (error) return { error, data: undefined };

    const bridge = await launchBridge({ session, endpoint: data.endpoint });
    if (bridge.error) return bridge;

    return await completeSessionHandshake({
      session,
      server: data.server,
      bridge: bridge.data.child,
      getStartupError: bridge.data.getStartupError,
    });
  }

  async function openControlChannel(): Promise<ControlChannelResult> {
    const endpoint = createControlEndpoint({ id: randomUUID() });
    const result = await createControlServer({ endpoint });
    if (result.error) return { data: undefined, error: result.error };

    const control = { endpoint, server: result.data };
    state = updateMailBridgeManagerState({ state, updates: { server: control.server } });
    return { data: control, error: undefined };
  }

  async function launchBridge({ session, endpoint }: { session: MailBridgeSession; endpoint: string }) {
    const stateDirectory = await createMailBridgeStateDirectory({ accountId: session.account_id });
    if (stateDirectory.error) return stateDirectory;

    const startedBridge = spawnMailBridge({ endpoint, stateDirectory: stateDirectory.data });
    if (startedBridge.error) return startedBridge;
    const bridge = startedBridge.data;
    state = updateMailBridgeManagerState({ state, updates: { child: bridge } });
    return { data: { child: bridge, getStartupError: captureMailBridgeStartupStderr({ child: bridge }) }, error: undefined };
  }

  async function completeSessionHandshake({
    session,
    server,
    bridge,
    getStartupError,
  }: {
    session: MailBridgeSession;
    server: Server;
    bridge: ChildProcess;
    getStartupError: () => string | undefined;
  }) {
    const connected = await waitForConnection({ server, child: bridge, getStartupError });
    if (connected.error) return connected;
    state = updateMailBridgeManagerState({ state, updates: { socket: connected.data } });

    const sent = await sendControlMessage({ socket: connected.data, message: { type: 'start_session', session } });
    if (sent.error)
      return { data: undefined, error: await createBridgeStartupError({ error: sent.error, child: bridge, getStartupError }) };

    const ready = await waitForReady({ socket: connected.data, child: bridge, getStartupError });
    if (ready.error)
      return { data: undefined, error: await createBridgeStartupError({ error: ready.error, child: bridge, getStartupError }) };

    const settings = createConnectionSettings({ ready: ready.data, session });
    return settings;
  }

  async function stop() {
    const bridge = state.child;
    state.socket?.destroy();
    state = updateMailBridgeManagerState({
      state,
      updates: { stopping: true, child: undefined, connection: undefined, socket: undefined },
    });

    const closed = await closeControlServer({ server: state.server });
    state = updateMailBridgeManagerState({ state, updates: { server: undefined, stopping: false } });
    if (bridge && !bridge.killed) bridge.kill();

    if (closed.error) {
      setStatus({ status: 'error', error: closed.error.message });
      return closed;
    }
    setStatus({ status: 'stopped', error: undefined });
    return { data: undefined, error: undefined };
  }

  async function failStartup({ error }: { error: Error }): Promise<{ data: undefined; error: Error }> {
    await stop();
    logger.error({ msg: 'Mail Bridge failed to start', error });
    setStatus({ status: 'error', error: error.message });
    return { data: undefined, error };
  }

  async function handleUnexpectedExit(): Promise<void> {
    await closeControlServer({ server: state.server });
    state = updateMailBridgeManagerState({
      state,
      updates: { server: undefined, socket: undefined, child: undefined, connection: undefined },
    });
    logger.error({ msg: 'Mail Bridge stopped unexpectedly' });
    setStatus({ status: 'error', error: 'Mail Bridge stopped unexpectedly' });
  }

  return { start, stop, getStatus };
}

async function waitForConnection({
  server,
  child,
  getStartupError,
}: {
  server: Server;
  child: ChildProcess;
  getStartupError: () => string | undefined;
}): Promise<{ data: Socket; error: undefined } | { data: undefined; error: Error }> {
  return await withStartupTimeout({
    operation: new Promise<Awaited<ReturnType<typeof waitForControlConnection>>>((resolveConnection) => {
      const onExit = () =>
        resolveConnection({
          data: undefined,
          error: createBridgeExitError({ message: 'Mail Bridge exited before connecting', getStartupError }),
        });
      const onError = (error: Error) => resolveConnection({ data: undefined, error });
      child.once('exit', onExit);
      child.once('error', onError);
      waitForControlConnection({ server }).then((connection) => {
        child.removeListener('exit', onExit);
        child.removeListener('error', onError);
        resolveConnection(connection);
      });
    }),
  });
}

async function waitForReady({
  socket,
  child,
  getStartupError,
}: {
  socket: Socket;
  child: ChildProcess;
  getStartupError: () => string | undefined;
}) {
  if (child.exitCode !== null) {
    return { data: undefined, error: createBridgeExitError({ message: 'Mail Bridge exited before becoming ready', getStartupError }) };
  }

  return await withStartupTimeout({
    operation: new Promise<Awaited<ReturnType<typeof waitForReadyMessage>>>((resolveReady) => {
      const onExit = () =>
        resolveReady({
          data: undefined,
          error: createBridgeExitError({ message: 'Mail Bridge exited before becoming ready', getStartupError }),
        });
      const onError = (error: Error) => resolveReady({ data: undefined, error });
      child.once('exit', onExit);
      child.once('error', onError);
      waitForReadyMessage({ socket }).then((ready) => {
        child.removeListener('exit', onExit);
        child.removeListener('error', onError);
        resolveReady(ready);
      });
    }),
  });
}

function createBridgeExitError({ message, getStartupError }: { message: string; getStartupError: () => string | undefined }): Error {
  const startupError = getStartupError();
  return new Error(startupError ? `${message}: ${startupError}` : message);
}

async function createBridgeStartupError({
  error,
  child,
  getStartupError,
}: {
  error: Error;
  child: ChildProcess;
  getStartupError: () => string | undefined;
}): Promise<Error> {
  if (child.exitCode === null) {
    await Promise.race([
      new Promise<void>((resolveClose) => child.once('close', () => resolveClose())),
      new Promise<void>((resolveTimeout) => setTimeout(resolveTimeout, 250)),
    ]);
  }

  const startupError = getStartupError();
  return startupError ? new Error(`${error.message}: ${startupError}`) : error;
}

async function withStartupTimeout<T>({ operation }: { operation: Promise<T> }): Promise<T | { data: undefined; error: Error }> {
  return await new Promise((resolveOperation) => {
    const timeout = setTimeout(
      () => resolveOperation({ data: undefined, error: new Error('Mail Bridge startup timed out') }),
      startupTimeoutMs,
    );
    void operation.then((result) => {
      clearTimeout(timeout);
      resolveOperation(result);
    });
  });
}
