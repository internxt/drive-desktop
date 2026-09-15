export { createMailBridgeSession } from './create-mail-bridge-session';
export { createMailBridgeManager } from './manager/create-mail-bridge-manager';
export {
  getMailBridgeStatus,
  startMailBridge,
  stopMailBridge,
  subscribeToMailBridgeStatus,
} from './services/mail-bridge-lifecycle.service';
export type { MailBridgeConnectionSettings, MailBridgeStatus } from './manager/constants';
