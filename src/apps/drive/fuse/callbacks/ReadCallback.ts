import { Container } from 'diod';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { TemporalFileByPathFinder } from '../../../../context/storage/TemporalFiles/application/find/TemporalFileByPathFinder';
import { FirstsFileSearcher } from '../../../../context/virtual-drive/files/application/search/FirstsFileSearcher';
import { Optional } from '../../../../shared/types/Optional';
import { TemporalFileChunkReader } from '../../../../context/storage/TemporalFiles/application/read/TemporalFileChunkReader';
import { StorageFileChunkReader } from '../../../../context/storage/StorageFiles/application/read/StorageFileChunkReader';

import Fuse from '@gcas/fuse';

export class ReadCallback {
  constructor(private readonly container: Container) {}

  private async read(contentsId: string, buffer: Buffer, length: number, position: number): Promise<number> {
    const readResult = await this.container.get(StorageFileChunkReader).run(contentsId, length, position);

    if (!readResult.isPresent()) {
      return 0;
    }

    const chunk = readResult.get();

    chunk.copy(buffer); // write the result of the read to the result buffer
    return chunk.length; // number of bytes read
  }

  private async copyToBuffer(buffer: Buffer, bufferOptional: Optional<Buffer>) {
    if (!bufferOptional.isPresent()) {
      return 0;
    }

    const chunk = bufferOptional.get();

    chunk.copy(buffer); // write the result of the read to the result buffer
    return chunk.length; // number of bytes read
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

      const bytesRead = await this.read(virtualFile.contentsId, buf, len, pos);
      cb(bytesRead);
    } catch (err) {
      logger.error({ msg: 'Error reading file:', error: err });
      cb(Fuse.EIO);
    }
  }
}
