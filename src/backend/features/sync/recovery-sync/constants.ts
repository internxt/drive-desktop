import { createLogger } from '@/apps/shared/logger/logger';

export const EPOCH = '1970-01-01T00:00:00.000Z';
export const recoverySynclogger = createLogger({ tag: 'RECOVERY-SYNC' });
