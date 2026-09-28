import { logger, MailBridgeSessionPreparationError } from '@internxt/drive-desktop-core/build/backend';
import { ipcMain } from 'electron';
import type { AuthContext } from '@/apps/sync-engine/config';
import { createMailBridgeSession } from '@/backend/features/mail-bridge/create-mail-bridge-session';
import {
  isMailBridgeStartOnLoginEnabled,
  setMailBridgeStartOnLogin,
} from '@/backend/features/mail-bridge/mail-bridge-start-on-login.service';
import { getMailBridgeEmail } from '@/backend/features/mail-bridge/services/get-mail-bridge-email.service';
import {
  getMailBridgeStatus as getLifecycleMailBridgeStatus,
  getMailBridgeSyncProgress as getLifecycleMailBridgeSyncProgress,
  resyncMailBridge as resyncLifecycleMailBridge,
  startMailBridge as startLifecycleMailBridge,
  stopMailBridge as stopLifecycleMailBridge,
  subscribeToMailBridgeSyncProgress,
  subscribeToMailBridgeStatus,
} from '@/backend/features/mail-bridge/services/mail-bridge.service';
import { getWidget } from '../../../../apps/main/windows/widget';

let unsubscribeFromMailBridgeStatus: (() => void) | undefined;
let unsubscribeFromMailBridgeSyncProgress: (() => void) | undefined;

export function getMailBridgeStatus() {
  return getLifecycleMailBridgeStatus();
}

export function getMailBridgeStartOnLogin() {
  return isMailBridgeStartOnLoginEnabled();
}

export function setMailBridgeStartOnLoginPreference({ enabled }: { enabled: boolean }) {
  setMailBridgeStartOnLogin({ enabled });
}

export async function startMailBridge({ ctx }: { ctx: AuthContext }) {
  const session = await createMailBridgeSession(ctx.user);
  if (session.error) {
    const code = session.error instanceof MailBridgeSessionPreparationError ? session.error.code : 'session-creation-failed';
    logger.error({ msg: 'Mail Bridge session could not be prepared', code, error: session.error });
    return { data: undefined, error: { code, message: session.error.message } };
  }

  const result = await startLifecycleMailBridge(session.data);
  return result.error
    ? { data: undefined, error: { code: 'start-failed', message: result.error.message } }
    : { data: result.data, error: undefined };
}

export async function startMailBridgeOnLogin({ ctx }: { ctx: AuthContext }) {
  if (!isMailBridgeStartOnLoginEnabled()) return;

  const result = await startMailBridge({ ctx });
  if (result.error) logger.warn({ msg: 'Mail Bridge could not start automatically', code: result.error.code });
}

export async function stopMailBridge() {
  const result = await stopLifecycleMailBridge();
  return result.error ? { data: undefined, error: result.error.message } : { data: undefined, error: undefined };
}

export function getMailBridgeSyncProgress() {
  return getLifecycleMailBridgeSyncProgress();
}

export async function resyncMailBridge() {
  const result = await resyncLifecycleMailBridge();
  return result.error ? { data: undefined, error: result.error.message } : { data: undefined, error: undefined };
}

export function setupMailBridgeIpc({ ctx }: { ctx: AuthContext }) {
  unsubscribeFromMailBridgeStatus?.();
  unsubscribeFromMailBridgeStatus = subscribeToMailBridgeStatus((status) => {
    getWidget()?.webContents.send('mail-bridge:status-changed', status);
  });
  unsubscribeFromMailBridgeSyncProgress?.();
  unsubscribeFromMailBridgeSyncProgress = subscribeToMailBridgeSyncProgress((progress) => {
    getWidget()?.webContents.send('mail-bridge:sync-progress-changed', progress);
  });
  ipcMain.handle('mail-bridge:start', () => startMailBridge({ ctx }));
  ipcMain.handle('mail-bridge:get-status', () => getMailBridgeStatus());
  ipcMain.handle('mail-bridge:get-email', () => getMailBridgeEmail());
  ipcMain.handle('mail-bridge:get-start-on-login', () => getMailBridgeStartOnLogin());
  ipcMain.handle('mail-bridge:set-start-on-login', (_, enabled: boolean) => setMailBridgeStartOnLoginPreference({ enabled }));
  ipcMain.handle('mail-bridge:stop', () => stopMailBridge());
  ipcMain.handle('mail-bridge:resync', () => resyncMailBridge());
  ipcMain.handle('mail-bridge:get-sync-progress', () => getMailBridgeSyncProgress());
}

export function clearMailBridgeIpc() {
  unsubscribeFromMailBridgeStatus?.();
  unsubscribeFromMailBridgeStatus = undefined;
  unsubscribeFromMailBridgeSyncProgress?.();
  unsubscribeFromMailBridgeSyncProgress = undefined;
  ipcMain.removeHandler('mail-bridge:start');
  ipcMain.removeHandler('mail-bridge:get-status');
  ipcMain.removeHandler('mail-bridge:get-email');
  ipcMain.removeHandler('mail-bridge:get-start-on-login');
  ipcMain.removeHandler('mail-bridge:set-start-on-login');
  ipcMain.removeHandler('mail-bridge:stop');
  ipcMain.removeHandler('mail-bridge:resync');
  ipcMain.removeHandler('mail-bridge:get-sync-progress');
}
