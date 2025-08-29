import { stat } from './services/stat';
import { syncWalk } from './services/sync-walk';
import { walk } from './services/walk';

export const fileSystem = {
  stat,
  walk,
  syncWalk,
};
