import { LocalContentsProvider } from '../domain/LocalFileProvider';
import fs from 'fs';
import path from 'path';
import { LocalFileContents } from '../domain/LocalFileContents';

function extractNameAndExtension(nameWithExtension: string): [string, string] {
  if (nameWithExtension.startsWith('.')) {
    return [nameWithExtension, ''];
  }

  const [name, extension] = nameWithExtension.split('.');

  return [name, extension];
}

export class FSLocalFileProvider implements LocalContentsProvider {
  provide(absoluteFilePath: string) {
    const controller = new AbortController();

    const stream = fs.createReadStream(absoluteFilePath);
    const { size, mtimeMs, birthtimeMs } = fs.statSync(absoluteFilePath);

    const absoluteFolderPath = path.dirname(absoluteFilePath);
    const nameWithExtension = path.basename(absoluteFilePath);

    const watcher = fs.watch(absoluteFolderPath, (_, filename) => {
      if (filename !== nameWithExtension) {
        return;
      }

      controller.abort();
    });

    stream.on('end', () => watcher.close());

    const [name, extension] = extractNameAndExtension(nameWithExtension);

    const contents = LocalFileContents.from({
      name,
      extension,
      size,
      modifiedTime: mtimeMs,
      birthTime: birthtimeMs,
      contents: stream,
    });

    return {
      contents,
      abortSignal: controller.signal,
    };
  }
}
