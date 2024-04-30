import {
  File,
  FileAttributes,
} from '../../../../../src/context/virtual-drive/files/domain/File';
import { FileRepository } from '../../../../../src/context/virtual-drive/files/domain/FileRepository';

export class FileRepositoryMock implements FileRepository {
  public readonly allMock = jest.fn();
  public readonly matchingPartialMock = jest.fn();
  public readonly searchByUuidMock = jest.fn();
  public readonly searchByContentsIdMock = jest.fn();
  public readonly deleteMock = jest.fn();
  public readonly addMock = jest.fn();
  public readonly updateMock = jest.fn();
  public readonly clearMock = jest.fn();

  all(): Promise<File[]> {
    return this.allMock();
  }

  matchingPartial(partial: Partial<FileAttributes>): Array<File> {
    return this.matchingPartialMock(partial);
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
