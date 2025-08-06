import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { updateInBoth } from './update-in-both';
import * as createOrUpdateFile from '../../update-in-sqlite/create-or-update-file';
import * as isItemNewer from './is-item-newer';

describe('update-in-both', () => {
  const isItemNewerMock = partialSpyOn(isItemNewer, 'isItemNewer');
  const createOrUpdateFileMock = partialSpyOn(createOrUpdateFile, 'createOrUpdateFile');

  const props = mockProps<typeof updateInBoth>({ type: 'file' });

  it('should not create or update if item is newer', async () => {
    // Given
    isItemNewerMock.mockReturnValue(true);
    // When
    await updateInBoth(props);
    // Then
    expect(createOrUpdateFileMock).toBeCalledTimes(0);
  });

  it('should create or update if item is not newer', async () => {
    // Given
    isItemNewerMock.mockReturnValue(false);
    // When
    await updateInBoth(props);
    // Then
    expect(createOrUpdateFileMock).toBeCalledTimes(1);
  });
});
