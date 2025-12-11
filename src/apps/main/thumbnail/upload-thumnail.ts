import { getConfig } from '@/apps/sync-engine/config';
import { INTERNXT_CLIENT, INTERNXT_VERSION } from '@/core/utils/utils';
import { Environment } from '@internxt/inxt-js';
import { Readable } from 'node:stream';

type Props = {
  bucket: string;
  buffer: Buffer;
};

export function uploadThumbnail({ bucket, buffer }: Props) {
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

  const source = new Readable({
    read() {
      this.push(buffer);
      this.push(null);
    },
  });

  return new Promise<string>((resolve, reject) => {
    environment.upload(bucket, {
      fileSize: buffer.byteLength,
      source,
      progressCallback: () => {},
      finishedCallback: (err, id) => {
        if (id) resolve(id);
        else reject(err);
      },
    });
  });
}
