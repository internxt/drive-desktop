import { open } from 'node:fs/promises';
import * as sleep from '@/apps/main/util';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { StatError } from '@/infra/file-system/services/stat';
import { calls, deepMocked, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { waitUntilReady } from './wait-until-ready';

vi.mock(import('node:fs/promises'));

describe('wait-until-ready', () => {
  const openMock = deepMocked(open);
  const sleepMock = partialSpyOn(sleep, 'sleep');
  const statMock = partialSpyOn(fileSystem, 'stat');

  const props = mockProps<typeof waitUntilReady>({});

  function mockMtimeAdvancing() {
    let mtimeMs = 0;
    statMock.mockImplementation(() => Promise.resolve({ data: { mtimeMs: ++mtimeMs } }));
  }

  beforeEach(() => {
    openMock.mockRejectedValue(new Error());
    statMock.mockResolvedValue({ data: { mtimeMs: 1 } });
  });

  it('should return data if file is ready to be accessed', async () => {
    // Given
    openMock.mockResolvedValue({ close: vi.fn() });
    // When
    const res = await waitUntilReady(props);
    // Then
    expect(res).toStrictEqual({ data: true });
    calls(sleepMock).toHaveLength(0);
  });

  it('should try to access the file for 60s - 120 attempts by default', async () => {
    // When
    const res = await waitUntilReady(props);
    // Then
    calls(sleepMock).toHaveLength(120);
    expect(res.error?.code).toBe('MAX_TIMEOUT');
  });

  it('should keep the default 60s even if the file is being written', async () => {
    // Given
    mockMtimeAdvancing();
    // When
    const res = await waitUntilReady(props);
    // Then
    calls(sleepMock).toHaveLength(120);
    expect(res.error?.code).toBe('MAX_TIMEOUT');
  });

  it('should give up if the file is locked and its mtime does not change during the idle timeout', async () => {
    // When
    const res = await waitUntilReady({ ...props, idleTimeoutMs: 5000, maxWaitMs: 60_000 });
    // Then
    calls(sleepMock).toHaveLength(10);
    expect(res.error?.code).toBe('IDLE_TIMEOUT');
  });

  it('should keep waiting past the idle timeout while the mtime keeps changing', async () => {
    // Given
    mockMtimeAdvancing();
    for (let i = 0; i < 30; i++) openMock.mockRejectedValueOnce(new Error());
    openMock.mockResolvedValueOnce({ close: vi.fn() });
    // When
    const res = await waitUntilReady({ ...props, idleTimeoutMs: 5000, maxWaitMs: 60_000 });
    // Then
    calls(sleepMock).toHaveLength(30);
    expect(res).toStrictEqual({ data: true });
  });

  it('should give up at the max wait even if the mtime keeps changing', async () => {
    // Given
    mockMtimeAdvancing();
    // When
    const res = await waitUntilReady({ ...props, idleTimeoutMs: 5000, maxWaitMs: 20_000 });
    // Then
    calls(sleepMock).toHaveLength(40);
    expect(res.error?.code).toBe('MAX_TIMEOUT');
  });

  it('should stop waiting if the file does not exist anymore', async () => {
    // Given
    statMock.mockResolvedValue({ error: new StatError('NON_EXISTS') });
    // When
    const res = await waitUntilReady({ ...props, idleTimeoutMs: 5000, maxWaitMs: 60_000 });
    // Then
    calls(sleepMock).toHaveLength(0);
    expect(res.error?.code).toBe('NON_EXISTS');
  });
});
