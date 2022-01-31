import Logger from 'electron-log';
import Process, { ProcessEvents } from '../process';

class Backups extends Process {
  async run(): Promise<void> {
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

    await Promise.all([
      this.consumePullQueue(pullFromRemote, this.remote, this.local),
      this.consumeDeleteQueue(deleteInRemote, this.remote),
    ]);
  }
}

/**
 * Enable event typing
 */
declare interface Backups {
  on<U extends keyof ProcessEvents>(event: U, listener: ProcessEvents[U]): this;

  emit<U extends keyof ProcessEvents>(
    event: U,
    ...args: Parameters<ProcessEvents[U]>
  ): boolean;
}

export default Backups;
