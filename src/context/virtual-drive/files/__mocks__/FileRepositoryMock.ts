import { File, FileAttributes } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';
import { FileStatuses } from '../domain/FileStatus';

export class FileRepositoryMock implements FileRepository {
  public readonly allMock = vi.fn();
  public readonly matchingPartialMock = vi.fn();
  public readonly searchByPathPrefixMock = vi.fn();
  public readonly searchByUuidMock = vi.fn();
  public readonly searchByContentsIdMock = vi.fn();
  public readonly deleteMock = vi.fn();
  public readonly addMock = vi.fn();
  public readonly updateMock = vi.fn();
  public readonly clearMock = vi.fn();

  all(): Promise<File[]> {
    return this.allMock();
  }

  matchingPartial(partial: Partial<FileAttributes>): Array<File> {
    return this.matchingPartialMock(partial);
  }

  searchByPathPrefix(pathPrefix: string, status?: FileStatuses): Array<File> {
    return this.searchByPathPrefixMock(pathPrefix, status);
  }

  searchByUuid(uuid: string): Promise<File | undefined> {
    return this.searchByUuidMock(uuid);
  }

  searchByContentsId(contentsId: string): Promise<File | undefined> {
    return this.searchByContentsIdMock(contentsId);
  }

  delete(id: string): Promise<void> {
    return this.deleteMock(id);
  }

  searchByArrayOfContentsId(contentsIds: Array<File['contentsId']>): Promise<Array<File>> {
    return this.searchByContentsIdMock(...contentsIds);
  }

  upsert(file: File): Promise<boolean> {
    return this.addMock(file);
  }

  update(file: File): Promise<void> {
    return this.updateMock(file);
  }

  clear(): Promise<void> {
    return this.clearMock();
  }
}
