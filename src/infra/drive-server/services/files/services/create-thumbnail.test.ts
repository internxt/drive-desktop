import { call, partialSpyOn } from 'tests/vitest/utils.helper';
import { loggerMock } from 'tests/vitest/mocks.helper';
import * as authServiceModule from '../../../../../apps/main/auth/service';
import { driveServerClient } from '../../../client/drive-server.client.instance';
import { CreateThumbnailDto } from '../../../out/dto';
import { DriveServerError } from '../../../drive-server.error';

import { createThumbnail } from './create-thumbnail';

describe('createThumbnail', () => {
  const driveServerPostMock = partialSpyOn(driveServerClient, 'POST');
  const getNewApiHeadersMock = partialSpyOn(authServiceModule, 'getNewApiHeaders');

  beforeEach(() => {
    getNewApiHeadersMock.mockReturnValue({});
  });

  it('should return data when the request is successful', async () => {
    const thumbnailData = { id: 1, fileId: 'file-id' };
    driveServerPostMock.mockResolvedValue({ data: thumbnailData } as object);

    const result = await createThumbnail({} as CreateThumbnailDto);

    expect(result.data).toMatchObject(thumbnailData);
    expect(result.error).toBe(undefined);
  });

  it('should log and return error when the request fails', async () => {
    const error = new DriveServerError('BAD_REQUEST', 400);
    driveServerPostMock.mockResolvedValue({ data: undefined, error } as object);

    const result = await createThumbnail({} as CreateThumbnailDto);

    expect(result.error).toBe(error);
    call(loggerMock.error).toMatchObject({
      msg: 'error response creating a thumbnail',
      path: '/files/thumbnail',
      error,
    });
  });
});
