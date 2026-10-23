import { createLogger } from '../../../apps/shared/logger/logger';

export type { MailBridgeClientCredentials, MailBridgeSession } from '@internxt/drive-desktop-core/build/backend/features/mail-bridge';
export const logger = createLogger({ tag: 'MAIL-BRIDGE' });
