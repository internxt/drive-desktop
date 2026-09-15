import { ipcMain } from 'electron';
import { logger, MailBridgeSessionPreparationError } from '@internxt/drive-desktop-core/build/backend';
import type { AuthContext } from '@/apps/sync-engine/config';
import { createMailBridgeSession } from '@/backend/features/mail-bridge/create-mail-bridge-session';
import {
  getMailBridgeStatus as getLifecycleMailBridgeStatus,
  startMailBridge as startLifecycleMailBridge,
  stopMailBridge as stopLifecycleMailBridge,
  subscribeToMailBridgeStatus,
} from '@/backend/features/mail-bridge/services/mail-bridge-lifecycle.service';
import { getWidget } from '../../../../apps/main/windows/widget';

let unsubscribeFromMailBridgeStatus: (() => void) | undefined;

export function getMailBridgeStatus() {
  return getLifecycleMailBridgeStatus();
}

export async function startMailBridge({ ctx }: { ctx: AuthContext }) {
  const session = await createMailBridgeSession(ctx.user);
  if (session.error) {
    const code = session.error instanceof MailBridgeSessionPreparationError ? session.error.code : 'session-creation-failed';
    logger.error({ msg: 'Mail Bridge session could not be prepared', code, error: session.error });
    return { data: undefined, error: { code, message: session.error.message } };
  }

  const result = await startLifecycleMailBridge({ session: session.data });
  return result.error ? { data: undefined, error: { code: 'start-failed', message: result.error.message } } : { data: result.data, error: undefined };
}

export async function stopMailBridge() {
  const result = await stopLifecycleMailBridge();
  return result.error ? { data: undefined, error: result.error.message } : { data: undefined, error: undefined };
}

export function setupMailBridgeIpc({ ctx }: { ctx: AuthContext }) {
  unsubscribeFromMailBridgeStatus?.();
  unsubscribeFromMailBridgeStatus = subscribeToMailBridgeStatus({
    listener(status) {
      getWidget()?.webContents.send('mail-bridge:status-changed', status);
    },
  });
  ipcMain.handle('mail-bridge:start', () => startMailBridge({ ctx }));
  ipcMain.handle('mail-bridge:get-status', () => getMailBridgeStatus());
  ipcMain.handle('mail-bridge:stop', () => stopMailBridge());
}

export function clearMailBridgeIpc() {
  unsubscribeFromMailBridgeStatus?.();
  unsubscribeFromMailBridgeStatus = undefined;
  ipcMain.removeHandler('mail-bridge:start');
  ipcMain.removeHandler('mail-bridge:get-status');
  ipcMain.removeHandler('mail-bridge:stop');
}
