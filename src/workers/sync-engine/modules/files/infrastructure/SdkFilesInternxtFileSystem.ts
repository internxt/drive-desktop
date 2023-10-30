import { Storage } from '@internxt/sdk/dist/drive/storage';
import { EncryptionVersion } from '@internxt/sdk/dist/drive/storage/types';
import * as uuid from 'uuid';
import { Crypt } from '../../shared/domain/Crypt';
import { File, FileAttributes } from '../domain/File';
import { FileInternxtFileSystem } from '../domain/FileInternxtFileSystem';
import { FileStatuses } from '../domain/FileStatus';
import { OfflineFile } from '../domain/OfflineFile';

export class SdkFilesInternxtFileSystem implements FileInternxtFileSystem {
  constructor(
    private readonly sdk: Storage,
    private readonly crypt: Crypt,
    private readonly bucket: string
  ) {}

  async trash(file: File): Promise<void> {
    await this.sdk.addItemsToTrash({
      items: [
        {
          type: 'file',
          id: file.contentsId,
        },
      ],
    });
  }
  async create(offlineFile: OfflineFile): Promise<FileAttributes> {
    const encryptedName = this.crypt.encryptName(
      offlineFile.name,
      offlineFile.folderId.toString()
    );

    if (!encryptedName) {
      throw new Error('Failed to encrypt name');
    }
    const data = await this.sdk.createFileEntry({
      id: offlineFile.contentsId,
      type: offlineFile.type,
      size: offlineFile.size,
      name: encryptedName,
      plain_name: offlineFile.name,
      bucket: this.bucket,
      folder_id: offlineFile.folderId,
      encrypt_version: EncryptionVersion.Aes03,
    });

    return {
      contentsId: data.fileId,
      folderId: data.folderId,
      createdAt: data.createdAt,
      modificationTime: data.updatedAt,
      path: offlineFile.path.value,
      size: offlineFile.size,
      updatedAt: data.updatedAt,
      status: FileStatuses.EXISTS,
    };
  }
  async rename(file: File): Promise<void> {
    await this.sdk.updateFile({
      fileId: file.contentsId,
      bucketId: this.bucket,
      destinationPath: uuid.v4(),
      metadata: {
        itemName: file.name,
      },
    });
  }
  async move(file: File): Promise<void> {
    await this.sdk.moveFile({
      fileId: file.contentsId,
      destination: file.folderId,
      destinationPath: uuid.v4(),
      bucketId: this.bucket,
    });
  }
}
