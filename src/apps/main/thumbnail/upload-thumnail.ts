import { CommonContext } from '@/apps/sync-engine/config';
import { Readable } from 'node:stream';

type Props = {
  ctx: CommonContext;
  buffer: Buffer;
};

export function uploadThumbnail({ ctx, buffer }: Props) {
  const source = new Readable({
    read() {
      this.push(buffer);
      this.push(null);
    },
  });

  return new Promise<string>((resolve, reject) => {
    ctx.environment.upload(ctx.bucket, {
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
