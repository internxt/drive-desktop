import { File } from '../domain/File';
import { NodeWinLocalFileSystem } from '../infrastructure/NodeWinLocalFileSystem';
export class FilesPlaceholderDeleter {
  constructor(private readonly local: NodeWinLocalFileSystem) {}

  private async hasToBeDeleted(remote: File): Promise<boolean> {
    const localUUID = await this.local.getFileIdentity(remote.path);

    if (!localUUID) {
      return false;
    }

    return localUUID.split(':')[1]?.trim() === remote['contentsId']?.trim();
  }

  private async delete(remote: File): Promise<void> {
    const hasToBeDeleted = await this.hasToBeDeleted(remote);
    if (hasToBeDeleted) {
      await this.local.deleteFileSyncRoot(remote.path);
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
