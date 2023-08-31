import { DependencyContainer } from './dependencyInjection/DependencyContainer';
import { File } from './modules/files/domain/File';
import { VirtualDrive } from 'virtual-drive';
import Logger from 'electron-log';

export class BindingsManager {
  private static readonly PROVIDER_NAME = 'Internxt';

  constructor(
    private readonly drive: VirtualDrive,
    private readonly container: DependencyContainer,
    private readonly rootFolder: string
  ) {}

  public async listFiles() {
    const files = await this.container.fileSearcher.run();

    files.forEach((file: File) => {
      this.drive.createItemByPath(file.path.value, file.contentsId);
      // this.drive.createPlaceholderFile(
      // file.nameWithExtension,
      //   file.contentsId,
      //   file.size,
      //   this.drive.PLACEHOLDER_ATTRIBUTES.FILE_ATTRIBUTE_READONLY,
      //   file.createdAt.getUTCMilliseconds(),
      //   file.updatedAt.getUTCMilliseconds(),
      //   file.updatedAt.getUTCMilliseconds(),
      //   // This should be the last access time but we don't store the last accessed time
      //   path.join(this.drivePath, file.path.value);
      // );ray
    });
  }

  async start(version: string, providerId: string) {
    await this.drive.unregisterSyncRoot();

    await this.drive.registerSyncRoot(
      BindingsManager.PROVIDER_NAME,
      version,
      providerId
    );

    await this.drive.connectSyncRoot({
      notifyDeleteCompletionCallback: async (contentsId: string) => {
        // eslint-disable-next-line no-control-regex
        const sanitazedId = contentsId.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

        const files = await this.container.fileSearcher.run();
        const file = files.find((file) => {
          return file.contentsId === sanitazedId;
        });

        if (file) {
          Logger.debug('FILE TO BE DELTED', file.attributes());
          this.container.fileDeleter
            .run(file)
            .then(() => {
              Logger.debug('FILE DELETED: ', file.nameWithExtension);
            })
            .catch((err) => {
              Logger.debug('error deleting', err);
            });
        } else {
          Logger.debug('FILE NOT FOUND');
        }
      },
      notifyRenameCallback: async (
        absolutePath: string,
        contentsId: string
      ) => {
        const sanitazedContentsId = contentsId.replace(
          // eslint-disable-next-line no-control-regex
          /[\x00-\x1F\x7F-\x9F]/g,
          ''
        );
        const files = await this.container.fileSearcher.run();
        const file = files.find(
          (file) => file.contentsId === sanitazedContentsId
        );

        if (!file) {
          throw new Error('File not found');
        }

        const relative =
          this.container.filePathFromAbsolutePathCreator.run(absolutePath);

        Logger.debug('NEW PATH', relative.value);

        await this.container.fileRenamer
          .run(file, relative)
          .then(() => Logger.debug('FILE RENAMED / MOVED SUCCESFULLY'))
          .catch((err) => Logger.error(err));
      },
      notifyDeleteCallback: (...parms) => {
        Logger.debug('notifyDeleteCallback', parms);
      },
      fetchDataCallback: () => {
        Logger.debug('fetchDataCallback');
      },
      validateDataCallback: () => {
        Logger.debug('validateDataCallback');
      },
      cancelFetchDataCallback: () => {
        Logger.debug('cancelFetchDataCallback');
      },
      fetchPlaceholdersCallback: () => {
        Logger.debug('fetchPlaceholdersCallback');
      },
      cancelFetchPlaceholdersCallback: () => {
        Logger.debug('cancelFetchPlaceholdersCallback');
      },
      notifyFileOpenCompletionCallback: () => {
        Logger.debug('notifyFileOpenCompletionCallback');
      },
      notifyFileCloseCompletionCallback: () => {
        Logger.debug('notifyFileCloseCompletionCallback');
      },
      notifyDehydrateCallback: () => {
        Logger.debug('notifyDehydrateCallback');
      },
      notifyDehydrateCompletionCallback: () => {
        Logger.debug('notifyDehydrateCompletionCallback');
      },
      notifyRenameCompletionCallback: () => {
        Logger.debug('notifyRenameCompletionCallback');
      },
      noneCallback: () => {
        Logger.debug('noneCallback');
      },
    });

    await this.listFiles();

    this.drive.watchAndWait2(this.rootFolder);
  }

  async stop() {
    await this.drive.unregisterSyncRoot();
  }
}
