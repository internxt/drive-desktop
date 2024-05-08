import { ThumbnailSynchronizer } from '../../../../../../src/context/storage/thumbnails/application/sync/ThumbnailSynchronizer';
import { ThumbnailCollection } from '../../../../../../src/context/storage/thumbnails/domain/ThumbnailCollection';
import { DateMother } from '../../../../shared/domain/DateMother';
import { FileMother } from '../../../../virtual-drive/files/domain/FileMother';
import { FilePathMother } from '../../../../virtual-drive/files/domain/FilePathMother';
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
    const files = FileMother.array(() => ({
      path: FilePathMother.thumbnable().value,
    }));

    remote.willRetrieve(undefined);
    local.willRetrieve(undefined);

    await SUT.run(files);

    remote.assertRetrieveHasBeenCalledWith(files);
    local.assertRetrieveHasBeenCalledWith(files);
  });

  it('pushes all remote thumbnails not found on local', async () => {
    const file = FileMother.thumbnable();
    const thumbnailsFound = [ThumbnailMother.any()];

    remote.willRetrieveOnce(new ThumbnailCollection(file, thumbnailsFound));
    local.willRetrieveOnce(undefined);

    remote.willPullSomeRandomContent();

    await SUT.run([file]);

    remote.assertPullHasBeenCalledWith(thumbnailsFound);
    local.assertPushHasBeenCalledWith([file]);
  });

  it('pushes all the newer remote thumbnails not found on local', async () => {
    const file = FileMother.thumbnable();

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

    remote.willRetrieveOnce(new ThumbnailCollection(file, remoteThumbnails));
    local.willRetrieveOnce(new ThumbnailCollection(file, localThumbnails));

    remote.willPullSomeRandomContent();

    await SUT.run([file]);

    remote.assertPullHasBeenCalledWith(remoteThumbnails);
    local.assertPushHasBeenCalledWith([file]);
  });

  it('does not create a default thumbnail if already exits', async () => {
    const file = FileMother.noThumbnable();

    local.hasWillReturn(true);

    await SUT.run([file]);

    local.assertHasHasBeenCalledWith(file);
    local.assertDefaultHasNotBeenCalled();
  });

  it('does not create a default thumbnail of a thumbnable file', async () => {
    const file = FileMother.thumbnable();

    local.hasWillReturn(true);

    await SUT.run([file]);

    local.assertHasHasNotBeenCalledWith();
    local.assertDefaultHasNotBeenCalled();
  });

  it('creates a default thumbnail if does not exits', async () => {
    const files = [
      FileMother.noThumbnable(),
      FileMother.noThumbnable(),
      FileMother.noThumbnable(),
      FileMother.noThumbnable(),
    ];

    local.hasWillReturn(false);

    await SUT.run(files);

    files.forEach((file) => {
      local.assertHasHasBeenCalledWith(file);
      local.assertDefaultBeenCalledWith(file);
    });
  });
});
