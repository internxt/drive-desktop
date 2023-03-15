import EventEmitter from 'events';
import { PullFolderQueueConsumer } from '../../application/PullFolderQueueConsumer';
import { FileSystemMock } from '../__mocks__/FileSystemMock';

describe('Pull Folder Queue Consumer', () => {
  let fileSystem: FileSystemMock;
  let eventEmiter: EventEmitter;

  beforeEach(() => {
    fileSystem = new FileSystemMock();
    eventEmiter = new EventEmitter();
  });

  it('creates all the folders that recives', async () => {
    const folders = ['folderA', 'folderB', 'folderC'];

    const consumer = new PullFolderQueueConsumer(fileSystem, eventEmiter);

    await consumer.consume(folders);

    fileSystem.assertNumberOfFoldersPulled(folders.length);
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

    const consumer = new PullFolderQueueConsumer(fileSystem, eventEmiter);

    await consumer.consume(folders);

    fileSystem.assertOrderOfFoldersPulled([
      'folderA',
      'folderB',
      'folderC',
      'folderA/subfolderA',
      'folderA/subfolderB',
      'folderC/subfolderA',
      'folderA/subfolderB/sub-subfolderA',
    ]);

    fileSystem.assertFolderHasBeenPulledBeforeThan(
      'folderA',
      'folderA/subfolderA',
      'folderA/subfolderB',
      'folderC/subfolderA',
      'folderA/subfolderB/sub-subfolderA'
    );

    fileSystem.assertFolderHasBeenPulledBeforeThan(
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

    fileSystem.mockPullFolder
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

    const consumer = new PullFolderQueueConsumer(fileSystem, eventEmiter);

    await consumer.consume(folders);

    fileSystem.assertFolderHasBeenPulledBeforeThan(
      'folderA',
      'folderA/subfolderA',
      'folderA/subfolderB/sub-subfolderA'
    );

    fileSystem.assertFolderHasBeenPulledBeforeThan(
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

    fileSystem.mockPullFolder
      .mockImplementationOnce(() => Promise.resolve())
      .mockImplementationOnce(() => Promise.reject())
      .mockImplementation(() => Promise.resolve());

    const consumer = new PullFolderQueueConsumer(fileSystem, eventEmiter);

    await consumer.consume(folders);

    fileSystem.assertNumberOfFoldersPulled(2);
    fileSystem.assertFolderWasNeverPulled('folderA/subfolderB/sub-subfolderA');
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

    const consumer = new PullFolderQueueConsumer(fileSystem, eventEmiter);

    await consumer.consume(folders);

    expect(pullingFolder).toBeCalledTimes(folders.length);
    expect(folderPulled).toBeCalledTimes(folders.length);
  });
});
