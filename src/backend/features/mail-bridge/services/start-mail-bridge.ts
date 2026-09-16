import {
  createConnectionSettings,
  createControlServer,
  sendControlMessage,
  type MailBridgeSession,
} from '@internxt/drive-desktop-core/build/backend/features/mail-bridge';
import type { ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { Socket } from 'node:net';
import type { MailBridgeResources } from '../mail-bridge.types';
import { createControlEndpoint } from '../utils/create-control-endpoint';
import { captureMailBridgeStartupStderr, createMailBridgeStateDirectory, spawnMailBridge } from './mail-bridge-process.service';
import { waitForMailBridgeConnection, waitForMailBridgeReady } from './mail-bridge-startup.service';
import { stopMailBridgeResources } from './stop-mail-bridge';

type StartMailBridgeProps = {
  session: MailBridgeSession;
  onUnexpectedExit: (input: { socket: Socket; error: Error }) => void;
  onResourcesChange: (resources: MailBridgeResources) => void;
  signal: AbortSignal;
};
export async function startMailBridge({ session, onUnexpectedExit, onResourcesChange, signal }: StartMailBridgeProps) {
  const endpoint = createControlEndpoint(randomUUID());
  const { data: server, error: errorServer } = await createControlServer({ endpoint });
  if (errorServer) return { error: errorServer, data: undefined };
  onResourcesChange({ server });
  if (signal.aborted) return await stopCancelledMailBridgeStart({ server });

  const { data: stateDirectory, error: stateError } = await createMailBridgeStateDirectory(session.account_id);
  if (stateError) {
    await stopMailBridgeResources({ server });
    return { data: undefined, error: stateError };
  }

  const { data: child, error: spawnMailBridgeError } = spawnMailBridge({ endpoint, stateDirectory });
  if (spawnMailBridgeError) {
    await stopMailBridgeResources({ server });
    return { data: undefined, error: spawnMailBridgeError };
  }
  onResourcesChange({ child, server });
  if (signal.aborted) return await stopCancelledMailBridgeStart({ child, server });
  const getStartupError = captureMailBridgeStartupStderr(child);

  const { data: socket, error: connectionError } = await waitForMailBridgeConnection({ server, child, getStartupError });
  if (connectionError) {
    await stopMailBridgeResources({ child, server });
    return { data: undefined, error: connectionError };
  }
  onResourcesChange({ child, server, socket });
  if (signal.aborted) return await stopCancelledMailBridgeStart({ child, server, socket });
  const sent = await sendControlMessage({ socket, message: { type: 'start_session', session } });
  if (sent.error) {
    await stopMailBridgeResources({ child, server, socket });
    return { data: undefined, error: sent.error };
  }
  const ready = await waitForMailBridgeReady({
    socket,
    child,
    getStartupError,
  });
  if (ready.error) {
    await stopMailBridgeResources({ child, server, socket });
    return { data: undefined, error: ready.error };
  }
  const { data: connection, error: connectionSettingsError } = createConnectionSettings({ ready: ready.data, session });
  if (connectionSettingsError) {
    await stopMailBridgeResources({ child, server, socket });
    return { data: undefined, error: connectionSettingsError };
  }

  listenForUnexpectedBridgeExit({ child, socket, onUnexpectedExit });
  return { data: { child, server, socket, connection }, error: undefined };
}

function listenForUnexpectedBridgeExit({
  child,
  socket,
  onUnexpectedExit,
}: {
  child: ChildProcess;
  socket: Socket;
  onUnexpectedExit: (input: { socket: Socket; error: Error }) => void;
}): void {
  child.once('exit', () => onUnexpectedExit({ socket, error: new Error('Mail Bridge stopped unexpectedly') }));
  child.once('error', (error) => onUnexpectedExit({ socket, error }));
  socket.once('error', (error) => onUnexpectedExit({ socket, error }));
  socket.once('close', () => onUnexpectedExit({ socket, error: new Error('Mail Bridge control channel closed unexpectedly') }));
}

async function stopCancelledMailBridgeStart(resources: MailBridgeResources) {
  const stopped = await stopMailBridgeResources(resources);
  return { data: undefined, error: stopped.error ?? new Error('Mail Bridge startup was cancelled') };
}
