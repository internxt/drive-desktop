import { VirtualDrive } from '@internxt/node-win';
import { mockDeep } from 'vitest-mock-extended';
import { FilesPlaceholderDeleter } from './FilesPlaceholderDeleter';
import { mockProps } from 'tests/vitest/utils.helper.test';

describe('FilesPlaceholderDeleter', () => {
  const virtualDrive = mockDeep<VirtualDrive>();
  const service = new FilesPlaceholderDeleter(virtualDrive);

  const props = mockProps<FilesPlaceholderDeleter['run']>([{ uuid: 'uuid', path: 'path' }]);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('If file is already deleted, then do not call deleteFileSyncRoot', async () => {
    // Given
    virtualDrive.getFileIdentity.mockReturnValue('');

    // When
    await service.run(props);

    // Then
    expect(virtualDrive.deleteFileSyncRoot).not.toHaveBeenCalled();
  });

  it('If file is not deleted, then call deleteFileSyncRoot', async () => {
    // Given
    virtualDrive.getFileIdentity.mockReturnValue('FILE:uuid');

    // When
    await service.run(props);

    // Then
    expect(virtualDrive.deleteFileSyncRoot).toHaveBeenCalledWith({ path: 'path' });
  });
});
