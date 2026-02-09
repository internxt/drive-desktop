import { Readable, Writable, pipeline } from 'stream';
import { promisify } from 'util';

const promisifiedPipeline = promisify(pipeline);

type Props = {
  stream: Readable;
  onProgress: (bytesWritten: number) => void;
};

export async function readStreamToBuffer({ stream, onProgress }: Props) {
  const bufferArray: any[] = [];
  let bytesWritten = 0;

  const bufferWriter = new Writable({
    write: (chunk, _, callback) => {
      bufferArray.push(chunk);
      bytesWritten += chunk.length;
      onProgress(bytesWritten);

      callback();
    },
  });

  await promisifiedPipeline(stream, bufferWriter);

  return Buffer.concat(bufferArray);
}
