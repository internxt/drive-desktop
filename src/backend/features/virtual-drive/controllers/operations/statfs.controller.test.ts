import { mockDeep } from 'vitest-mock-extended';
import { Request, Response } from 'express';
import { Container } from 'diod';
import { statfsController } from './statfs.controller';
import * as statfsServiceModule from '../../services/operations/statfs.service';
import { partialSpyOn } from '../../../../../../tests/vitest/utils.helper';
import { FuseError } from '../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';

describe('statfsController', () => {
  const statfsMock = partialSpyOn(statfsServiceModule, 'statfs');
  let req: ReturnType<typeof mockDeep<Request>>;
  let res: ReturnType<typeof mockDeep<Response>>;
  let container: ReturnType<typeof mockDeep<Container>>;

  beforeEach(() => {
    req = mockDeep<Request>();
    res = mockDeep<Response>();
    container = mockDeep<Container>();
  });

  it('should return errno 0 and stats on success', async () => {
    const stats = {
      blocks: 1000000,
      bfree: 500000,
      bavail: 490000,
      files: 100000,
      ffree: 90000,
      bsize: 4096,
      nameLen: 255,
    };
    statfsMock.mockResolvedValue({ data: stats });

    await statfsController(req, res, container);

    expect(res.json).toBeCalledWith({ errno: 0, ...stats });
  });

  it('should return errno EIO when service fails', async () => {
    statfsMock.mockResolvedValue({ error: new FuseError(FuseCodes.EIO, 'disk error') });

    await statfsController(req, res, container);

    expect(res.json).toBeCalledWith({ errno: FuseCodes.EIO });
  });
});
