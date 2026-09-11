import { obtainToken } from '../../../apps/main/auth/service';
import type { User } from '../../../apps/main/types';
import type { MailBridgeSession } from './constants';
import { getOrCreateMailBridgeCredentials } from './get-or-create-mail-bridge-credentials';

export function createMailBridgeSession(user: User): { data: MailBridgeSession } | { error: Error } {
  const { data: credentials, error } = getOrCreateMailBridgeCredentials(user);
  if (error) return { error };

  return {
    data: {
      account_id: user.uuid,
      addresses: [user.email],
      backend_session: {
        token: obtainToken(),
        encryption_private_key: user.privateKey,
      },
      mail_client: credentials,
    },
  };
}
