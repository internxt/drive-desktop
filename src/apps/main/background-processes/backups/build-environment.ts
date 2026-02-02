import { INTERNXT_CLIENT, INTERNXT_VERSION } from '@/core/utils/utils';
import { InxtJs } from '@/infra';
import { Environment } from '@internxt/inxt-js';
import { User } from '../../types';
import { Device } from '../../device/service';

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

export function buildDriveEnvironment({ user }: { user: User }) {
  return buildEnvironment({
    bucket: user.bucket,
    mnemonic: user.mnemonic,
    bridgeUser: user.bridgeUser,
    bridgePass: user.userId,
  });
}

export function buildBackupsEnvironment({ user, device }: { user: User; device: Device }) {
  return buildEnvironment({
    bucket: device.bucket,
    mnemonic: user.mnemonic,
    bridgeUser: user.bridgeUser,
    bridgePass: user.userId,
  });
}
