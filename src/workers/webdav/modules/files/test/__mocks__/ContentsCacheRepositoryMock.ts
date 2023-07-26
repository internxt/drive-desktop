import { Readable } from 'stream';
import { ContentsCacheRepository } from '../../domain/ContentsCacheRepository';

export class ContentsCacheRepositoryMock implements ContentsCacheRepository {
  existsMock = jest.fn();
  readMock = jest.fn();
  writeMock = jest.fn();
  deleteMock = jest.fn();
  usageMock = jest.fn();

  exists(fileId: string): boolean {
    return this.existsMock(fileId);
  }
  read(fileId: string): Readable {
    return this.readMock(fileId);
  }
  write(fileId: string, content: Readable, size: number): Promise<void> {
    return this.writeMock(fileId, content, size);
  }
  delete(fileId: string): Promise<void> {
    return this.deleteMock(fileId);
  }
  usage(): Promise<number> {
    return this.usageMock();
  }
}
