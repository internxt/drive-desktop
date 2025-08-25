import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';

export class InMemoryFileRepository {
  private files: Map<string, ExtendedDriveFile>;

  constructor() {
    this.files = new Map();
  }

  searchByContentsIds(contentsIds: string[]) {
    const files = contentsIds
      .map((contentsId) => {
        const file = this.files.get(contentsId);
        return file;
      })
      .filter((file) => file !== undefined);

    return files;
  }

  add(file: ExtendedDriveFile): void {
    this.files.set(file.contentsId, file);
  }
}
