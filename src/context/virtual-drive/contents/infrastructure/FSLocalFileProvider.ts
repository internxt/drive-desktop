import Logger from 'electron-log';
import { createReadStream, promises as fs, watch } from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { LocalFileContents } from '../domain/LocalFileContents';
import { LocalContentsProvider } from '../domain/LocalFileProvider';

function extractNameAndExtension(nameWithExtension: string): [string, string] {
  if (nameWithExtension.startsWith('.')) {
    return [nameWithExtension, ''];
  }

  const [name, extension] = nameWithExtension.split('.');

  return [name, extension];
}

export class FSLocalFileProvider implements LocalContentsProvider {
  private reading = new Map<string, AbortController>();

  private createAbortableStream(filePath: string): {
    readable: Readable;
    controller: AbortController;
  } {
    const isBeingRead = this.reading.get(filePath);

    if (isBeingRead) {
      isBeingRead.abort();
    }

    const readStream = createReadStream(filePath);

    const controller = new AbortController();

    this.reading.set(filePath, controller);

    return { readable: readStream, controller };
  }

  async provide(absoluteFilePath: string) {
    const { readable, controller } =
      this.createAbortableStream(absoluteFilePath);

    const { size, mtimeMs, birthtimeMs } = await fs.stat(absoluteFilePath);

    const absoluteFolderPath = path.dirname(absoluteFilePath);
    const nameWithExtension = path.basename(absoluteFilePath);

    const watcher = watch(absoluteFolderPath, (_, filename) => {
      if (filename !== nameWithExtension) {
        return;
      }
      Logger.warn(
        filename,
        ' has been changed during read, it will be aborted'
      );

      controller.abort();
    });

    readable.on('end', () => {
      watcher.close();
      this.reading.delete(absoluteFilePath);
    });

    readable.on('close', () => {
      this.reading.delete(absoluteFilePath);
    });

    const [name, extension] = extractNameAndExtension(nameWithExtension);

    const contents = LocalFileContents.from({
      name,
      extension,
      size,
      modifiedTime: mtimeMs,
      birthTime: birthtimeMs,
      contents: readable,
    });

    return {
      contents,
      abortSignal: controller.signal,
    };
  }
}
