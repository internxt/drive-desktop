import {
  File,
  FileAttributes,
} from '../../../../../src/context/virtual-drive/files/domain/File';
import { FileRepository } from '../../../../../src/context/virtual-drive/files/domain/FileRepository';

export class FileRepositoryMock implements FileRepository {
  public readonly allMock = jest.fn();
  public readonly matchingPartialMock = jest.fn();
  public readonly searchByIdMock = jest.fn();
  public readonly searchByContentsIdMock = jest.fn();
  public readonly deleteMock = jest.fn();
  public readonly addMock = jest.fn();
  public readonly updateMock = jest.fn();

  all(): Promise<File[]> {
    return this.allMock();
  }

  matchingPartial(partial: Partial<FileAttributes>): Array<File> {
    return this.matchingPartialMock(partial);
  }

  searchById(id: number): Promise<File | undefined> {
    return this.searchByIdMock(id);
  }

  searchByContentsId(id: string): Promise<File | undefined> {
    return this.searchByContentsIdMock(id);
  }

  delete(id: string): Promise<void> {
    return this.deleteMock(id);
  }

  add(file: File): Promise<void> {
    return this.addMock(file);
  }

  update(file: File): Promise<void> {
    return this.updateMock(file);
  }
}
