import type { MailBridgeSyncProgress } from '@internxt/drive-desktop-core/build/backend/features/mail-bridge';
import { MailBridgeModule } from '@internxt/drive-desktop-core/build/frontend';
import { useEffect, useState } from 'react';
import type { MailBridgeStatus } from '@/backend/features/mail-bridge';

const startErrorMessage = 'Mail Bridge could not start';
const stopErrorMessage = 'Mail Bridge could not stop';

export function useMailBridge() {
  const [viewModel, setViewModel] = useState(() => MailBridgeModule.createInitialViewModel());

  function applyStatus(status: MailBridgeStatus) {
    if (status.status === 'stopped') setViewModel(MailBridgeModule.createInitialViewModel());
    if (status.status === 'starting') setViewModel({ status: 'starting', error: null });
    if (status.status === 'error') setViewModel({ status: 'error', error: status.error });
  }

  function applySyncProgress(syncProgress: MailBridgeSyncProgress | undefined) {
    setViewModel((currentViewModel) => (currentViewModel.status === 'running' ? { ...currentViewModel, syncProgress } : currentViewModel));
  }

  useEffect(() => {
    void loadInitialState();
    const unsubscribeFromStatus = window.electron.mailBridge.onStatusChanged(applyStatus);
    const unsubscribeFromSyncProgress = window.electron.mailBridge.onSyncProgressChanged(applySyncProgress);

    return () => {
      unsubscribeFromStatus();
      unsubscribeFromSyncProgress();
    };
  }, []);

  async function activate() {
    setViewModel({ status: 'starting', error: null });

    try {
      const result = await window.electron.mailBridge.start();
      if (result.error || !result.data) {
        if (result.error?.code === 'mail-not-setup') {
          setViewModel({ status: 'setup-required', error: null });
          return;
        }
        setViewModel({ status: 'error', error: result.error?.message ?? startErrorMessage });
        return;
      }

      setViewModel({ status: 'running', error: null, connection: result.data });
      void window.electron.mailBridge.getSyncProgress().then(applySyncProgress);
    } catch {
      setViewModel({ status: 'error', error: startErrorMessage });
    }
  }

  async function turnOff() {
    try {
      const result = await window.electron.mailBridge.stop();
      if (result.error) {
        setViewModel({ status: 'error', error: result.error });
        return { data: undefined, error: new Error(result.error) };
      }
      return { data: undefined, error: undefined };
    } catch {
      setViewModel({ status: 'error', error: stopErrorMessage });
      return { data: undefined, error: new Error(stopErrorMessage) };
    }
  }

  async function retry() {
    const stopped = await turnOff();
    if (stopped.error) return;
    await activate();
  }

  function resync() {
    void window.electron.mailBridge.resync();
  }

  async function loadInitialState() {
    try {
      const [status, syncProgress] = await Promise.all([
        window.electron.mailBridge.getStatus(),
        window.electron.mailBridge.getSyncProgress(),
      ]);
      applyStatus(status);
      applySyncProgress(syncProgress);
    } catch {
      setViewModel({ status: 'error', error: startErrorMessage });
    }
  }

  return { viewModel, activate, turnOff, retry, resync };
}
