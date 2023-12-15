import { FileCreationOrchestrator } from '../../../../context/virtual-drive/boundaryBridge/application/FileCreationOrchestrator';
import { FileUpdater } from '../../../../context/virtual-drive/files/application/FileUpdater';
import { createFilePlaceholderId } from '../../../../context/virtual-drive/files/domain/PlaceholderId';
import { CallbackController } from './CallbackController';
import Logger from 'electron-log';


type UpdateCallback = (acknowledge: boolean, id: string) => void;

export class UpdateFileController extends CallbackController {

  constructor(
    private readonly fileCreationOrchestrator: FileCreationOrchestrator,
    private readonly fileUpdater: FileUpdater,
  ) {
    super();
  }

  private updateFile = async (
    oldContentsId: string,
    callback: (acknowledge: boolean, id: string) => void
  ) => {
    try {
      const newContentsId = await this.fileCreationOrchestrator.run(oldContentsId);
      await this.fileUpdater.run(oldContentsId, newContentsId);
      return callback(true, createFilePlaceholderId(newContentsId));
    } catch (error: unknown) {
      Logger.error('Error when updating a file: ', error);
      callback(false, '');
    }
  };

  async execute(contentsId: string, callback: UpdateCallback) {
    const trimmedId = this.trim(contentsId);

    if (this.isFilePlaceholder(trimmedId)) {
      const [_, contentsId] = trimmedId.split(':');
      Logger.debug(`Updating file: ${contentsId}`);
      this.updateFile(contentsId, callback);
      return;
    }

    throw new Error(`Placeholder Id not identified:  ${trimmedId}`);
  }
}
