import { ThumbnailSynchronizer } from '../../../../../../src/context/storage/thumbnails/application/sync/ThumbnailSynchronizer';
import { ThumbnailCollection } from '../../../../../../src/context/storage/thumbnails/domain/ThumbnailCollection';
import { DateMother } from '../../../../shared/domain/DateMother';
import { FileMother } from '../../../../virtual-drive/files/domain/FileMother';
import { ThumbnailsRepositoryMock } from '../../__mock__/ThumbnailsRepositoryMock';
import { ThumbnailMother } from '../../domain/ThumbnailMother';

describe('Thumbnail Synchronizer', () => {
  let SUT: ThumbnailSynchronizer;

  let remote: ThumbnailsRepositoryMock;
  let local: ThumbnailsRepositoryMock;

  beforeAll(() => {
    remote = new ThumbnailsRepositoryMock();
    local = new ThumbnailsRepositoryMock();

    SUT = new ThumbnailSynchronizer(remote, local);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('tries to get all the remote and local thumbnails for the given files', async () => {
    const files = FileMother.array();

    remote.willRetrieve(undefined);
    local.willRetrieve(undefined);

    await SUT.run(files);

    remote.assertRetrieveHasBeenCalledWith(files);
    local.assertRetrieveHasBeenCalledWith(files);
  });

  it('pushes all remote thumbnails not found on local', async () => {
    const file = FileMother.any();
    const thumbnailsFound = [ThumbnailMother.any()];

    remote.willRetrieveOnce(
      new ThumbnailCollection(file.uuid, thumbnailsFound)
    );
    local.willRetrieveOnce(undefined);

    remote.willPullSomeRandomContent();

    await SUT.run([file]);

    remote.assertPullHasBeenCalledWith(thumbnailsFound);
    local.assertPushHasBeenCalledWith(thumbnailsFound);
  });

  it('pushes all the newer remote thumbnails not found on local', async () => {
    const file = FileMother.any();
    const remoteThumbnails = [
      ThumbnailMother.fromPartial({
        updatedAt: DateMother.today(),
      }),
    ];
    const localThumbnails = [
      ThumbnailMother.fromPartial({
        updatedAt: DateMother.yesterday(),
      }),
    ];

    remote.willRetrieveOnce(
      new ThumbnailCollection(file.uuid, remoteThumbnails)
    );
    local.willRetrieveOnce(new ThumbnailCollection(file.uuid, localThumbnails));

    remote.willPullSomeRandomContent();

    await SUT.run([file]);

    remote.assertPullHasBeenCalledWith(remoteThumbnails);
    local.assertPushHasBeenCalledWith(remoteThumbnails);
  });
});
