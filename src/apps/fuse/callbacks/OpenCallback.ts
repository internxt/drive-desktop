import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import Logger from 'electron-log';
import { FuseCallback } from './FuseCallback';
import { FuseIOError, FuseNoSuchFileOrDirectoryError } from './FuseErrors';
import { OfflineDriveDependencyContainer } from '../dependency-injection/offline/OfflineDriveDependencyContainer';

export class OpenCallback extends FuseCallback<number> {
  private readonly fileDescriptors = new Map<string, number>();
  private lastFileDescriptor = 0;

  constructor(
    private readonly virtual: VirtualDriveDependencyContainer,
    private readonly offline: OfflineDriveDependencyContainer
  ) {
    super('Open', { input: true, output: true });
  }

  private nextFileDescriptor(): number {
    const next = this.lastFileDescriptor + 1;
    this.lastFileDescriptor = next;

    return next;
  }

  private getFileDescriptor(path: string): number {
    const fileDescriptor = this.fileDescriptors.get(path);

    if (fileDescriptor) {
      return fileDescriptor;
    }

    const nextFileDescriptor = this.nextFileDescriptor();

    this.fileDescriptors.set(path, nextFileDescriptor);

    return nextFileDescriptor;
  }

  async execute(path: string, _flags: Array<any>) {
    const virtual = await this.virtual.filesSearcher.run({ path });

    if (!virtual) {
      const offline = await this.offline.offlineFileSearcher.run({ path });
      if (offline) {
        const fileDescriptor = this.getFileDescriptor(path);
        return this.right(fileDescriptor);
      }
      return this.left(new FuseNoSuchFileOrDirectoryError(path));
    }

    try {
      await this.virtual.downloadContentsToPlainFile.run(virtual);

      return this.right(virtual.id);
    } catch (err: unknown) {
      Logger.error('Error downloading file: ', err);
      if (err instanceof Error) {
        return this.left(new FuseIOError());
      }
      return this.left(new FuseIOError());
    }
  }
}
