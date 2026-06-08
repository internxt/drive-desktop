import { partialSpyOn } from '../../../../../tests/vitest/utils.helper';
import { DriveServerError } from '../../../../infra/drive-server/drive-server.error';
import * as createFileModule from '../../../../infra/drive-server/services/files/services/create-file';
import { BucketEntryIdMother } from '../../shared/domain/__test-helpers__/BucketEntryIdMother';
import { FileFolderId } from '../domain/FileFolderId';
import { FilePath } from '../domain/FilePath';
import { FileSize } from '../domain/FileSize';
import { SDKRemoteFileSystem } from './SDKRemoteFileSystem';

describe('SDKRemoteFileSystem', () => {
  const createFileMock = partialSpyOn(createFileModule, 'createFile');

  const dataToPersist = {
    contentsId: BucketEntryIdMother.random(),
    path: new FilePath('/folder/pet.png'),
    size: new FileSize(100),
    folderId: new FileFolderId(42),
    folderUuid: 'folder-uuid',
  };

  const fileResponse = {
    id: 1,
    uuid: 'file-uuid',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sut = new SDKRemoteFileSystem('bucket-id');

  it('maps SERVER_ERROR to INTERNAL_SERVER_ERROR', async () => {
    createFileMock.mockResolvedValue({ error: new DriveServerError('SERVER_ERROR', 500, 'Server failed') });

    const result = await sut.persist(dataToPersist);

    expect(result.isLeft()).toBe(true);
    expect(result.getLeft().cause).toBe('INTERNAL_SERVER_ERROR');
    expect(result.getLeft().message).toBe('Server failed');
  });

  it('maps TOO_MANY_REQUESTS to RATE_LIMITED using retry_after', async () => {
    createFileMock.mockResolvedValue({
      error: new DriveServerError('TOO_MANY_REQUESTS', 429, JSON.stringify({ retry_after: 30 })),
    });

    const result = await sut.persist(dataToPersist);

    expect(result.isLeft()).toBe(true);
    expect(result.getLeft().cause).toBe('RATE_LIMITED');
    expect(result.getLeft().message).toBe('30000');
  });

  it('uses fallback delay when TOO_MANY_REQUESTS does not include retry_after', async () => {
    createFileMock.mockResolvedValue({ error: new DriveServerError('TOO_MANY_REQUESTS', 429, 'not-json') });

    const result = await sut.persist(dataToPersist);

    expect(result.isLeft()).toBe(true);
    expect(result.getLeft().cause).toBe('RATE_LIMITED');
    expect(result.getLeft().message).toBe('30000');
  });

  it('maps FILE_TOO_BIG to FILE_TOO_BIG', async () => {
    createFileMock.mockResolvedValue({ error: new DriveServerError('FILE_TOO_BIG', 402, 'too large') });

    const result = await sut.persist(dataToPersist);

    expect(result.isLeft()).toBe(true);
    expect(result.getLeft().cause).toBe('FILE_TOO_BIG');
    expect(result.getLeft().message).toBe('too large');
  });

  it('returns persisted file data on success', async () => {
    createFileMock.mockResolvedValue({ data: fileResponse });

    const result = await sut.persist(dataToPersist);

    expect(result.isRight()).toBe(true);
    expect(result.getRight()).toMatchObject({
      id: fileResponse.id,
      uuid: fileResponse.uuid,
      createdAt: fileResponse.createdAt,
      modificationTime: fileResponse.updatedAt,
    });
  });
});
