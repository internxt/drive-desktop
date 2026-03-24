import { calls, deepMocked, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { waitUntilReady } from './wait-until-ready';
import { open } from 'node:fs/promises';
import * as sleep from '@/apps/main/util';

vi.mock(import('node:fs/promises'));

describe('wait-until-ready', () => {
  const openMock = deepMocked(open);
  const sleepMock = partialSpyOn(sleep, 'sleep');

  const props = mockProps<typeof waitUntilReady>({});

  it('should return true if file is ready to be accessed', async () => {
    // Given
    openMock.mockResolvedValue({ close: vi.fn() });
    // When
    const res = await waitUntilReady(props);
    // Then
    expect(res).toBe(true);
  });

  it('should try to access the file for 60s - 120 attempts', async () => {
    // Given
    openMock.mockRejectedValue(new Error());
    // When
    const res = await waitUntilReady(props);
    // Then
    calls(sleepMock).toHaveLength(120);
    expect(res).toBe(false);
  });
});
