import { Environment } from '@internxt/inxt-js/build';
import { ContentsContainer } from './ContentsContainer';
import { ContentsDownloader } from '../../../../context/virtual-drive/contents/application/ContentsDownloader';
import { EnvironmentRemoteFileContentsManagersFactory } from '../../../../context/virtual-drive/contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { FSLocalFileWriter } from '../../../../context/virtual-drive/contents/infrastructure/FSLocalFileWriter';
import { ProcessSyncContext } from '../../config';
import { INTERNXT_CLIENT, INTERNXT_VERSION } from '@/core/utils/utils';

export function buildContentsContainer({ ctx }: { ctx: ProcessSyncContext }): ContentsContainer {
  const environment = new Environment({
    bridgeUrl: process.env.BRIDGE_URL,
    bridgeUser: ctx.bridgeUser,
    bridgePass: ctx.bridgePass,
    encryptionKey: ctx.mnemonic,
    appDetails: {
      clientName: INTERNXT_CLIENT,
      clientVersion: INTERNXT_VERSION,
      desktopHeader: process.env.DESKTOP_HEADER,
    },
  });

  const contentsManagerFactory = new EnvironmentRemoteFileContentsManagersFactory(environment, ctx.bucket);

  const localWriter = new FSLocalFileWriter();

  const contentsDownloader = new ContentsDownloader(contentsManagerFactory, localWriter);

  return {
    contentsDownloader,
    contentsManagerFactory,
  };
}
