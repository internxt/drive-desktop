import { LocalContentsProvider } from '../domain/LocalFileProvider';
import fs from 'fs';
import path from 'path';
import { Contents } from '../domain/Contents';
import { ContentsSize } from '../domain/ContentsSize';
import { ItemMetadata } from '../../shared/domain/ItemMetadata';

export class FSLocalFileProvider implements LocalContentsProvider {
  provide(absoluteFilePath: string) {
    const controller = new AbortController();

    const stream = fs.createReadStream(absoluteFilePath);
    const stats = fs.statSync(absoluteFilePath);

    const size = new ContentsSize(stats.size);

    const absoluteFolderPath = path.dirname(absoluteFilePath);
    const nameWithExtension = path.basename(absoluteFilePath);

    const watcher = fs.watch(absoluteFolderPath, (_, filename) => {
      if (filename !== nameWithExtension) {
        return;
      }

      controller.abort();
    });

    stream.on('end', () => watcher.close());

    const contents = Contents.from(size, stream);

    const metadata = ItemMetadata.from({
      createdAt: Date.now(),
      updatedAt: Date.now(),
      name: nameWithExtension.split('.')[0],
      size: size.value,
      extension: nameWithExtension.split('.')[1],
      type: 'FILE',
    });

    return {
      contents,
      metadata,
      abortSignal: controller.signal,
    };
  }
}
