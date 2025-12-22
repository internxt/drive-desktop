import { Container } from 'diod';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { TemporalFileByPathFinder } from '../../../../context/storage/TemporalFiles/application/find/TemporalFileByPathFinder';
import { FirstsFileSearcher } from '../../../../context/virtual-drive/files/application/search/FirstsFileSearcher';
import { Optional } from '../../../../shared/types/Optional';
import { TemporalFileChunkReader } from '../../../../context/storage/TemporalFiles/application/read/TemporalFileChunkReader';
import { StorageFileChunkReader } from '../../../../context/storage/StorageFiles/application/read/StorageFileChunkReader';
import { CacheStorageFile } from '../../../../context/storage/StorageFiles/application/offline/CacheStorageFile';
import { shouldDownload } from './open-flags-tracker';

import Fuse from '@gcas/fuse';

export class ReadCallback {
  constructor(private readonly container: Container) {}

  private async read(path: string, contentsId: string, buffer: Buffer, length: number, position: number) {
    try {
      const readResult = await this.container.get(StorageFileChunkReader).run(contentsId, length, position);

      if (readResult.isPresent()) {
        const chunk = readResult.get();
        chunk.copy(buffer);
        logger.debug({ msg: '[ReadCallback] Read from cache:', path, length });
        return chunk.length;
      }
    } catch (error) {
      logger.debug({ msg: '[ReadCallback] File not in cache:', path });
    }

    if (!shouldDownload(path)) {
      logger.debug({ msg: '[ReadCallback] Download blocked - system open (thumbnail):', path });
      return 0;
    }

    logger.debug({ msg: '[ReadCallback] Downloading file on-demand:', path });
    await this.container.get(CacheStorageFile).run(path);

    const readResultAfterDownload = await this.container.get(StorageFileChunkReader).run(contentsId, length, position);

    if (!readResultAfterDownload.isPresent()) {
      logger.error({ msg: '[ReadCallback] File not available after download:', path });
      return 0;
    }

    const chunk = readResultAfterDownload.get();
    chunk.copy(buffer);
    logger.debug({ msg: '[ReadCallback] Read after download:', path, length });
    return chunk.length;
  }

  private async copyToBuffer(buffer: Buffer, bufferOptional: Optional<Buffer>) {
    if (!bufferOptional.isPresent()) {
      return 0;
    }

    const chunk = bufferOptional.get();

    chunk.copy(buffer);
    return chunk.length;
  }

  async execute(
    path: string,
    _fd: any,
    buf: Buffer,
    len: number,
    pos: number,
    cb: (code: number, params?: any) => void,
  ) {
    try {
      const virtualFile = await this.container.get(FirstsFileSearcher).run({
        path,
      });

      if (!virtualFile) {
        const document = await this.container.get(TemporalFileByPathFinder).run(path);

        if (!document) {
          logger.error({ msg: 'READ FILE NOT FOUND', path });
          cb(Fuse.ENOENT);
          return;
        }

        const chunk = await this.container.get(TemporalFileChunkReader).run(document.path.value, len, pos);

        const result = await this.copyToBuffer(buf, chunk);

        cb(result);
        return;
      }

      const bytesRead = await this.read(path, virtualFile.contentsId, buf, len, pos);
      cb(bytesRead);
    } catch (err) {
      logger.error({ msg: '[ReadCallback] Error reading file:', error: err, path });
      cb(Fuse.EIO);
    }
  }
}
