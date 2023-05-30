import { Axios } from 'axios';
import { WebdavFile } from '../domain/WebdavFile';
import { WebdavFileDeletionQueue } from '../domain/WebdavFileDeletionQueue';

type FileId = string;
type FolderId = number;

export class InMemoryWebdavFileDeletionQueue
  implements WebdavFileDeletionQueue
{
  private queues: Record<FolderId, Array<FileId>> = {};

  constructor(private readonly trashHttpClient: Axios) {}

  add(file: WebdavFile): void {
    const queue = this.queues[file.folderId];

    if (!queue) {
      this.queues[file.folderId] = [file.fileId];
      return;
    }

    this.queues[file.folderId].push(file.fileId);
  }
  async commit(folderId: number): Promise<void> {
    const queue = this.queues[folderId];

    if (!queue) {
      throw new Error(`File deletion queue for folder ${folderId} not found`);
    }

    const deleteFile = async (fileId: string) => {
      const result = await this.trashHttpClient.post(
        `${process.env.NEW_DRIVE_URL}/drive/storage/trash/add`,
        {
          items: [
            {
              type: 'file',
              id: fileId,
            },
          ],
        }
      );

      if (result.status !== 200) {
        throw new Error(`File ${fileId} could not be trashed`);
      }
    };

    const promises = queue.map(deleteFile);

    await Promise.allSettled(promises);
  }
}
