import { BackupInfo } from '@/apps/backups/BackupInfo';
import { getConfig } from '@/apps/sync-engine/config';
import { INTERNXT_CLIENT, INTERNXT_VERSION } from '@/core/utils/utils';
import { EnvironmentFileUploader } from '@/infra/inxt-js/file-uploader/environment-file-uploader';
import { Environment } from '@internxt/inxt-js';

type Props = {
  backupInfo: BackupInfo;
};

export function buildFileUploader({ backupInfo }: Props) {
  const environment = new Environment({
    bridgeUrl: process.env.BRIDGE_URL,
    bridgeUser: getConfig().bridgeUser,
    bridgePass: getConfig().bridgePass,
    encryptionKey: getConfig().mnemonic,
    appDetails: {
      clientName: INTERNXT_CLIENT,
      clientVersion: INTERNXT_VERSION,
      desktopHeader: process.env.DESKTOP_HEADER,
    },
  });

  const fileUploader = new EnvironmentFileUploader(environment, backupInfo.backupsBucket);

  return fileUploader;
}
