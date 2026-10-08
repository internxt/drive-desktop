import { createMailClient, prepareMailBridgeSession } from '@internxt/drive-desktop-core/build/backend/features/mail-bridge';
import { obtainToken } from '../../../apps/main/auth/service';
import type { User } from '../../../apps/main/types';
import { INTERNXT_CLIENT, INTERNXT_VERSION } from '../../../core/utils/utils';
import { logger } from './constants';
import { getOrCreateMailBridgeCredentials } from './get-or-create-mail-bridge-credentials';

export async function createMailBridgeSession(user: User) {
  logger.debug({ msg: 'Preparing Mail Bridge session' });
  const { data: credentials, error } = getOrCreateMailBridgeCredentials(user);
  if (error) {
    logger.error({ msg: 'Mail Bridge credentials could not be prepared', error });
    return { error, data: undefined };
  }

  try {
    const token = obtainToken();
    const mailClient = createMailClient({
      gatewayUrl: process.env.DRIVE_URL,
      clientName: INTERNXT_CLIENT,
      clientVersion: INTERNXT_VERSION,
      desktopHeader: process.env.DESKTOP_HEADER,
      token,
    });
    const result = await prepareMailBridgeSession({
      accountId: user.uuid,
      token,
      mnemonic: user.mnemonic,
      mailClient: credentials,
      getMailAccountKeys: mailClient.getMailAccountKeys,
    });
    if (result.error) {
      logger.error({ msg: 'Mail Bridge session preparation failed', error: result.error });
    }
    logger.debug({ msg: 'Mail Bridge session prepared' });
    return result;
  } catch (error) {
    const sessionError = error instanceof Error ? error : new Error(String(error));
    logger.error({ msg: 'Mail Bridge session preparation threw', error: sessionError });
    return { data: undefined, error: sessionError };
  }
}
