import { openLogs } from './open-logs';
import { readdir } from 'node:fs/promises';
import { call, calls } from '@/tests/vitest/utils.helper.test';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { shell } from 'electron';
import { createWriteStream, Dirent, WriteStream } from 'node:fs';
import { INTERNXT_LOGS } from '@/core/utils/utils';
import archiver from 'archiver';
import { mockDeep } from 'vitest-mock-extended';
import { EventEmitter } from 'node:stream';

vi.mock(import('node:fs/promises'));
vi.mock(import('node:fs'));
vi.mock(import('archiver'));

describe('open-logs', () => {
  const readdirMock = vi.mocked(readdir);
  const createWriteStreamMock = vi.mocked(createWriteStream);
  const archiverMock = vi.mocked(archiver);
  const openPathMock = vi.mocked(shell.openPath);

  let writeStream: EventEmitter;
  const archive = mockDeep<archiver.Archiver>();

  beforeEach(() => {
    readdirMock.mockResolvedValue(['drive.log', 'drive-important.log', INTERNXT_LOGS] as unknown as Dirent<Buffer>[]);
    archiverMock.mockReturnValue(archive);

    writeStream = new EventEmitter();
    createWriteStreamMock.mockReturnValue(writeStream as WriteStream);

    archive.finalize.mockImplementation(() => {
      writeStream.emit('close');
      return Promise.resolve();
    });
  });

  afterEach(() => {
    call(createWriteStreamMock).toStrictEqual(`/mock/logs/internxt-drive/logs/${INTERNXT_LOGS}`);
    call(openPathMock).toStrictEqual('/mock/logs/internxt-drive/logs');
  });

  it('should catch global errors', async () => {
    // Given
    readdirMock.mockRejectedValue(new Error());
    // When
    await openLogs();
    // Then
    call(loggerMock.error).toMatchObject({ msg: 'Error creating logs zip' });
  });

  it('should catch stream errors', async () => {
    // Given
    archive.finalize.mockImplementation(() => {
      writeStream.emit('error');
      return Promise.resolve();
    });
    // When
    await openLogs();
    // Then
    call(loggerMock.error).toMatchObject({ msg: 'Error creating logs zip' });
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
      '/mock/logs/internxt-drive/logs/drive.log',
      '/mock/logs/internxt-drive/logs/drive-important.log',
      '/mock/logs/internxt-drive/internxt_desktop.db',
      '/mock/logs/internxt-drive/internxt_desktop.json',
    ]);
  });
});
