import Loki from 'lokijs';
import { TCheckpoints } from './checkpoints-schema';
import { PATHS } from '@/core/electron/paths';
import { logger } from '@/apps/shared/logger/logger';

const db = new Loki(PATHS.LOKIJS_DB, {
  autoload: true,
  autosave: true,
  autosaveInterval: 5000,
  /**
   * v2.5.6 Daniel Jiménez
   * If we don't add this it won't retrieve the checkpoint in the sync.
   */
  autoloadCallback: initCollection,
});

export let checkpointsDb: Collection<TCheckpoints>;

export function addCollection(db: Loki) {
  return db.addCollection('checkpoints', { unique: ['key'] }) as Collection<TCheckpoints>;
}

function initCollection() {
  logger.debug({ msg: 'Init checkpoints collection' });

  checkpointsDb = db.getCollection('checkpoints');
  if (!checkpointsDb) {
    checkpointsDb = addCollection(db);
  }
}

/**
 * v2.5.6 Daniel Jiménez
 * If we don't add this, it will fail in the migrate.ts file.
 */
initCollection();

export function setCheckpointsDb(collection: Collection<TCheckpoints>) {
  checkpointsDb = collection;
}
