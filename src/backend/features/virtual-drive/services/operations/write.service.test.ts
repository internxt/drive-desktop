import { mockDeep } from 'vitest-mock-extended';
import { Container } from 'diod';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';
import { TemporalFileCreator } from '../../../../../context/storage/TemporalFiles/application/creation/TemporalFileCreator';
import { TemporalFileByPathFinder } from '../../../../../context/storage/TemporalFiles/application/find/TemporalFileByPathFinder';
import { TemporalFileWriter } from '../../../../../context/storage/TemporalFiles/application/write/TemporalFileWriter';
import { TemporalFile } from '../../../../../context/storage/TemporalFiles/domain/TemporalFile';
import { write } from './write.service';

describe('write', () => {
  let container: ReturnType<typeof mockDeep<Container>>;
  const temporalFileWriter = mockDeep<TemporalFileWriter>();
  const temporalFileByPathFinder = mockDeep<TemporalFileByPathFinder>();
  const temporalFileCreator = mockDeep<TemporalFileCreator>();

  beforeEach(() => {
    vi.restoreAllMocks();
    container = mockDeep<Container>();
    container.get.calledWith(TemporalFileWriter).mockReturnValue(temporalFileWriter);
    container.get.calledWith(TemporalFileByPathFinder).mockReturnValue(temporalFileByPathFinder);
    container.get.calledWith(TemporalFileCreator).mockReturnValue(temporalFileCreator);
    temporalFileByPathFinder.run.mockResolvedValue(undefined);
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
