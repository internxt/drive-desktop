import { Storage } from '@internxt/sdk/dist/drive/storage';
import { EncryptionVersion } from '@internxt/sdk/dist/drive/storage/types';
import { Crypt } from '../../shared/domain/Crypt';
import { File, FileAttributes } from '../domain/File';
import { FileStatuses } from '../domain/FileStatus';
import { RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';
import { OfflineFile } from '../domain/OfflineFile';
import * as uuid from 'uuid';

export class SDKRemoteFileSystem implements RemoteFileSystem {
  constructor(
    private readonly sdk: Storage,
    private readonly crypt: Crypt,
    private readonly bucket: string
  ) {}

  async persist(offline: OfflineFile): Promise<FileAttributes> {
    const encryptedName = this.crypt.encryptName(
      offline.name,
      offline.folderId.toString()
    );

    if (!encryptedName) {
      throw new Error('Failed to encrypt name');
    }

    const data = await this.sdk.createFileEntry({
      id: offline.contentsId,
      type: offline.type,
      size: offline.size,
      name: encryptedName,
      plain_name: offline.name,
      bucket: this.bucket,
      folder_id: offline.folderId,
      encrypt_version: EncryptionVersion.Aes03,
    });

    return {
      ...data,
      contentsId: data.fileId,
      modificationTime: data.updatedAt,
      path: offline.path,
      status: FileStatuses.EXISTS,
    };
  }

  async trash(contentsId: string): Promise<void> {
    await this.sdk.addItemsToTrash({
      items: [
        {
          type: 'file',
          id: contentsId,
        },
      ],
    });
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
