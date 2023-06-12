import Logger from 'electron-log';
import _ from 'lodash';

import Process, { ProcessEvents, ProcessResult } from '../process';

class Backups extends Process {
  private static NUMBER_OF_PARALLEL_QUEUES_FOR_SMALL_FILES = 16;

  private static NUMBER_OF_PARALLEL_QUEUES_FOR_MEDIUM_FILES = 6;

  private static NUMBER_OF_PARALLEL_QUEUES_FOR_BIG_FILES = 2;

  private static MAX_SMALL_FILE_SIZE = 1024 * 1024;

  private static MAX_MEDIUM_FILE_SIZE = 20 * 1024 * 1024;

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

    function getChunkSize(numberOfFiles: number, numberOfQueues: number) {
      return Math.ceil(numberOfFiles / numberOfQueues);
    }

    const smallFiles = pullFromRemote.filter(
      (name) => currentLocal[name].size <= Backups.MAX_SMALL_FILE_SIZE
    );
    Logger.debug('Small files: ', smallFiles);

    const smallFileChunks = _.chunk(
      smallFiles,
      getChunkSize(
        smallFiles.length,
        Backups.NUMBER_OF_PARALLEL_QUEUES_FOR_SMALL_FILES
      )
    );
    Logger.debug('Small file chunks: ', smallFileChunks);

    const smallFileQueues = smallFileChunks.map((chunk) =>
      this.consumePullQueue(chunk, this.remote, this.local)
    );

    await Promise.all(smallFileQueues);

    const mediumFiles = pullFromRemote.filter((name) => {
      const { size } = currentLocal[name];

      return (
        size > Backups.MAX_SMALL_FILE_SIZE &&
        size <= Backups.MAX_MEDIUM_FILE_SIZE
      );
    });
    Logger.debug('Medium files: ', mediumFiles);

    const mediumFileChunks = _.chunk(
      mediumFiles,
      getChunkSize(
        mediumFiles.length,
        Backups.NUMBER_OF_PARALLEL_QUEUES_FOR_MEDIUM_FILES
      )
    );
    Logger.debug('Medium file chunks: ', mediumFileChunks);

    const mediumFileQueues = mediumFileChunks.map((chunk) =>
      this.consumePullQueue(chunk, this.remote, this.local)
    );

    await Promise.all(mediumFileQueues);

    const bigFiles = pullFromRemote.filter(
      (name) => currentLocal[name].size > Backups.MAX_MEDIUM_FILE_SIZE
    );

    Logger.debug('Big files: ', bigFiles);

    const bigFileChunks = _.chunk(
      bigFiles,
      getChunkSize(
        bigFiles.length,
        Backups.NUMBER_OF_PARALLEL_QUEUES_FOR_BIG_FILES
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
    }

    return result;
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
