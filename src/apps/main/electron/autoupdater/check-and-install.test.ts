import { existsSync } from 'node:fs';
import { loggerFn } from '@/tests/vitest/mocks.helper.test';
import { call, calls, deepMocked, partialSpyOn, TestProps } from '@/tests/vitest/utils.helper.test';
import { checkAndInstall } from './check-and-install';
import * as showDialog from './show-dialog';
import * as verifyHashModule from './verify-hash';

vi.mock(import('node:fs'));

describe('check-and-install', () => {
  const existsSyncMock = deepMocked(existsSync);
  const verifyHashMock = partialSpyOn(verifyHashModule, 'verifyHash');
  const installReleaseMock = partialSpyOn(showDialog, 'installRelease');

  const props: TestProps<typeof checkAndInstall> = {
    filePath: '/tmp/Internxt-Setup-10.0.0.exe',
  };

  beforeEach(() => {
    existsSyncMock.mockReturnValue(true);
    installReleaseMock.mockReturnValue(true);
  });

  it('should skip if file does not exist', async () => {
    // Given
    existsSyncMock.mockReturnValue(false);
    // When
    const res = await checkAndInstall(props as any);
    // Then
    expect(res).toBeUndefined();
    calls(verifyHashMock).toHaveLength(0);
  });

  it('should install release if file exists and hash is valid', async () => {
    // When
    const res = await checkAndInstall(props as any);
    // Then
    expect(res).toBe(true);
    calls(verifyHashMock).toHaveLength(1);
    calls(installReleaseMock).toHaveLength(1);
    call(loggerFn).toStrictEqual({ msg: 'Release already downloaded' });
  });

  it('should skip install if hash verification fails', async () => {
    // Given
    verifyHashMock.mockRejectedValue(new Error('sha512 mismatch'));
    // When
    const res = await checkAndInstall(props as any);
    // Then
    expect(res).toBeUndefined();
    calls(installReleaseMock).toHaveLength(0);
    calls(loggerFn).toMatchObject([{ msg: 'Release already downloaded' }, { msg: 'Invalid downloaded release' }]);
  });
});
