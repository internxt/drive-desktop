import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as getFileMirrors from './get-file-mirrors';
import { replaceMirror } from './replace-mirror';

describe('replace-mirror', () => {
  const getFileMirrorsMock = partialSpyOn(getFileMirrors, 'getFileMirrors');

  const props = mockProps<typeof replaceMirror>({});

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return mirror is ok', async () => {
    // Given
    getFileMirrorsMock.mockResolvedValueOnce([{ farmer: {} }]);
    getFileMirrorsMock.mockResolvedValueOnce([{ farmer: { nodeID: 'nodeID', port: 1, address: 'address' } }]);
    // When
    const res = await replaceMirror(props);
    // Then
    expect(getFileMirrorsMock).toBeCalledTimes(2);
    expect(res).toStrictEqual({ farmer: { nodeID: 'nodeID', port: 1, address: 'address' } });
  });
});
