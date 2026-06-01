import { mockDeep } from 'vitest-mock-extended';
import { Container } from 'diod';
import { TemporalFileCreator } from '../../../../../context/storage/TemporalFiles/application/creation/TemporalFileCreator';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';
import { create } from './create.service';

describe('create', () => {
  let container: ReturnType<typeof mockDeep<Container>>;
  const temporalFileCreator = mockDeep<TemporalFileCreator>();

  beforeEach(() => {
    container = mockDeep<Container>();
    container.get.calledWith(TemporalFileCreator).mockReturnValue(temporalFileCreator);
  });

  it('should create temporal file when request is valid', async () => {
    const { data, error } = await create('/some/file.txt', container);

    expect(error).toBeUndefined();
    expect(data).toBeUndefined();
    expect(temporalFileCreator.run).toHaveBeenCalledWith('/some/file.txt');
  });

  it('should return EIO when temporal file creation fails', async () => {
    temporalFileCreator.run.mockRejectedValue(new Error('boom'));

    const { data, error } = await create('/some/file.txt', container);

    expect(data).toBeUndefined();
    expect(error?.code).toBe(FuseCodes.EIO);
  });
});
