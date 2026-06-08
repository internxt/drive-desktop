import { mockDeep } from 'vitest-mock-extended';
import { Container } from 'diod';
import { loggerMock } from '../../../../../../tests/vitest/mocks.helper';
import { partialSpyOn } from '../../../../../../tests/vitest/utils.helper';
import configStore from '../../../../../apps/main/config';
import { clearMaxFileSizeRejectionModal } from '../../../user/file-size-limit/add-max-file-size-rejection';
import { ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT } from '../../../user/file-size-limit/constants';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';
import { TemporalFileCreator } from '../../../../../context/storage/TemporalFiles/application/creation/TemporalFileCreator';
import { TemporalFileByPathFinder } from '../../../../../context/storage/TemporalFiles/application/find/TemporalFileByPathFinder';
import { TemporalFileWriter } from '../../../../../context/storage/TemporalFiles/application/write/TemporalFileWriter';
import { TemporalFile } from '../../../../../context/storage/TemporalFiles/domain/TemporalFile';
import { TemporalFilePath } from '../../../../../context/storage/TemporalFiles/domain/TemporalFilePath';
import { TemporalFileSize } from '../../../../../context/storage/TemporalFiles/domain/TemporalFileSize';
import {
  clearUploadSizeLimitBlockedPath,
  isUploadSizeLimitBlockedPath,
  markUploadSizeLimitBlockedPath,
} from '../../../user/file-size-limit/add-max-file-size-rejection';
import { write } from './write.service';

