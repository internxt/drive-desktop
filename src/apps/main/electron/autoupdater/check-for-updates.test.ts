import { app } from 'electron';
import { loggerFn } from '@/tests/vitest/mocks.helper.test';
import { call, calls, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as checkExistingFile from './check-existing-file';
import { checkForUpdates, isNewer } from './check-for-updates';
import * as downloadRelease from './download-release';

describe('check-for-updates', () => {
  const appMock = vi.mocked(app);
  const checkExistingFileMock = partialSpyOn(checkExistingFile, 'checkExistingFile');
  const downloadReleaseMock = partialSpyOn(downloadRelease, 'downloadRelease');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue({ tag_name: 'v10.0.0' }) }));

    // @ts-expect-error is read only
    app.isPackaged = true;
  });

  it('should skip if app is not packaged', async () => {
    // Given
    // @ts-expect-error is read only
    appMock.isPackaged = false;
    // When
    const res = await checkForUpdates();
    // Then
    expect(res).toBeUndefined();
    calls(fetch).toHaveLength(0);
  });

  it('should check new releases every hour if app is up to date', async () => {
    // Given
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue({ tag_name: 'v2.0.0' }) }));
    // When
    const res = await checkForUpdates();
    // Then
    expect(res).toBeUndefined();
    call(fetch).toBe('https://api.github.com/repos/internxt/drive-desktop/releases/latest');
    call(loggerFn).toStrictEqual({ msg: 'App is up to date', latest: '2.0.0' });
    // When
    vi.advanceTimersByTime(60 * 60 * 1000);
    // Then
    calls(fetch).toHaveLength(2);
  });

  it('should not download release if it was already downloaded', async () => {
    // Given
    checkExistingFileMock.mockResolvedValue(true);
    // When
    const res = await checkForUpdates();
    // Then
    expect(res).toBe(true);
    calls(downloadReleaseMock).toHaveLength(0);
  });

  it('should download release if it was not downloaded', async () => {
    // Given
    checkExistingFileMock.mockResolvedValue(false);
    // When
    const res = await checkForUpdates();
    // Then
    expect(res).toBeUndefined();
    call(downloadReleaseMock).toMatchObject({ fileName: 'Internxt-Setup-10.0.0.exe', latest: '10.0.0' });
  });

  it('isNewer', () => {
    // equal
    expect(isNewer('1.0.0', '1.0.0')).toBe(false);
    // major
    expect(isNewer('1.0.0', '2.0.0')).toBe(true);
    expect(isNewer('2.0.0', '1.0.0')).toBe(false);
    // minor
    expect(isNewer('1.0.0', '1.1.0')).toBe(true);
    expect(isNewer('1.1.0', '1.0.0')).toBe(false);
    // patch
    expect(isNewer('1.0.0', '1.0.1')).toBe(true);
    expect(isNewer('1.0.1', '1.0.0')).toBe(false);
    // major dominates minor/patch
    expect(isNewer('1.9.9', '2.0.0')).toBe(true);
    expect(isNewer('2.0.0', '1.9.9')).toBe(false);
    // minor dominates patch
    expect(isNewer('1.0.9', '1.1.0')).toBe(true);
    expect(isNewer('1.1.0', '1.0.9')).toBe(false);
  });
});
