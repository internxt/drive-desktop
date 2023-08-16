import { DependencyContainer } from './dependencyInjection/DependencyContainer';
import { File } from './modules/files/domain/File';
import path from 'path';
import { VirtualDrive } from './Addon';

export class BindingsManager {
  private static readonly PROVIDER_NAME = 'Internxt';

  constructor(
    private readonly drive: VirtualDrive,
    private readonly container: DependencyContainer,
    private readonly drivePath: string
  ) {}

  private listFiles() {
    const files = this.container.fileSearcher.run();

    files.forEach((file: File) => {
      this.drive.createPlaceholderFile(
        file.nameWithExtension,
        file.contentsId,
        file.size,
        this.drive.PLACEHOLDER_ATTRIBUTES.FILE_ATTRIBUTE_READONLY,
        file.createdAt.getUTCMilliseconds(),
        file.updatedAt.getUTCMilliseconds(),
        file.updatedAt.getUTCMilliseconds(),
        // This should be the last access time but we don't store the last accessed time
        path.join(this.drivePath, file.path.value)
      );
    });
  }

  up(providerId: string, version: string) {
    this.drive.registerSyncRoot(
      this.drivePath,
      BindingsManager.PROVIDER_NAME,
      version,
      providerId
    );

    this.listFiles();

    this.drive.watchAndWait(this.drivePath);
  }

  down() {
    this.drive.unregisterSyncRoot(this.drivePath);
  }
}
