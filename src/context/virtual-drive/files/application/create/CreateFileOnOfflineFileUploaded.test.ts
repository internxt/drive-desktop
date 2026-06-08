import { Environment } from '@internxt/inxt-js';
import {
  clearMaxFileSizeRejectionModal,
  isUploadSizeLimitBlockedPath,
} from '../../../../../backend/features/user/file-size-limit/add-max-file-size-rejection';
import { DriveDesktopError } from '../../../../shared/domain/errors/DriveDesktopError';
import { CreateFileOnTemporalFileUploaded } from './CreateFileOnTemporalFileUploaded';
import { FileCreatorTestClass } from '../../__test-helpers__/FileCreatorTestClass';
import { FileOverriderTestClass } from '../../__test-helpers__/FileOverriderTestClass';
import { FileMother } from '../../domain/__test-helpers__/FileMother';
import { OfflineContentsUploadedDomainEventMother } from '../../domain/events/__test-helpers__/OfflineContentsUploadedDomainEventMother';
import { call } from 'tests/vitest/utils.helper';
import { preserveRejectedFileSizeTooBig } from '../../../../../backend/features/user/file-size-limit';

vi.mock('../../../../../backend/features/user/file-size-limit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../../backend/features/user/file-size-limit')>();

  return {
    ...actual,
    preserveRejectedFileSizeTooBig: vi.fn().mockResolvedValue({
      data: {
        filePath: '/home/user/.config/internxt/rejected-files-size-too-big/rejected/file.pdf',
      },
    }),
  };
});

describe('Create File On Offline File Uploaded', () => {
  const environment = {} as Environment;
  const bucket = 'test-bucket';

  afterEach(() => {
    clearMaxFileSizeRejectionModal();
  });

  it('creates a new file when event replaces field is undefined', async () => {
    const creator = new FileCreatorTestClass();
    const overrider = new FileOverriderTestClass();
    const file = FileMother.noThumbnable();
    creator.mock.mockResolvedValue(file);

    const uploadedEvent = OfflineContentsUploadedDomainEventMother.doesNotReplace();

    const sut = new CreateFileOnTemporalFileUploaded(creator, overrider, environment, bucket);

    await sut.on(uploadedEvent);

    call(creator.mock).toMatchObject([uploadedEvent.path, uploadedEvent.aggregateId, uploadedEvent.size]);
  });

  it('does not create a new file when the replaces field is defined', async () => {
    const creator = new FileCreatorTestClass();
    const overrider = new FileOverriderTestClass();
    const file = FileMother.noThumbnable();
    overrider.mock.mockResolvedValue(file);

    const uploadedEvent = OfflineContentsUploadedDomainEventMother.replacesContents();

    const sut = new CreateFileOnTemporalFileUploaded(creator, overrider, environment, bucket);

    await sut.on(uploadedEvent);

    expect(creator.mock).not.toHaveBeenCalled();
  });

  it('overrides file with contents specified on the event', async () => {
    const creator = new FileCreatorTestClass();
    const overrider = new FileOverriderTestClass();
    const file = FileMother.noThumbnable();
    overrider.mock.mockResolvedValue(file);

    const uploadedEvent = OfflineContentsUploadedDomainEventMother.replacesContents();

    const sut = new CreateFileOnTemporalFileUploaded(creator, overrider, environment, bucket);

    await sut.on(uploadedEvent);

    call(overrider.mock).toMatchObject([uploadedEvent.replaces, uploadedEvent.aggregateId, uploadedEvent.size]);
  });

  it('preserves and queues max file size rejection when backend rejects metadata creation by file size', async () => {
    const creator = new FileCreatorTestClass();
    const overrider = new FileOverriderTestClass();
    creator.mock.mockRejectedValue(new DriveDesktopError('FILE_TOO_BIG'));

    const uploadedEvent = OfflineContentsUploadedDomainEventMother.doesNotReplace();
    Object.assign(uploadedEvent, { contentFilePath: '/tmp/internxt-drive-tmp/staged-file' });

    const sut = new CreateFileOnTemporalFileUploaded(creator, overrider, environment, bucket);

    await sut.on(uploadedEvent);

    expect(preserveRejectedFileSizeTooBig).toHaveBeenCalledWith({
      originalPath: uploadedEvent.path,
      temporalContentPath: '/tmp/internxt-drive-tmp/staged-file',
      size: uploadedEvent.size,
    });
    expect(isUploadSizeLimitBlockedPath(uploadedEvent.path)).toBe(false);
  });
});
