import { calls } from '@/tests/vitest/utils.helper.test';
import { getItemsToSync } from './get-items-to-sync';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { FileProps } from '../recovery-sync.types';

describe('get-items-to-sync', () => {
  let props: FileProps;

  beforeEach(() => {
    props = {
      remotes: [{ uuid: 'uuid', updatedAt: 'datetime' }],
      locals: [{ uuid: 'uuid', updatedAt: 'datetime' }],
    } as FileProps;
  });

  it('should return file if not exists locally', () => {
    // Given
    props.locals = [];
    // When
    const res = getItemsToSync(props);
    // Then
    expect(res).toHaveLength(1);
    calls(loggerMock.error).toMatchObject([{ msg: 'Local file does not exist' }]);
  });

  it('should return file if has different updatedAt', () => {
    // Given
    props.locals[0].updatedAt = 'other';
    // When
    const res = getItemsToSync(props);
    // Then
    expect(res).toHaveLength(1);
    calls(loggerMock.error).toMatchObject([{ msg: 'Local file has a different updatedAt' }]);
  });

  it('should not return file if updatedAt and status are equal', () => {
    // When
    const res = getItemsToSync(props);
    // Then
    expect(res).toHaveLength(0);
    calls(loggerMock.error).toHaveLength(0);
  });
});
