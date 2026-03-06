import { CommonContext } from '@/apps/sync-engine/config';
import { Readable } from 'node:stream';

type Props = {
  ctx: CommonContext;
  buffer: Buffer;
};

export async function uploadThumbnail({ ctx, buffer }: Props) {
  const source = new Readable({
    read() {
      this.push(buffer);
      this.push(null);
    },
  });

  // eslint-disable-next-line @typescript-eslint/await-thenable
  return await ctx.environment.upload(ctx.bucket, {
    fileSize: buffer.byteLength,
    source,
    progressCallback: () => {},
  });
}
