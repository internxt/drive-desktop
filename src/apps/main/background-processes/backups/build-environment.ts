import { INTERNXT_CLIENT, INTERNXT_VERSION } from '@/core/utils/utils';
import { InxtJs } from '@/infra';
import { Environment } from '@internxt/inxt-js';
import { User } from '../../types';

type Props = {
  bridgeUser: string;
  bridgePass: string;
  mnemonic: string;
  bucket: string;
};

export function buildEnvironment({ bridgeUser, bridgePass, mnemonic, bucket }: Props) {
  const environment = new Environment({
    bridgeUrl: process.env.BRIDGE_URL,
    bridgeUser,
    bridgePass,
    encryptionKey: mnemonic,
    appDetails: {
      clientName: INTERNXT_CLIENT,
      clientVersion: INTERNXT_VERSION,
      desktopHeader: process.env.DESKTOP_HEADER,
    },
  });

  const contentsDownloader = new InxtJs.ContentsDownloader(environment, bucket);

  return { environment, contentsDownloader };
}

export function buildUserEnvironment({ user, type }: { user: User; type: 'drive' | 'backups' }) {
  return buildEnvironment({
    bucket: type === 'drive' ? user.bucket : user.backupsBucket,
    mnemonic: user.mnemonic,
    bridgeUser: user.bridgeUser,
    bridgePass: user.userId,
  });
}
