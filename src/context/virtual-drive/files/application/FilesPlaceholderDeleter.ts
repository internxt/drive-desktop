import VirtualDrive from '@/node-win/virtual-drive';
import { File } from '../domain/File';

export class FilesPlaceholderDeleter {
  constructor(private readonly virtualDrive: VirtualDrive) {}

  private hasToBeDeleted(remote: File): boolean {
    const placeholderId = this.virtualDrive.getFileIdentity({ path: remote.path });
    const uuid = placeholderId?.split(':')[1]?.trim();
    return uuid === remote.uuid.trim();
  }

  private async delete(remote: File): Promise<void> {
    const hasToBeDeleted = this.hasToBeDeleted(remote);
    if (hasToBeDeleted) {
      await this.virtualDrive.deleteFileSyncRoot({ path: remote.path });
    }
  }

  async run(remotes: File[]): Promise<void> {
    await Promise.all(
      remotes.map(async (remote) => {
        await this.delete(remote);
      }),
    );
  }
}
