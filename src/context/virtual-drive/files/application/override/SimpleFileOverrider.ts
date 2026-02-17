import { Service } from 'diod';
import { FileSize } from '../../domain/FileSize';
import { File } from '../../domain/File';
import { FileContentsId } from '../../domain/FileContentsId';
import { overrideFile } from '../../../../../infra/drive-server/services/files/services/override-file';

@Service()
export class SimpleFileOverrider {
  async run(file: File, contentsId: string, size: number): Promise<void> {
    file.changeContents(new FileContentsId(contentsId), new FileSize(size));

    await overrideFile({
      fileUuid: file.uuid,
      fileContentsId: file.contentsId,
      fileSize: file.size,
    });
  }
}
