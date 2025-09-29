import { logger } from '@/apps/shared/logger/logger';
import { spawn, ChildProcessWithoutNullStreams } from 'node:child_process';
import { app } from 'electron';
import net from 'node:net';
import path from 'node:path';
import { cwd } from 'node:process';

const SERVER_HOST = '127.0.0.1';
const SERVER_PORT = 3310;

let clamdProcess: ChildProcessWithoutNullStreams | null = null;
const RESOURCES_PATH = app.isPackaged ? path.join(process.resourcesPath, 'clamAV') : path.join(cwd(), 'clamAV');

let timer: NodeJS.Timeout | null = null;

export const startClamdServer = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const clamdPath = path.join(RESOURCES_PATH, 'clamd.exe');
    const clamdConfigPath = path.join(RESOURCES_PATH, 'clamd.conf');

    clamdProcess = spawn(clamdPath, ['-c', clamdConfigPath]);

    clamdProcess.stdout.on('data', (data) => {
      console.log(`[clamd stdout]: ${data}`);
    });

    clamdProcess.stderr.on('data', (data) => {
      console.error(`[clamd stderr]: ${data}`);
      reject();
    });

    clamdProcess.on('close', (code) => {
      console.log(`clamd server exited with code ${code}`);
      clamdProcess = null;
    });

    clamdProcess.on('error', (error) => {
      logger.error({ msg: 'Failed to start clamd server:', error });
      reject();
    });

    resolve();
  });
};

export const stopClamdServer = (): void => {
  if (clamdProcess) {
    console.log('Stopping clamd server...');
    clamdProcess.kill();
    clamdProcess = null;
  }

  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
};

export const checkClamdAvailability = (host = SERVER_HOST, port = SERVER_PORT): Promise<boolean> => {
  return new Promise((resolve) => {
    const client = new net.Socket();

    client.connect(port, host, () => {
      client.end();
      resolve(true);
    });

    client.on('error', () => {
      client.destroy();
      resolve(false);
    });
  });
};

export const waitForClamd = async (timeout = 180000, interval = 5000): Promise<void> => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const isAvailable = await checkClamdAvailability();
    if (isAvailable) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error('Timeout waiting for clamd server to become available');
};
