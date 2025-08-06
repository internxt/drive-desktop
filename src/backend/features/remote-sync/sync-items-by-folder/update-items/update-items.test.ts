import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { updateItems } from './update-items';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import * as updateInBoth from './update-in-both';
import * as updateOnlyInDtos from './update-only-in-dtos';
import * as updateOnlyInItems from './update-only-in-items';

describe('update-items', () => {
  const updateInBothMock = partialSpyOn(updateInBoth, 'updateInBoth');
  const updateOnlyInDtosMock = partialSpyOn(updateOnlyInDtos, 'updateOnlyInDtos');
  const updateOnlyInItemsMock = partialSpyOn(updateOnlyInItems, 'updateOnlyInItems');

  it('should not call update functions if there are no items', async () => {
    // Given
    const props = mockProps<typeof updateItems>({ items: [], itemDtos: [] });
    // When
    await updateItems(props);
    // Then
    expect(updateInBothMock).toBeCalledTimes(0);
    expect(updateOnlyInDtosMock).toBeCalledTimes(0);
    expect(updateOnlyInItemsMock).toBeCalledTimes(0);
  });

  it('should call updateInBoth if the item exists locally and remotely', async () => {
    // Given
    const props = mockProps<typeof updateItems>({ items: [{ uuid: 'uuid1' as FileUuid }], itemDtos: [{ uuid: 'uuid1' as FileUuid }] });
    // When
    await updateItems(props);
    // Then
    expect(updateInBothMock).toBeCalledTimes(1);
    expect(updateOnlyInDtosMock).toBeCalledTimes(0);
    expect(updateOnlyInItemsMock).toBeCalledTimes(0);
  });

  it('should call updateOnlyInItems if the item exists locally', async () => {
    // Given
    const props = mockProps<typeof updateItems>({ items: [{ uuid: 'uuid1' as FileUuid }], itemDtos: [] });
    // When
    await updateItems(props);
    // Then
    expect(updateInBothMock).toBeCalledTimes(0);
    expect(updateOnlyInItemsMock).toBeCalledTimes(1);
    expect(updateOnlyInDtosMock).toBeCalledTimes(0);
  });

  it('should call updateOnlyInDtos if the item exists remotely', async () => {
    // Given
    const props = mockProps<typeof updateItems>({ items: [], itemDtos: [{ uuid: 'uuid1' as FileUuid }] });
    // When
    await updateItems(props);
    // Then
    expect(updateInBothMock).toBeCalledTimes(0);
    expect(updateOnlyInItemsMock).toBeCalledTimes(0);
    expect(updateOnlyInDtosMock).toBeCalledTimes(1);
  });
});
