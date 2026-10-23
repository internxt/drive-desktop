import type {
  MailBridgeSessionPreparationError,
  MailBridgeSyncProgress,
} from '@internxt/drive-desktop-core/build/backend/features/mail-bridge';
import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { MailBridgeModule } from '@internxt/drive-desktop-core/build/frontend';
import { useEffect, useRef, useState } from 'react';
import type { MailBridgeStatus } from '@/backend/features/mail-bridge';

const unexpectedMailBridgeError = 'unexpected-mail-bridge-error';

export function useMailBridge() {
  const [viewModel, setViewModel] = useState(() => MailBridgeModule.createInitialViewModel());
  const [syncProgress, setSyncProgress] = useState<MailBridgeSyncProgress | undefined>();
  const syncProgressRevision = useRef(0);
  const statusRevision = useRef(0);
  const [isLoadingInitialStatus, setIsLoadingInitialStatus] = useState(true);
  const [isStartOnLoginEnabled, setIsStartOnLoginEnabled] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string | undefined>();

  function applyStatus(status: MailBridgeStatus) {
    if (status.status === 'stopped' || status.status === 'error') applySyncProgress(undefined);
    if (status.status === 'stopped') setViewModel(MailBridgeModule.createInitialViewModel());
    if (status.status === 'starting') setViewModel({ status: 'starting', error: null });
    if (status.status === 'running')
      setViewModel({ status: 'running', error: null, connection: status.connection, lastChecked: status.lastChecked });
    if (status.status === 'error') setViewModel({ status: 'error', error: status.error });
  }

  function applySyncProgress(syncProgress: MailBridgeSyncProgress | undefined) {
    syncProgressRevision.current += 1;
    setSyncProgress(syncProgress);
  }

  function applyLiveStatus(status: MailBridgeStatus) {
    statusRevision.current += 1;
    applyStatus(status);
  }

  function applyMailAccountEmail(result: Result<string, MailBridgeSessionPreparationError>) {
    if (Result.isError(result)) {
      setAccountEmail(undefined);
      if (result.error.code === 'mail-not-setup') {
        setViewModel({ status: 'setup-required', error: null });
        return;
      }

      setViewModel({ status: 'error', error: result.error.message });
      return;
    }

    setAccountEmail(result.data);
  }

  useEffect(() => {
    const unsubscribeFromStatus = globalThis.window.electron.mailBridge.onStatusChanged(applyLiveStatus);
    const unsubscribeFromSyncProgress = globalThis.window.electron.mailBridge.onSyncProgressChanged(applySyncProgress);
    void loadInitialState();

    return () => {
      unsubscribeFromStatus();
      unsubscribeFromSyncProgress();
    };
  }, []);

  async function activate() {
    setViewModel({ status: 'starting', error: null });

    try {
      const result = await globalThis.window.electron.mailBridge.start();
      if (result.error || !result.data) {
        if (result.error?.code === 'mail-not-setup') {
          setViewModel({ status: 'setup-required', error: null });
          return;
        }
        setViewModel({ status: 'error', error: result.error?.message ?? unexpectedMailBridgeError });
        return;
      }

      setViewModel((current) => ({
        status: 'running',
        error: null,
        connection: result.data,
        lastChecked: current.status === 'running' ? current.lastChecked : undefined,
      }));
      const revision = syncProgressRevision.current;
      const [email, progress] = await Promise.all([
        globalThis.window.electron.mailBridge.getEmail(),
        globalThis.window.electron.mailBridge.getSyncProgress(),
      ]);
      applyMailAccountEmail(email);
      if (revision === syncProgressRevision.current) setSyncProgress(progress);
    } catch {
      setViewModel({ status: 'error', error: unexpectedMailBridgeError });
    }
  }

  async function turnOff() {
    try {
      const result = await globalThis.window.electron.mailBridge.stop();
      if (result.error) {
        setViewModel({ status: 'error', error: result.error });
        return { data: undefined, error: new Error(result.error) };
      }
      return { data: undefined, error: undefined };
    } catch {
      setViewModel({ status: 'error', error: unexpectedMailBridgeError });
      return { data: undefined, error: new Error(unexpectedMailBridgeError) };
    }
  }

  async function retry() {
    const stopped = await turnOff();
    if (stopped.error) return;
    await activate();
  }

  async function resync() {
    try {
      const result = await globalThis.window.electron.mailBridge.resync();
      return result.error ? { data: undefined, error: new Error(result.error) } : { data: undefined, error: undefined };
    } catch {
      return { data: undefined, error: new Error(unexpectedMailBridgeError) };
    }
  }

  async function setStartOnLogin(enabled: boolean) {
    try {
      await globalThis.window.electron.mailBridge.setStartOnLogin(enabled);
      setIsStartOnLoginEnabled(enabled);
    } catch {
      setViewModel({ status: 'error', error: unexpectedMailBridgeError });
    }
  }

  async function loadInitialState() {
    const revision = syncProgressRevision.current;
    const initialStatusRevision = statusRevision.current;
    try {
      const [status, syncProgress, startOnLogin, email] = await Promise.all([
        globalThis.window.electron.mailBridge.getStatus(),
        globalThis.window.electron.mailBridge.getSyncProgress(),
        globalThis.window.electron.mailBridge.getStartOnLogin(),
        globalThis.window.electron.mailBridge.getEmail(),
      ]);
      if (initialStatusRevision === statusRevision.current) applyStatus(status);
      // Live events can arrive while the initial IPC requests are pending.
      if (revision === syncProgressRevision.current) setSyncProgress(syncProgress);
      setIsStartOnLoginEnabled(startOnLogin);
      applyMailAccountEmail(email);
    } catch {
      setViewModel({ status: 'error', error: unexpectedMailBridgeError });
    } finally {
      setIsLoadingInitialStatus(false);
    }
  }

  const currentViewModel = viewModel.status === 'running' && syncProgress ? { ...viewModel, syncProgress } : viewModel;

  return {
    viewModel: currentViewModel,
    accountEmail,
    isLoadingInitialStatus,
    isStartOnLoginEnabled,
    setStartOnLogin,
    activate,
    turnOff,
    retry,
    resync,
  };
}
