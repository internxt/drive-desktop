import { AbsolutePath } from '../../localFile/infrastructure/AbsolutePath';
import { CLSFsLocalItemsGenerator } from '../infrastructure/FsLocalItemsGenerator';
import LocalTreeBuilder from './LocalTreeBuilder';
import { deepMocked, mockProps } from 'tests/vitest/utils.helper.test';
import { BucketEntry } from '@/context/virtual-drive/shared/domain/BucketEntry';

vi.mock(import('../infrastructure/FsLocalItemsGenerator'));

describe('LocalTreeBuilder', () => {
  const getAllLocalItemsMock = deepMocked(CLSFsLocalItemsGenerator.getAll);
  const addIssue = vi.fn();

  const props = mockProps<typeof LocalTreeBuilder.traverse>({
    context: { addIssue },
    currentFolder: { absolutePath: '' as AbsolutePath },
  });

  it('If file size is 0 it should skip it', async () => {
    // Given
    getAllLocalItemsMock.mockResolvedValueOnce({ files: [{ size: 0 }], folders: [] });

    // When
    await LocalTreeBuilder.traverse(props);

    // Then
    expect(addIssue).not.toHaveBeenCalled();
  });

  it('If file size is too big it should add an issue', async () => {
    // Given
    getAllLocalItemsMock.mockResolvedValueOnce({
      files: [{ size: BucketEntry.MAX_SIZE + 1, path: 'file.txt' as AbsolutePath }],
      folders: [],
    });

    // When
    await LocalTreeBuilder.traverse(props);

    // Then
    expect(addIssue).toHaveBeenCalledWith({
      error: 'FILE_SIZE_TOO_BIG',
      name: 'file.txt',
    });
  });
});
