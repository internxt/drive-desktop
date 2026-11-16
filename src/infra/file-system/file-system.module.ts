import { moveWithoutOverwrite } from './services/move-without-overwrite';
import { stat } from './services/stat';
import { walk } from './services/walk';

export const fileSystem = {
  stat,
  walk,
  moveWithoutOverwrite,
};
