import Loki from 'lokijs';
import { TCheckpoints } from './checkpoints-schema';
import { PATHS } from '@/core/electron/paths';

const db = new Loki(PATHS.CHECKPOINTS_DB, {
  autoload: true,
  autosave: true,
  autosaveInterval: 5000,
  autoloadCallback: initCollection,
});

export let checkpointsDb: Collection<TCheckpoints>;

export function addCollection(db: Loki) {
  return db.addCollection('checkpoints', { unique: ['key'] }) as Collection<TCheckpoints>;
}

function initCollection() {
  checkpointsDb = db.getCollection('checkpoints');
  if (!checkpointsDb) {
    checkpointsDb = addCollection(db);
  }
}

export function setCheckpointsDb(collection: Collection<TCheckpoints>) {
  checkpointsDb = collection;
}
