import EventEmitter from 'events';
import { LocalItemMetaData } from '../../../../workers/sync/Listings/domain/LocalItemMetaData';
import { PullFolderQueueConsumer } from '../../application/PullFolderQueueConsumer';
import { FileSystemMock } from '../__mocks__/FileSystemMock';

describe('Pull Folder Queue Consumer', () => {
  let originFileSystem: FileSystemMock;
  let destinationFileSystem: FileSystemMock;
  let eventEmiter: EventEmitter;

  beforeEach(() => {
    originFileSystem = new FileSystemMock();
    originFileSystem.mockGetFolderMetadata.mockImplementation((name: string) =>
      Promise.resolve(
        LocalItemMetaData.from({
          name,
          modtime: 100,
          size: 10,
          isFolder: true,
          ino: 10,
          dev: 6,
        })
      )
    );

    destinationFileSystem = new FileSystemMock();

    eventEmiter = new EventEmitter();
  });

  it('creates all the folders that recives', async () => {
    const folders = ['folderA', 'folderB', 'folderC'];

    const consumer = new PullFolderQueueConsumer(
      originFileSystem,
      destinationFileSystem,
      eventEmiter
    );

    await consumer.consume(folders);

    originFileSystem.assertNumberOfCallsToGetFolderMetadata(folders.length);
    destinationFileSystem.assertNumberOfFoldersPulled(folders.length);
  });

  it('pulls the folders in order from the more superficial to the most nested', async () => {
    const folders = [
      'folderA/subfolderA',
      'folderA/subfolderB/sub-subfolderA',
      'folderA',
      'folderA/subfolderB',
      'folderB',
      'folderC/subfolderA',
      'folderC',
    ];

    const consumer = new PullFolderQueueConsumer(
      originFileSystem,
      destinationFileSystem,
      eventEmiter
    );

    await consumer.consume(folders);

    destinationFileSystem.assertOrderOfFoldersPulled([
      'folderA',
      'folderB',
      'folderC',
      'folderA/subfolderA',
      'folderA/subfolderB',
      'folderC/subfolderA',
      'folderA/subfolderB/sub-subfolderA',
    ]);

    destinationFileSystem.assertFolderHasBeenPulledBeforeThan(
      'folderA',
      'folderA/subfolderA',
      'folderA/subfolderB',
      'folderC/subfolderA',
      'folderA/subfolderB/sub-subfolderA'
    );

    destinationFileSystem.assertFolderHasBeenPulledBeforeThan(
      'folderC',
      'folderC/subfolderA'
    );
  });

  it('does not pull a folder from a more nested level if does not finish the previous', async () => {
    const folders = [
      'folderA/subfolderA',
      'folderA/subfolderB/sub-subfolderA',
      'folderA',
    ];

    originFileSystem.mockPullFolder
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 30);
          })
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 20);
          })
      )
      .mockImplementation(() => Promise.resolve());

    const consumer = new PullFolderQueueConsumer(
      originFileSystem,
      destinationFileSystem,
      eventEmiter
    );

    await consumer.consume(folders);

    destinationFileSystem.assertFolderHasBeenPulledBeforeThan(
      'folderA',
      'folderA/subfolderA',
      'folderA/subfolderB/sub-subfolderA'
    );

    destinationFileSystem.assertFolderHasBeenPulledBeforeThan(
      'folderA/subfolderA',
      'folderA/subfolderB/sub-subfolderA'
    );
  });

  it('stops the queue when there has been an error on a previos level', async () => {
    const folders = [
      'folderA/subfolderA',
      'folderA/subfolderB/sub-subfolderA',
      'folderA',
    ];

    destinationFileSystem.mockPullFolder
      .mockImplementationOnce(() => Promise.resolve())
      .mockImplementationOnce(() => Promise.reject())
      .mockImplementation(() => Promise.resolve());

    const consumer = new PullFolderQueueConsumer(
      originFileSystem,
      destinationFileSystem,
      eventEmiter
    );

    await consumer.consume(folders);

    destinationFileSystem.assertNumberOfFoldersPulled(2);
    destinationFileSystem.assertFolderWasNeverPulled(
      'folderA/subfolderB/sub-subfolderA'
    );
  });

  it('emits an event before and after the performing the action', async () => {
    const folders = [
      'folderA/subfolderA',
      'folderA/subfolderB/sub-subfolderA',
      'folderA',
      'folderA/subfolderB',
      'folderB',
      'folderC/subfolderA',
      'folderC',
    ];

    const pullingFolder = jest.fn();
    const folderPulled = jest.fn();

    eventEmiter.addListener('PULLING_FOLDER', pullingFolder);
    eventEmiter.addListener('FOLDER_PULLED', folderPulled);

    const consumer = new PullFolderQueueConsumer(
      originFileSystem,
      destinationFileSystem,
      eventEmiter
    );

    await consumer.consume(folders);

    expect(pullingFolder).toBeCalledTimes(folders.length);
    expect(folderPulled).toBeCalledTimes(folders.length);
  });
});
