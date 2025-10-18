import { BrowserWindow } from 'electron';
import nodeSchedule from 'node-schedule';

export type TWorkerConfig = {
  worker: BrowserWindow | null;
  browserWindow: BrowserWindow | null;
  workerIsRunning: boolean;
  startingWorker: boolean;
  syncSchedule: nodeSchedule.Job | null;
  providerId: string | null;
};

export const workers: { [key: string]: TWorkerConfig } = {};
