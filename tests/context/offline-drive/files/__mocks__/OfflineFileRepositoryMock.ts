import {
  OfflineFile,
  OfflineFileAttributes,
} from '../../../../../src/context/offline-drive/files/domain/OfflineFile';
import { OfflineFileRepository } from '../../../../../src/context/offline-drive/files/domain/OfflineFileRepository';

export class OfflineFileRepositoryMock implements OfflineFileRepository {
  public saveMock = jest.fn();
  public searchByPartialMock = jest.fn();
  public deleteMock = jest.fn();

  save(file: OfflineFile): Promise<void> {
    return this.saveMock(file);
  }
  searchByPartial(
    partial: Partial<OfflineFileAttributes>
  ): Promise<OfflineFile | undefined> {
    return this.searchByPartialMock(partial);
  }
  delete(id: string): Promise<void> {
    return this.deleteMock(id);
  }
}
