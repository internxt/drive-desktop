import { openLogs } from './open-logs';
import { call, calls } from '@/tests/vitest/utils.helper.test';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { shell } from 'electron';
import { createWriteStream } from 'node:fs';
import { INTERNXT_LOGS } from '@/core/utils/utils';
import archiver from 'archiver';
import { mockDeep } from 'vitest-mock-extended';
import { pipeline } from 'node:stream/promises';

vi.mock(import('node:fs'));
vi.mock(import('node:stream/promises'));
vi.mock(import('archiver'));

describe('open-logs', () => {
  vi.mocked(pipeline);
  const createWriteStreamMock = vi.mocked(createWriteStream);
  const archiverMock = vi.mocked(archiver);
  const openPathMock = vi.mocked(shell.openPath);

  const archive = mockDeep<archiver.Archiver>();

  beforeEach(() => {
    archiverMock.mockReturnValue(archive);
  });

  afterEach(() => {
    call(createWriteStreamMock).toStrictEqual(`/mock/logs/internxt-drive/logs/${INTERNXT_LOGS}`);
    call(openPathMock).toStrictEqual('/mock/logs/internxt-drive/logs');
  });

  it('should catch file errors', async () => {
    // Given
    archive.file.mockImplementationOnce(() => {
      throw new Error();
    });
    // When
    await openLogs();
    // Then
    call(loggerMock.error).toMatchObject({ msg: 'Error adding log file to zip' });
  });

  it('should create the zip', async () => {
    // When
    await openLogs();
    // Then
    calls(loggerMock.error).toHaveLength(0);
    calls(archive.file).toStrictEqual([
      ['/mock/logs/internxt-drive/logs/drive.log', { name: 'drive.log' }],
      ['/mock/logs/internxt-drive/logs/drive-important.log', { name: 'drive-important.log' }],
      ['/mock/logs/internxt-drive/internxt_desktop.db', { name: 'internxt_desktop.db' }],
      ['/mock/logs/internxt-drive/internxt_desktop.json', { name: 'internxt_desktop.json' }],
    ]);
  });
});
