import { DownloadContentsToPlainFile } from '../../../../../src/context/virtual-drive/contents/application/DownloadContentsToPlainFile';
import { ContentsMetadata } from '../../../../../src/context/virtual-drive/contents/domain/ContentsMetadata';
import { DateMother } from '../../../shared/domain/DateMother';
import { FileMother } from '../../files/domain/FileMother';
import { DownloadProgressTrackerMock } from '../../shared/__mock__/DownloadProgressTrackerMock';
import { EventBusMock } from '../../shared/__mock__/EventBusMock';
import { LocalFileSystemMock } from '../__mocks__/LocalFileWriterMock';
import { RemoteFileContentsManagersFactoryMock } from '../__mocks__/RemoteFileContentsManagersFactoryMock';

describe('Download Contents To Plain File', () => {
  let managerFactory: RemoteFileContentsManagersFactoryMock;
  let local: LocalFileSystemMock;
  let eventBus: EventBusMock;
  let tracker: DownloadProgressTrackerMock;

  let SUT: DownloadContentsToPlainFile;

  beforeEach(() => {
    managerFactory = new RemoteFileContentsManagersFactoryMock();
    local = new LocalFileSystemMock();
    eventBus = new EventBusMock();
    tracker = new DownloadProgressTrackerMock();

    SUT = new DownloadContentsToPlainFile(
      managerFactory,
      local,
      eventBus,
      tracker
    );
  });

  describe('cache strategy', () => {
    it('downloads the file if not exits on local', async () => {
      const file = FileMother.any();

      local.metadataMock.mockResolvedValueOnce(undefined);

      await SUT.run(file);

      expect(managerFactory.mockDownloader.downloadMock).toBeCalled();
      expect(local.writeMock).toBeCalled();
    });

    it('downloads the file if exists on local but its not up to date', async () => {
      const file = FileMother.any();

      local.metadataMock.mockResolvedValueOnce(
        ContentsMetadata.from({
          modificationDate: DateMother.previousDay(file.updatedAt),
        })
      );

      await SUT.run(file);

      expect(managerFactory.mockDownloader.downloadMock).toBeCalled();
      expect(local.writeMock).toBeCalled();
    });

    it('does not download the file if exists on local and its up to date', async () => {
      const file = FileMother.any();

      local.metadataMock.mockResolvedValueOnce(
        ContentsMetadata.from({
          modificationDate: file.updatedAt,
        })
      );

      await SUT.run(file);

      expect(managerFactory.mockDownloader.downloadMock).not.toBeCalled();
      expect(local.writeMock).not.toBeCalled();
    });
  });
});
