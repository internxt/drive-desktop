import { Container } from 'diod';
import { TemporalFileCreator } from '../../../../../context/storage/TemporalFiles/application/creation/TemporalFileCreator';
import { TemporalFileByPathFinder } from '../../../../../context/storage/TemporalFiles/application/find/TemporalFileByPathFinder';
import { TemporalFile } from '../../../../../context/storage/TemporalFiles/domain/TemporalFile';

type Props = {
  path: string;
  container: Container;
};

export async function ensureTemporalFileExistsForAuxiliaryPath({ path, container }: Props): Promise<void> {
  if (!TemporalFile.isTemporaryPath(path)) {
    return;
  }

  const temporalFile = await container.get(TemporalFileByPathFinder).run(path);

  if (temporalFile) {
    return;
  }

  await container.get(TemporalFileCreator).run(path);
}
