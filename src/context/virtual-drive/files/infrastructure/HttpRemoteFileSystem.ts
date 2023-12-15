import { File, FileAttributes } from '../domain/File';
import { RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';
import { Axios } from 'axios';
import Logger from 'electron-log';

export class HttpRemoteFileSystem implements RemoteFileSystem {
    constructor(
        private readonly driveClient: Axios,
    ) {}

    persist(): Promise<FileAttributes> {
        throw new Error('Method not implemented.');
    }
    trash(): Promise<void> {
        throw new Error('Method not implemented.');
    }
    move(): Promise<void> {
        throw new Error('Method not implemented.');
    }
    rename(): Promise<void> {
        throw new Error('Method not implemented.');
    }

    async update(oldContentsId: string, file: File): Promise<void> {
        const result = await this.driveClient.put(
            `${process.env.NEW_DRIVE_URL}/drive/files/${oldContentsId}`,
            {
                fileId: file.contentsId,
                size: file.size,
            }
        );

        if (result.status !== 200) {
            Logger.error(
                '[FILE SYSTEM] File update failed with status: ',
                result.status,
                result.statusText
            );

            throw new Error('Error when updating file');
        }
    }
}
