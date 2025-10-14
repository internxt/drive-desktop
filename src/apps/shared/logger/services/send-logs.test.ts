import { sendLogs } from './send-logs';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { call, calls } from '@/tests/vitest/utils.helper.test';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { shell } from 'electron';
import { Dirent } from 'node:fs';
import { INTERNXT_LOGS } from '@/core/utils/utils';

vi.mock(import('node:fs/promises'));

describe('send-logs', () => {
  const readdirMock = vi.mocked(readdir);
  const readFileMock = vi.mocked(readFile);
  const writeFileMock = vi.mocked(writeFile);
  const openPathMock = vi.mocked(shell.openPath);

  beforeEach(() => {
    readdirMock.mockResolvedValue(['drive.log', 'drive-important.log', INTERNXT_LOGS] as unknown as Dirent<Buffer>[]);
  });

  afterEach(() => {
    call(openPathMock).toStrictEqual('/mock/logs/internxt-drive/logs');
  });

  it('should catch global errors', async () => {
    // Given
    readdirMock.mockRejectedValue(new Error());
    // When
    await sendLogs();
    // Then
    call(loggerMock.error).toMatchObject({ msg: 'Error creating logs zip' });
  });

  it('should catch file errors', async () => {
    // Given
    readFileMock.mockRejectedValueOnce(new Error());
    // When
    await sendLogs();
    // Then
    call(writeFileMock).toStrictEqual(`/mock/logs/internxt-drive/logs/${INTERNXT_LOGS}`);
    call(loggerMock.error).toMatchObject({ msg: 'Error adding log file to zip' });
  });

  it('should create the zip', async () => {
    // When
    await sendLogs();
    // Then
    calls(loggerMock.error).toHaveLength(0);
    call(writeFileMock).toStrictEqual(`/mock/logs/internxt-drive/logs/${INTERNXT_LOGS}`);
    calls(readFileMock).toStrictEqual([
      '/mock/logs/internxt-drive/logs/drive.log',
      '/mock/logs/internxt-drive/logs/drive-important.log',
      '/mock/logs/internxt-drive/internxt_desktop.db',
      '/mock/logs/internxt-drive/internxt_desktop.json',
    ]);
  });
});
