/* eslint-disable no-await-in-loop */
import { Service } from 'diod';
import fs from 'fs';
import { OfflineFile } from '../../files/domain/OfflineFile';
import { OfflineContentsRepository } from '../domain/OfflineContentsRepository';
import { NodeFSOfflineContentsRepository } from '../infrastructure/NodeFSOfflineContentsRepository';

@Service()
export class OfflineContentsByteByByteComparator {
  private static readonly BUFFER_SIZE = 64 * 1024; // 64KB;

  constructor(private readonly repository: OfflineContentsRepository) {}

  async run(path: string, offline: OfflineFile): Promise<boolean> {
    const fd1 = fs.openSync(path, 'r');
    const offlinePath = await (
      this.repository as NodeFSOfflineContentsRepository
    ).filePath(offline.id);
    const fd2 = fs.openSync(offlinePath, 'r');

    try {
      const buffer1 = Buffer.alloc(
        OfflineContentsByteByByteComparator.BUFFER_SIZE
      );
      const buffer2 = Buffer.alloc(
        OfflineContentsByteByByteComparator.BUFFER_SIZE
      );

      let bytesRead1, bytesRead2;

      do {
        bytesRead1 = fs.readSync(
          fd1,
          buffer1,
          0,
          OfflineContentsByteByByteComparator.BUFFER_SIZE,
          null
        );
        bytesRead2 = fs.readSync(
          fd2,
          buffer2,
          0,
          OfflineContentsByteByByteComparator.BUFFER_SIZE,
          null
        );

        if (bytesRead1 !== bytesRead2 || !buffer1.equals(buffer2)) {
          return false;
        }
      } while (bytesRead1 > 0 && bytesRead2 > 0);

      return true;
    } finally {
      fs.closeSync(fd1);
      fs.closeSync(fd2);
    }
  }
}
