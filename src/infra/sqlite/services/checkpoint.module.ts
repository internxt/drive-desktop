import { createOrUpdate } from './checkpoint/create-or-update';
import { getCheckpoint } from './checkpoint/get-checkpoint';

export const CheckpointModule = {
  getCheckpoint,
  createOrUpdate,
};
