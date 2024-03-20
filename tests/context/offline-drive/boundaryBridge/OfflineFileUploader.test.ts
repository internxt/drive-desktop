import { OfflineFileUploader } from '../../../../src/context/offline-drive/boundaryBridge/application/OfflineFileUploader';
import { OfflineFileMother } from '../files/domain/OfflineFileMother';
import { GivenFileOfflineFileSearcher } from './__mocks__/GivenFileOfflineFileSearcher';
import { NoFileOfflineFileSearcher } from './__mocks__/NoFileOfflineFileSearcher';
import { OfflineContentsUploaderTestClass } from './__mocks__/OfflineContentsUploaderTestClass';

describe('Offline File Uploader', () => {
  it('does nothing if a file is not founded', async () => {
    const searcher = new NoFileOfflineFileSearcher();
    const uploader = new OfflineContentsUploaderTestClass();

    const offlineFileUploader = new OfflineFileUploader(searcher, uploader);

    await offlineFileUploader.run('/patatas.png');

    expect(uploader.mock).not.toBeCalled();
  });

  it('tries to upload a file if founded', async () => {
    const file = OfflineFileMother.any();
    const searcher = new GivenFileOfflineFileSearcher(file);
    const uploader = new OfflineContentsUploaderTestClass();

    const offlineFileUploader = new OfflineFileUploader(searcher, uploader);

    await offlineFileUploader.run(file.path.value);

    expect(uploader.mock).toHaveBeenCalledWith(file.id, file.path);
  });
});
