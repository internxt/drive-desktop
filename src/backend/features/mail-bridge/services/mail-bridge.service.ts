import { logger } from '@internxt/drive-desktop-core/build/backend';
import type { MailBridgeSession } from '@internxt/drive-desktop-core/build/backend/features/mail-bridge';
import type { MailBridgeResources, MailBridgeRuntime, MailBridgeStatus } from '../mail-bridge.types';
import { startMailBridge as startRuntime } from './start-mail-bridge';
import { stopMailBridgeResources } from './stop-mail-bridge';

let runtime: MailBridgeRuntime | undefined;
let resources: MailBridgeResources = {};
let startup: ReturnType<typeof startNewMailBridge> | undefined;
let startupCancellation: AbortController | undefined;
let status: MailBridgeStatus = { status: 'stopped', error: undefined };
let stopping = false;
const statusListeners = new Set<(nextStatus: MailBridgeStatus) => void>();

export async function startMailBridge(session: MailBridgeSession) {
  if (status.status === 'running' && runtime) return { data: runtime.connection, error: undefined };
  if (startup) return await startup;

  startupCancellation = new AbortController();
  startup = startNewMailBridge({ session, signal: startupCancellation.signal });
  try {
    return await startup;
  } finally {
    startup = undefined;
    startupCancellation = undefined;
  }
}

async function startNewMailBridge({ session, signal }: { session: MailBridgeSession; signal: AbortSignal }) {
  setStatus({ status: 'starting', error: undefined });

  let started;
  try {
    started = await startRuntime({
      session,
      signal,
      onResourcesChange: updateResources,
      onUnexpectedExit: handleUnexpectedExit,
    });
  } catch (error) {
    return failStartup(error instanceof Error ? error : new Error('Mail Bridge could not start'));
  }
  if (signal.aborted) return { data: undefined, error: new Error('Mail Bridge startup was cancelled') };
  if (started.error) return failStartup(started.error);
  if (getMailBridgeStatus().status !== 'starting') return failStartup(new Error('Mail Bridge stopped before becoming ready'));
  runtime = started.data;
  resources = started.data;
  setStatus({ status: 'running', error: undefined });
  return { data: started.data.connection, error: undefined };
}

export async function stopMailBridge() {
  stopping = true;
  startupCancellation?.abort();
  const stopped = await stopMailBridgeResources(resources);
  resources = {};
  runtime = undefined;
  stopping = false;
  if (stopped.error) {
    setStatus({ status: 'error', error: stopped.error.message });
    return stopped;
  }
  setStatus({ status: 'stopped', error: undefined });
  return stopped;
}

export function getMailBridgeStatus(): MailBridgeStatus {
  return status;
}

export function subscribeToMailBridgeStatus(listener: (nextStatus: MailBridgeStatus) => void): () => void {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

function handleUnexpectedExit({ socket, error }: { socket: import('node:net').Socket; error: Error }): void {
  if (stopping || (runtime?.socket !== socket && status.status !== 'starting')) return;
  const resourcesToStop = resources;
  runtime = undefined;
  resources = {};
  void stopMailBridgeResources(resourcesToStop);
  logger.error({ msg: 'Mail Bridge stopped unexpectedly', error });
  setStatus({ status: 'error', error: error.message });
}

function updateResources(nextResources: MailBridgeResources): void {
  resources = nextResources;
}

function failStartup(error: Error) {
  runtime = undefined;
  resources = {};
  logger.error({ msg: 'Mail Bridge failed to start', error });
  setStatus({ status: 'error', error: error.message });
  return { data: undefined, error };
}

function setStatus(nextStatus: MailBridgeStatus): void {
  status = nextStatus;
  statusListeners.forEach((listener) => listener(status));
}
