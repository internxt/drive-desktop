import { Container } from 'diod';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { File } from '../../../../../../context/virtual-drive/files/domain/File';
import { RelativePathToAbsoluteConverter } from '../../../../../../context/virtual-drive/shared/application/RelativePathToAbsoluteConverter';
import { TemporalFile } from '../../../../../../context/storage/TemporalFiles/domain/TemporalFile';
import { TemporalFileByteByByteComparator } from '../../../../../../context/storage/TemporalFiles/application/comparation/TemporalFileByteByByteComparator';
import { TemporalFilePath } from '../../../../../../context/storage/TemporalFiles/domain/TemporalFilePath';

type Props = {
  virtual: File;
  document: TemporalFile;
  container: Container;
};

export async function hasTemporalFileChanged({ virtual, document, container }: Props): Promise<boolean> {
  if (virtual.size !== document.size.value) {
    return true;
  }

  try {
    const filePath = container.get(RelativePathToAbsoluteConverter).run(virtual.contentsId);

    const areEqual = await container
      .get(TemporalFileByteByByteComparator)
      .run(new TemporalFilePath(filePath), document.path);

    logger.debug({ msg: `Contents of <${virtual.path}> did not change` });

    return !areEqual;
  } catch (error) {
    logger.error({ msg: 'Error comparing file contents', error });
  }

  return false;
}
