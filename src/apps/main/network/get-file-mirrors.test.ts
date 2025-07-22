import { afterEach, describe, expect, it, vi } from 'vitest';
import { getFileMirrors } from './get-file-mirrors';
import { mockProps } from '@/tests/vitest/utils.helper.test';

describe('get-file-mirrors', () => {
  const props = mockProps<typeof getFileMirrors>({});

  it('should fetch and return mirrors', async () => {
    const mockMirrors = [
      {
        farmer: { nodeID: 'nodeID', port: 1, address: 'address' },
        hash: 'hash1',
        index: 0,
        replaceCount: 0,
        size: 1,
        parity: false,
        token: '',
        url: '',
        operation: '',
      },
    ];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => mockMirrors,
    });

    const result = await getFileMirrors(props);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockMirrors);
  });

  it('should throw if fetch fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => ({}),
    });
    const result = getFileMirrors(props);
    await expect(result).rejects.toThrow('Failed to fetch mirrors: 500 Internal Server Error');
  });
});
