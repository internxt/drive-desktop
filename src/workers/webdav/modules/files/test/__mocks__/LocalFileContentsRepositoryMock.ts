import { Readable } from 'stream';
import { LocalFileConentsRepository } from '../../domain/LocalFileContentsRepository';

export class LocalFileConentsRepositoryMock
  implements LocalFileConentsRepository
{
  existsMock = jest.fn();
  readMock = jest.fn();
  writeMock = jest.fn();
  deleteMock = jest.fn();

  exists(fileId: string): Promise<boolean> {
    return this.existsMock(fileId);
  }
  read(fileId: string): Readable {
    return this.readMock(fileId);
  }
  write(fileId: string, content: Readable): Promise<void> {
    return this.writeMock(fileId, content);
  }
  delete(fileId: string): Promise<void> {
    return this.deleteMock(fileId);
  }
}
