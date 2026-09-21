import type { MailBridgeSyncProgress } from '@internxt/drive-desktop-core/build/backend/features/mail-bridge';
import { MailBridgeModule } from '@internxt/drive-desktop-core/build/frontend';
import { useEffect, useState } from 'react';
import type { MailBridgeStatus } from '@/backend/features/mail-bridge';

const unexpectedMailBridgeError = 'unexpected-mail-bridge-error';

export function useMailBridge() {
  const [viewModel, setViewModel] = useState(() => MailBridgeModule.createInitialViewModel());
  const [isLoadingInitialStatus, setIsLoadingInitialStatus] = useState(true);
  const [isStartOnLoginEnabled, setIsStartOnLoginEnabled] = useState(false);

  function applyStatus(status: MailBridgeStatus) {
    if (status.status === 'stopped') setViewModel(MailBridgeModule.createInitialViewModel());
    if (status.status === 'starting') setViewModel({ status: 'starting', error: null });
    if (status.status === 'running') setViewModel({ status: 'running', error: null, connection: status.connection });
    if (status.status === 'error') setViewModel({ status: 'error', error: status.error });
  }

  function applySyncProgress(syncProgress: MailBridgeSyncProgress | undefined) {
    setViewModel((currentViewModel) => (currentViewModel.status === 'running' ? { ...currentViewModel, syncProgress } : currentViewModel));
  }

  useEffect(() => {
    void loadInitialState();
    const unsubscribeFromStatus = globalThis.window.electron.mailBridge.onStatusChanged(applyStatus);
    const unsubscribeFromSyncProgress = globalThis.window.electron.mailBridge.onSyncProgressChanged(applySyncProgress);

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

      setViewModel({ status: 'running', error: null, connection: result.data });
      void globalThis.window.electron.mailBridge.getSyncProgress().then(applySyncProgress);
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

  function resync() {
    void globalThis.window.electron.mailBridge.resync();
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
    try {
      const [status, syncProgress, startOnLogin] = await Promise.all([
        globalThis.window.electron.mailBridge.getStatus(),
        globalThis.window.electron.mailBridge.getSyncProgress(),
        globalThis.window.electron.mailBridge.getStartOnLogin(),
      ]);
      applyStatus(status);
      applySyncProgress(syncProgress);
      setIsStartOnLoginEnabled(startOnLogin);
    } catch {
      setViewModel({ status: 'error', error: unexpectedMailBridgeError });
    } finally {
      setIsLoadingInitialStatus(false);
    }
  }

  return { viewModel, isLoadingInitialStatus, isStartOnLoginEnabled, setStartOnLogin, activate, turnOff, retry, resync };
}
