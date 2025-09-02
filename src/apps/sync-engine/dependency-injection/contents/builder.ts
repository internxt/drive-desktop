import { Environment } from '@internxt/inxt-js/build';
import { ContentsContainer } from './ContentsContainer';
import { ContentsDownloader } from '../../../../context/virtual-drive/contents/application/ContentsDownloader';
import { EnvironmentRemoteFileContentsManagersFactory } from '../../../../context/virtual-drive/contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { FSLocalFileWriter } from '../../../../context/virtual-drive/contents/infrastructure/FSLocalFileWriter';
import { getConfig } from '../../config';
import { INTERNXT_CLIENT, INTERNXT_VERSION } from '@/core/utils/utils';

export function buildContentsContainer(): ContentsContainer {
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

  const contentsManagerFactory = new EnvironmentRemoteFileContentsManagersFactory(environment, getConfig().bucket);

  const localWriter = new FSLocalFileWriter();

  const contentsDownloader = new ContentsDownloader(contentsManagerFactory, localWriter);

  return {
    contentsDownloader,
    contentsManagerFactory,
  };
}
