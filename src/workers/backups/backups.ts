import Logger from 'electron-log';
import _ from 'lodash';
import Process, { ProcessEvents, ProcessResult } from '../process';

class Backups extends Process {
  private static NUMBER_OF_PARALLEL_QUEUES_FOR_SMALL_FILES = 16;

  private static NUMBER_OF_PARALLEL_QUEUES_FOR_BIG_FILES = 2;

  private static SMALL_FILE_THRESHOLD = 1024 * 1024;

  async run(): Promise<ProcessResult> {
    this.emit('SMOKE_TESTING');

    await this.local.smokeTest();
    await this.remote.smokeTest();

    this.emit('GENERATING_ACTIONS_NEEDED_TO_SYNC');

    const { currentLocal, currentRemote } = await this.getCurrentListings({
      emitErrors: true,
    });

    Logger.debug('Current local before', currentLocal);
    Logger.debug('Current remote before', currentRemote);

    const {
      filesNotInLocal: deleteInRemote,
      filesNotInRemote,
      filesWithDifferentModtime,
    } = this.getListingsDiff(currentLocal, currentRemote);

    const pullFromRemote = filesNotInRemote.concat(filesWithDifferentModtime);

    Logger.debug('Queue pull from remote', pullFromRemote);
    Logger.debug('Queue delete from remote', deleteInRemote);

    this.emit(
      'ACTION_QUEUE_GENERATED',
      pullFromRemote.length + deleteInRemote.length
    );

    const smallFiles = pullFromRemote.filter(
      (name) => currentLocal[name].size <= Backups.SMALL_FILE_THRESHOLD
    );
    Logger.debug('Small files: ', smallFiles);

    const smallFileChunks = _.chunk(
      smallFiles,
      Math.ceil(
        smallFiles.length / Backups.NUMBER_OF_PARALLEL_QUEUES_FOR_SMALL_FILES
      )
    );
    Logger.debug('Small file chunks: ', smallFileChunks);

    const smallFileQueues = smallFileChunks.map((chunk) =>
      this.consumePullQueue(chunk, this.remote, this.local)
    );

    await Promise.all(smallFileQueues);

    const bigFiles = pullFromRemote.filter(
      (name) => currentLocal[name].size > Backups.SMALL_FILE_THRESHOLD
    );

    Logger.debug('Big files: ', bigFiles);

    const bigFileChunks = _.chunk(
      bigFiles,
      Math.ceil(
        bigFiles.length / Backups.NUMBER_OF_PARALLEL_QUEUES_FOR_BIG_FILES
      )
    );
    Logger.debug('Big file chunks: ', bigFileChunks);

    const bigFileQueues = bigFileChunks.map((chunk) =>
      this.consumePullQueue(chunk, this.remote, this.local)
    );

    await Promise.all([
      ...bigFileQueues,
      this.consumeDeleteQueue(deleteInRemote, this.remote),
    ]);

    const result = await this.generateResult();

    if (result.status === 'IN_SYNC') {
      const { listing, ...rest } = result;
      return rest;
    } else {
      return result;
    }
  }
}

interface BackupsEvents extends ProcessEvents {
  ACTION_QUEUE_GENERATED: (totalItems: number) => void;
}

/**
 * Enable event typing
 */
declare interface Backups {
  on<U extends keyof BackupsEvents>(event: U, listener: BackupsEvents[U]): this;

  emit<U extends keyof BackupsEvents>(
    event: U,
    ...args: Parameters<BackupsEvents[U]>
  ): boolean;
}

export default Backups;
