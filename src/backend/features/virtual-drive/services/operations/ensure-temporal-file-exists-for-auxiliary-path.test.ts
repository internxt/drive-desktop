import { mockDeep } from 'vitest-mock-extended';
import { Container } from 'diod';
import { TemporalFileCreator } from '../../../../../context/storage/TemporalFiles/application/creation/TemporalFileCreator';
import { TemporalFileByPathFinder } from '../../../../../context/storage/TemporalFiles/application/find/TemporalFileByPathFinder';
import { TemporalFile } from '../../../../../context/storage/TemporalFiles/domain/TemporalFile';
import { ensureTemporalFileExistsForAuxiliaryPath } from './ensure-temporal-file-exists-for-auxiliary-path';

describe('ensure-temporal-file-exists-for-auxiliary-path', () => {
  let container: ReturnType<typeof mockDeep<Container>>;
  const temporalFileByPathFinder = mockDeep<TemporalFileByPathFinder>();
  const temporalFileCreator = mockDeep<TemporalFileCreator>();

  beforeEach(() => {
    vi.restoreAllMocks();
    container = mockDeep<Container>();
    container.get.calledWith(TemporalFileByPathFinder).mockReturnValue(temporalFileByPathFinder);
    container.get.calledWith(TemporalFileCreator).mockReturnValue(temporalFileCreator);
    temporalFileByPathFinder.run.mockResolvedValue(undefined);
  });

  it('should skip when path is not auxiliary', async () => {
    // Given
    vi.spyOn(TemporalFile, 'isTemporaryPath').mockReturnValue(false);

    // When
    await ensureTemporalFileExistsForAuxiliaryPath({ path: '/some/file.txt', container });

    // Then
    expect(temporalFileByPathFinder.run).not.toHaveBeenCalled();
    expect(temporalFileCreator.run).not.toHaveBeenCalled();
  });

  it('should skip creation when auxiliary temporal file already exists', async () => {
    // Given
    vi.spyOn(TemporalFile, 'isTemporaryPath').mockReturnValue(true);
    temporalFileByPathFinder.run.mockResolvedValue(
      {} as unknown as Awaited<ReturnType<TemporalFileByPathFinder['run']>>,
    );

    // When
    await ensureTemporalFileExistsForAuxiliaryPath({ path: '/.test-file.txt.swp', container });

    // Then
    expect(temporalFileByPathFinder.run).toHaveBeenCalledWith('/.test-file.txt.swp');
    expect(temporalFileCreator.run).not.toHaveBeenCalled();
  });

  it('should create temporal file when auxiliary path has no temporal file yet', async () => {
    // Given
    vi.spyOn(TemporalFile, 'isTemporaryPath').mockReturnValue(true);

    // When
    await ensureTemporalFileExistsForAuxiliaryPath({ path: '/.test-file.txt.swp', container });

    // Then
    expect(temporalFileByPathFinder.run).toHaveBeenCalledWith('/.test-file.txt.swp');
    expect(temporalFileCreator.run).toHaveBeenCalledWith('/.test-file.txt.swp');
  });
});