describe('write', () => {
  const configGetMock = partialSpyOn(configStore, 'get');
  let container: ReturnType<typeof mockDeep<Container>>;
  const temporalFileWriter = mockDeep<TemporalFileWriter>();
  const temporalFileByPathFinder = mockDeep<TemporalFileByPathFinder>();
  const temporalFileCreator = mockDeep<TemporalFileCreator>();

  beforeEach(() => {
    configGetMock.mockReturnValue(100);
    container = mockDeep<Container>();
    container.get.calledWith(TemporalFileWriter).mockReturnValue(temporalFileWriter);
    container.get.calledWith(TemporalFileByPathFinder).mockReturnValue(temporalFileByPathFinder);
    container.get.calledWith(TemporalFileCreator).mockReturnValue(temporalFileCreator);
    temporalFileByPathFinder.run.mockResolvedValue(undefined);
    clearUploadSizeLimitBlockedPath('/some/file.txt');
    clearUploadSizeLimitBlockedPath('/.test-test-file.txt.swp');
    clearMaxFileSizeRejectionModal();
  });

  afterEach(() => {
    clearMaxFileSizeRejectionModal();
  });

  it('should write bytes into temporal file and return written length', async () => {
    const content = Buffer.from('hello');
    vi.spyOn(TemporalFile, 'isTemporaryPath').mockReturnValue(false);

    const { data, error } = await write({
      path: '/some/file.txt',
      content,
      offset: 7,
      container,
    });

    expect(error).toBeUndefined();
    expect(data).toBe(content.length);
    expect(temporalFileCreator.run).not.toHaveBeenCalled();
    expect(temporalFileWriter.run).toHaveBeenCalledWith('/some/file.txt', content, content.length, 7);
  });

  it('should reject writes when projected size exceeds the stored upload limit', async () => {
    const content = Buffer.alloc(5);
    vi.spyOn(TemporalFile, 'isTemporaryPath').mockReturnValue(false);
    temporalFileByPathFinder.run.mockResolvedValue(
      TemporalFile.create(new TemporalFilePath('/some/file.txt'), new TemporalFileSize(10)),
    );

    const { data, error } = await write({
      path: '/some/file.txt',
      content,
      offset: 96,
      container,
    });

    expect(data).toBeUndefined();
    expect(error?.code).toBe(FuseCodes.EFBIG);
    expect(temporalFileWriter.run).not.toHaveBeenCalled();
    expect(isUploadSizeLimitBlockedPath('/some/file.txt')).toBe(true);
    expect(loggerMock.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        tag: 'SYNC-ENGINE',
        msg: 'File size exceeds upload limit',
        path: '/some/file.txt',
        size: 101,
        maxFileSize: 100,
        reason: 'PLAN_LIMIT_EXCEEDED',
        showUpgradeCta: true,
      }),
    );
  });

  it('should reject already blocked paths without writing more bytes', async () => {
    const content = Buffer.alloc(5);
    vi.spyOn(TemporalFile, 'isTemporaryPath').mockReturnValue(false);
    markUploadSizeLimitBlockedPath('/some/file.txt');

    const { data, error } = await write({
      path: '/some/file.txt',
      content,
      offset: 0,
      container,
    });

    expect(data).toBeUndefined();
    expect(error?.code).toBe(FuseCodes.EFBIG);
    expect(temporalFileByPathFinder.run).not.toHaveBeenCalled();
    expect(temporalFileWriter.run).not.toHaveBeenCalled();
    expect(loggerMock.warn).not.toHaveBeenCalled();
  });

  it('should reject writes over the absolute cap when max upload file size is unavailable', async () => {
    configGetMock.mockReturnValue(undefined);
    const content = Buffer.alloc(5);
    vi.spyOn(TemporalFile, 'isTemporaryPath').mockReturnValue(false);
    temporalFileByPathFinder.run.mockResolvedValue(
      TemporalFile.create(new TemporalFilePath('/some/file.txt'), new TemporalFileSize(10)),
    );

    const { data, error } = await write({
      path: '/some/file.txt',
      content,
      offset: ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT + 1,
      container,
    });

    expect(data).toBeUndefined();
    expect(error?.code).toBe(FuseCodes.EFBIG);
    expect(temporalFileWriter.run).not.toHaveBeenCalled();
    expect(loggerMock.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        tag: 'SYNC-ENGINE',
        msg: 'File size exceeds upload limit',
        path: '/some/file.txt',
        size: ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT + 6,
        maxFileSize: ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT,
        reason: 'ABSOLUTE_CAP_EXCEEDED',
        showUpgradeCta: false,
      }),
    );
  });

  it('should allow writes when max upload file size is unavailable', async () => {
    configGetMock.mockReturnValue(undefined);
    const content = Buffer.alloc(5);
    vi.spyOn(TemporalFile, 'isTemporaryPath').mockReturnValue(false);

    const { data, error } = await write({
      path: '/some/file.txt',
      content,
      offset: 1_000,
      container,
    });

    expect(error).toBeUndefined();
    expect(data).toBe(content.length);
    expect(temporalFileWriter.run).toHaveBeenCalledWith('/some/file.txt', content, content.length, 1_000);
  });

  it('should create auxiliary temporal file on first write when missing', async () => {
    const content = Buffer.from('hello');
    vi.spyOn(TemporalFile, 'isTemporaryPath').mockReturnValue(true);

    const { data, error } = await write({
      path: '/.test-test-file.txt.swp',
      content,
      offset: 4096,
      container,
    });

    expect(error).toBeUndefined();
    expect(data).toBe(content.length);
    expect(temporalFileCreator.run).toHaveBeenCalledWith('/.test-test-file.txt.swp');
    expect(temporalFileWriter.run).toHaveBeenCalledWith('/.test-test-file.txt.swp', content, content.length, 4096);
  });

  it('should return EIO when temporal write fails', async () => {
    vi.spyOn(TemporalFile, 'isTemporaryPath').mockReturnValue(false);
    temporalFileWriter.run.mockRejectedValue(new Error('boom'));

    const { data, error } = await write({
      path: '/some/file.txt',
      content: Buffer.from('hello'),
      offset: 0,
      container,
    });

    expect(data).toBeUndefined();
    expect(error?.code).toBe(FuseCodes.EIO);
  });
});
