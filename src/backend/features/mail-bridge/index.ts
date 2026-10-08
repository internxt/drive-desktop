export { createMailBridgeSession } from './create-mail-bridge-session';
export { isMailBridgeStartOnLoginEnabled, setMailBridgeStartOnLogin } from './mail-bridge-start-on-login.service';
export {
  getMailBridgeStatus,
  getMailBridgeSyncProgress,
  resyncMailBridge,
  startMailBridge,
  stopMailBridge,
  subscribeToMailBridgeStatus,
  updateMailBridgeAccessToken,
} from './services/mail-bridge.service';
export { getMailBridgeEmail } from './services/get-mail-bridge-email.service';
export type { MailBridgeConnectionSettings, MailBridgeStatus } from './mail-bridge.types';
export { clearMailBridgeIpc, setupMailBridgeIpc, startMailBridgeOnLogin } from './ipc/mail-bridge-ipc';
