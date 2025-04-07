import { BrowserWindow } from 'electron';
import nodeSchedule from 'node-schedule';

export type TWorkerConfig = {
  worker: BrowserWindow | null;
  workerIsRunning: boolean;
  startingWorker: boolean;
  syncSchedule: nodeSchedule.Job | null;
};

export const workers: { [key: string]: TWorkerConfig } = {};
