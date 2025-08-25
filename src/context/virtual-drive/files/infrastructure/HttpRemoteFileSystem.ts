import { EncryptionVersion } from '@internxt/sdk/dist/drive/storage/types';
import { OfflineFileAttributes } from '../domain/OfflineFile';
import { logger } from '@/apps/shared/logger/logger';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { basename } from 'path';
import { getNameAndExtension } from '../domain/get-name-and-extension';
import VirtualDrive from '@/node-win/virtual-drive';
import { restoreParentFolder } from './restore-parent-folder';
import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

export class HttpRemoteFileSystem {
  constructor(
    private readonly bucket: string,
    private readonly workspaceId: string,
    private readonly virtualDrive: VirtualDrive,
  ) {}

  static create(offline: {
    bucket: string;
    contentsId: string;
    folderUuid: string;
    path: string;
    size: number;
    workspaceId: string | undefined;
  }) {
    const { name, extension } = getNameAndExtension({ nameWithExtension: basename(offline.path) });

    const body = {
      bucket: offline.bucket,
      fileId: offline.contentsId,
      encryptVersion: EncryptionVersion.Aes03,
      folderUuid: offline.folderUuid,
      plainName: name,
      size: offline.size,
      type: extension,
    };

    return offline.workspaceId
      ? driveServerWip.workspaces.createFileInWorkspace({ body, workspaceId: offline.workspaceId, path: offline.path })
      : driveServerWip.files.createFile({ body, path: offline.path });
  }

  async persist(offline: { contentsId: string; folderUuid: string; path: RelativePath; size: number }) {
    try {
      const { data, error } = await HttpRemoteFileSystem.create({
        ...offline,
        bucket: this.bucket,
        workspaceId: this.workspaceId,
      });

      if (error) {
        if (error.code === 'FOLDER_NOT_FOUND') {
          return await restoreParentFolder({ offline, drive: this.virtualDrive, bucket: this.bucket, workspaceId: this.workspaceId });
        }
        throw error;
      }

      return data;
    } catch (error) {
      logger.error({
        msg: 'Error persisting file',
        exc: error,
      });

      const existingFile = await this.getFileByPath(offline.path);
      logger.debug({
        msg: 'Existing file',
        existingFile,
      });

      if (existingFile) return existingFile;

      throw logger.error({
        msg: 'Failed to persist file and no existing file found',
      });
    }
  }

  async getFileByPath(filePath: string) {
    const response = await driveServerWip.files.getByPath({ path: filePath });

    if (!response.data) {
      logger.error({
        msg: 'Error getting file by path',
        error: response.error,
      });
      return null;
    }

    const data = response.data;
    if (data.status !== 'EXISTS') return null;

    return data;
  }

  async deleteAndPersist(input: { attributes: OfflineFileAttributes; newContentsId: string }) {
    const { attributes, newContentsId } = input;
    if (!newContentsId) {
      throw new Error('Failed to generate new contents id');
    }

    logger.debug({
      msg: `New contents id generated ${newContentsId}, path: ${attributes.path}`,
    });
    await driveServerWip.storage.deleteFile({ fileId: attributes.contentsId });

    logger.debug({
      msg: `Deleted file with contents id ${attributes.contentsId}, path: ${attributes.path}`,
    });

    const delays = [50, 100, 200];
    let isDeleted = false;

    for (const delay of delays) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      const fileCheck = await this.getFileByPath(attributes.path);
      if (!fileCheck) {
        isDeleted = true;
        break;
      }
      logger.debug({
        msg: `File not deleted yet, path: ${attributes.path}`,
      });
    }

    if (!isDeleted) {
      throw new Error(`File deletion not confirmed for path: ${attributes.path} after retries`);
    }

    const persistedFile = await this.persist({ ...attributes, contentsId: newContentsId });
    logger.debug({
      msg: `File persisted with new contents id ${newContentsId}, path: ${attributes.path}`,
    });

    return persistedFile;
  }
}
