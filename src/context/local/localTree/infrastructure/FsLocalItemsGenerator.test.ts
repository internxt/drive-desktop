import { TEST_FILES } from 'tests/vitest/mocks.helper.test';
import { CLSFsLocalItemsGenerator } from './FsLocalItemsGenerator';
import { join } from 'path';
import { v4 } from 'uuid';
import { mkdir, rm, writeFile } from 'fs/promises';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { deepMocked, mockProps } from 'tests/vitest/utils.helper.test';
import { mockDeep } from 'vitest-mock-extended';
import { BackupsContext } from '@/apps/backups/BackupInfo';

vi.mock(import('@/apps/main/background-processes/issues'));
vi.mock(import('@/infra/file-system/file-system.module'));

describe('CLSFsLocalItemsGenerator', () => {
  const statMock = deepMocked(fileSystem.stat);

  const folder = join(TEST_FILES, v4());

  const folder1 = join(folder, 'folder1');
  const folder2 = join(folder, 'folder2');
  const folder3 = join(folder, 'folder1', 'folder3');

  const file1 = join(folder, 'file1');
  const file2 = join(folder, 'file2');
  const file3 = join(folder1, 'file3');
  const file4 = join(folder3, 'file4');

  const context = mockDeep<BackupsContext>();
  const props = mockProps<typeof CLSFsLocalItemsGenerator.getAll>({ dir: folder, context });

  beforeAll(async () => {
    await mkdir(folder);
    await mkdir(folder1);
    await mkdir(folder2);
    await mkdir(folder3);
    await writeFile(file1, 'content');
    await writeFile(file2, 'content');
    await writeFile(file3, 'content');
    await writeFile(file4, 'content');
  });

  afterAll(async () => {
    await rm(folder, { recursive: true });
  });

  it('It should add files and folders', async () => {
    // Given
    statMock.mockResolvedValue({ data: { mtime: new Date(), size: 7 } });

    // When
    const res = await CLSFsLocalItemsGenerator.getAll(props);

    // Then
    expect(res).toStrictEqual({
      files: [
        { path: file1, modificationTime: expect.any(Number), size: 7 },
        { path: file2, modificationTime: expect.any(Number), size: 7 },
      ],
      folders: [{ path: folder1 }, { path: folder2 }],
    });
  });

  it('If stat returns an error it should add an issue and continue', async () => {
    // Given
    statMock.mockResolvedValue({ data: { mtime: new Date(), size: 7 } });
    statMock.mockResolvedValueOnce({ error: { code: 'NON_EXISTS' } });

    // When
    const res = await CLSFsLocalItemsGenerator.getAll(props);

    // Then
    expect(context.addIssue).toHaveBeenCalledWith({ name: file1, error: 'FOLDER_DOES_NOT_EXIST' });
    expect(res).toStrictEqual({
      files: [{ path: file2, modificationTime: expect.any(Number), size: 7 }],
      folders: [{ path: folder1 }, { path: folder2 }],
    });
  });
});
