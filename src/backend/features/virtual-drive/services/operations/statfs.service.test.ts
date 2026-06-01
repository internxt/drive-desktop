import { mockDeep } from 'vitest-mock-extended';
import { Container } from 'diod';
import { statfs } from './statfs.service';
import { TemporalFileRepository } from '../../../../../context/storage/TemporalFiles/domain/TemporalFileRepository';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';

const diskStats = {
  blocks: 2000000,
  bfree: 1000000,
  bavail: 990000,
  files: 500000,
  ffree: 400000,
  bsize: 4096,
};

describe('statfs', () => {
  let container: ReturnType<typeof mockDeep<Container>>;
  let repository: ReturnType<typeof mockDeep<TemporalFileRepository>>;

  beforeEach(() => {
    repository = mockDeep<TemporalFileRepository>();
    container = mockDeep<Container>();
    container.get.calledWith(TemporalFileRepository).mockReturnValue(repository);
  });

  it('should return disk stats on success', async () => {
    repository.statFs.mockResolvedValue(diskStats);

    const result = await statfs({ container });

    expect(result.data).toStrictEqual({ ...diskStats, nameLen: 255 });
    expect(result.error).toBeUndefined();
  });

  it('should return EIO when repository throws', async () => {
    repository.statFs.mockRejectedValue(new Error('disk read error'));

    const result = await statfs({ container });

    expect(result.data).toBeUndefined();
    expect(result.error?.code).toBe(FuseCodes.EIO);
  });
});
