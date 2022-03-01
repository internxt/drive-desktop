import Logger from 'electron-log';
import Process, { ProcessEvents, ProcessResult } from '../process';

class Backups extends Process {
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

    await Promise.all([
      this.consumePullQueue(pullFromRemote, this.remote, this.local),
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
