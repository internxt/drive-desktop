import { FilePathUpdater } from '../../../../context/virtual-drive/files/application/FilePathUpdater';
import { FolderPathUpdater } from '../../../../context/virtual-drive/folders/application/FolderPathUpdater';
import { CallbackController } from './CallbackController';
import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

type TProps = {
  path: RelativePath;
  uuid: string;
  type: 'file' | 'folder';
  action: 'rename' | 'move';
};

export class RenameOrMoveController extends CallbackController {
  constructor(
    private readonly filePathUpdater: FilePathUpdater,
    private readonly folderPathUpdater: FolderPathUpdater,
  ) {
    super();
  }

  async execute({ path, uuid, type, action }: TProps) {
    if (type === 'file') {
      await this.filePathUpdater.run({ uuid, path, action });
    }

    if (type === 'folder') {
      await this.folderPathUpdater.run({ uuid, path, action });
    }
  }
}
