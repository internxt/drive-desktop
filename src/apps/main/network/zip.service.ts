/* TODO: DELTE DEAD CODE */
import { AsyncZipDeflate, Zip } from 'fflate';
import { ReadableStream, WritableStream } from 'node:stream/web';

type FlatFolderZipOpts = {
  abortController?: AbortController;
  progress?: (loadedBytes: number) => void;
};

type AddFileToZipFunction = (
  name: string,
  source: ReadableStream<Uint8Array>
) => void;

type AddFolderToZipFunction = (name: string) => void;

export interface ZipStream {
  addFile: AddFileToZipFunction;
  addFolder: AddFolderToZipFunction;
  stream: ReadableStream<Uint8Array>;
  end: () => void;
}

export class FlatFolderZip {
  private finished!: Promise<void>;
  private zip: ZipStream;
  private passThrough: ReadableStream<Uint8Array>;
  private abortController?: AbortController;

  constructor(
    destination: WritableStream<Uint8Array>,
    opts: FlatFolderZipOpts
  ) {
    this.zip = createFolderWithFilesWritable(opts.progress);
    this.abortController = opts.abortController;

    this.passThrough = this.zip.stream;

    this.finished = this.passThrough.pipeTo(destination, {
      signal: opts.abortController?.signal,
    });
  }

  addFile(name: string, source: ReadableStream<Uint8Array>): void {
    if (this.abortController?.signal.aborted) return;

    this.zip.addFile(name, source);
  }

  addFolder(name: string): void {
    if (this.abortController?.signal.aborted) return;

    this.zip.addFolder(name);
  }

  async close(): Promise<void> {
    if (this.abortController?.signal.aborted) return;

    this.zip.end();

    await this.finished;
  }

  abort(): void {
    this.abortController?.abort();
  }
}

export function createFolderWithFilesWritable(
  progress?: FlatFolderZipOpts['progress']
): ZipStream {
  const zip = new Zip();
  let passthroughController: ReadableStreamDefaultController<Uint8Array> | null =
    null;

  const passthrough = new ReadableStream<Uint8Array>({
    start(controller) {
      passthroughController = controller;
    },
    cancel() {
      if (passthroughController) {
        try {
          passthroughController.close();
        } catch (err) {
          /* noop */
        }
        passthroughController = null;
      }
    },
  });

  zip.ondata = (err, data, final) => {
    if (err) {
      console.error('Error in ZIP data event:', err);
      return;
    }

    if (data) {
      passthroughController?.enqueue(data);
    }

    if (final) {
      passthroughController?.close();
      passthroughController = null;
    }
  };

  let processedSize = 0;

  // todo: abort with .terminate()
  return {
    addFile: (name: string, source: ReadableStream<Uint8Array>): void => {
      const writer = new AsyncZipDeflate(name, {
        level: 0,
      });

      zip.add(writer);

      source.pipeTo(
        new WritableStream({
          write(chunk) {
            processedSize += chunk.length;

            progress?.(processedSize);

            writer.push(chunk, false);
          },
          close() {
            writer.push(new Uint8Array(0), true);
          },
        })
      );
    },
    addFolder: (name: string): void => {
      const writer = new AsyncZipDeflate(name + '/', {
        level: 0,
      });
      zip.add(writer);
      writer.push(new Uint8Array(0), true);
    },
    stream: passthrough,
    end: () => {
      zip.end();
    },
  };
}
