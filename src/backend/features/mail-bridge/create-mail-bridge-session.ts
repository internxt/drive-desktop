import { createMailClient, prepareMailBridgeSession } from '@internxt/drive-desktop-core/build/backend/features/mail-bridge';
import { obtainToken } from '../../../apps/main/auth/service';
import type { User } from '../../../apps/main/types';
import { INTERNXT_CLIENT, INTERNXT_VERSION } from '../../../core/utils/utils';
import { getOrCreateMailBridgeCredentials } from './get-or-create-mail-bridge-credentials';

export async function createMailBridgeSession(user: User) {
  const { data: credentials, error } = getOrCreateMailBridgeCredentials(user);
  if (error) return { error, data: undefined };

  const token = obtainToken();
  const mailClient = createMailClient({
    gatewayUrl: process.env.DRIVE_URL,
    clientName: INTERNXT_CLIENT,
    clientVersion: INTERNXT_VERSION,
    desktopHeader: process.env.DESKTOP_HEADER,
    token,
  });
  return await prepareMailBridgeSession({
    accountId: user.uuid,
    token,
    mnemonic: user.mnemonic,
    mailClient: credentials,
    getMailAccountKeys: mailClient.getMailAccountKeys,
  });
}
