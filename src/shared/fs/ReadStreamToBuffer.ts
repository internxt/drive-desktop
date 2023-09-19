import { Readable, Writable, pipeline } from 'stream';
import { promisify } from 'util';
const promisifiedPipeline = promisify(pipeline);

export class ReadStreamToBuffer {
  static async read(stream: Readable): Promise<Buffer> {
    const bufferArray: any[] = [];

    const bufferWritter = new Writable({
      write: (chunk, _, callback) => {
        bufferArray.push(chunk);
        callback();
      },
    });

    await promisifiedPipeline(stream, bufferWritter);

    return Buffer.concat(bufferArray);
  }
}
