import { mockDeep } from 'vitest-mock-extended';
import { Container } from 'diod';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';
import { TemporalFileCreator } from '../../../../../context/storage/TemporalFiles/application/creation/TemporalFileCreator';
import { TemporalFileByPathFinder } from '../../../../../context/storage/TemporalFiles/application/find/TemporalFileByPathFinder';
import { TemporalFileTruncater } from '../../../../../context/storage/TemporalFiles/application/truncate/TemporalFileTruncater';
import { FirstsFileSearcher } from '../../../../../context/virtual-drive/files/application/search/FirstsFileSearcher';
import { truncate } from './truncate.service';

describe('truncate', () => {
  let container: ReturnType<typeof mockDeep<Container>>;
  const firstsFileSearcher = mockDeep<FirstsFileSearcher>();
  const temporalFileByPathFinder = mockDeep<TemporalFileByPathFinder>();
  const temporalFileCreator = mockDeep<TemporalFileCreator>();
  const temporalFileTruncater = mockDeep<TemporalFileTruncater>();

  beforeEach(() => {
    container = mockDeep<Container>();
    container.get.calledWith(FirstsFileSearcher).mockReturnValue(firstsFileSearcher);
    container.get.calledWith(TemporalFileByPathFinder).mockReturnValue(temporalFileByPathFinder);
    container.get.calledWith(TemporalFileCreator).mockReturnValue(temporalFileCreator);
    container.get.calledWith(TemporalFileTruncater).mockReturnValue(temporalFileTruncater);

    firstsFileSearcher.run.mockResolvedValue(
      {} as unknown as NonNullable<Awaited<ReturnType<FirstsFileSearcher['run']>>>,
    );
    temporalFileByPathFinder.run.mockResolvedValue(undefined);
  });

  it('should create temporal file and truncate it when not present', async () => {
    const { data, error } = await truncate({
      path: '/some/file.txt',
      size: 0,
      container,
    });

    expect(error).toBeUndefined();
    expect(data).toBeUndefined();
    expect(temporalFileCreator.run).toBeCalledWith('/some/file.txt');
    expect(temporalFileTruncater.run).toBeCalledWith('/some/file.txt', 0);
  });

  it('should return ENOENT when virtual and temporal file do not exist', async () => {
    firstsFileSearcher.run.mockResolvedValue(undefined);
    temporalFileByPathFinder.run.mockResolvedValue(undefined);

    const { data, error } = await truncate({
      path: '/some/file.txt',
      size: 0,
      container,
    });

    expect(data).toBeUndefined();
    expect(error?.code).toBe(FuseCodes.ENOENT);
    expect(temporalFileCreator.run).not.toHaveBeenCalled();
    expect(temporalFileTruncater.run).not.toHaveBeenCalled();
  });

  it('should return EIO when temporal truncation fails', async () => {
    temporalFileTruncater.run.mockRejectedValue(new Error('boom'));

    const { data, error } = await truncate({
      path: '/some/file.txt',
      size: 0,
      container,
    });

    expect(data).toBeUndefined();
    expect(error?.code).toBe(FuseCodes.EIO);
  });
});
