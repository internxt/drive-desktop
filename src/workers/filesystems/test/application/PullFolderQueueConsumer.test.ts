/* eslint-disable jest/expect-expect */
/* eslint-disable jest/no-mocks-import */
import { PullFolderQueueConsumer } from '../../application/PullFolderQueueConsumer';
import { FileSystemMock } from '../__mocks__/FileSystemMock';

describe('Pull Folder Queue Consumer', () => {
  let fileSystem: FileSystemMock;

  beforeEach(() => {
    fileSystem = new FileSystemMock();
  });

  it('creates all the folders that recives', async () => {
    const folders = ['folderA', 'folderB', 'folderC'];

    const consumer = new PullFolderQueueConsumer(fileSystem);

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

    const consumer = new PullFolderQueueConsumer(fileSystem);

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

    const consumer = new PullFolderQueueConsumer(fileSystem);

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

    const consumer = new PullFolderQueueConsumer(fileSystem);

    await consumer.consume(folders);

    fileSystem.assertNumberOfFoldersPulled(2);
    fileSystem.assertFolderWasNeverPulled('folderA/subfolderB/sub-subfolderA');
  });
});
