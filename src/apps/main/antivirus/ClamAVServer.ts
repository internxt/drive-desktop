import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import net from 'net';
import path from 'path';

const SERVER_HOST = '127.0.0.1';
const SERVER_PORT = 3310;

let clamdProcess: ChildProcessWithoutNullStreams | null = null;
const directoryInstallWindows = path.join(__dirname, 'clamAV');

const startClamdServer = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const clamdPath = path.join(directoryInstallWindows, 'clamd.exe');
    const clamdConfigPath = path.join(directoryInstallWindows, 'clamd.conf');

    console.log('Starting clamd server...');
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

    resolve();
  });
};

const stopClamdServer = (): void => {
  if (clamdProcess) {
    console.log('Stopping clamd server...');
    clamdProcess.kill();
    clamdProcess = null;
  }
};

const checkClamdAvailability = (
  host = SERVER_HOST,
  port = SERVER_PORT
): Promise<boolean> => {
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

const waitForClamd = async (
  timeout = 60000,
  interval = 5000
): Promise<void> => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const isAvailable = await checkClamdAvailability();
    if (isAvailable) {
      return;
    }
    console.log('Waiting for clamd server to become available...');
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error('Timeout waiting for clamd server to become available');
};

const clamAVServer = {
  startClamdServer,
  stopClamdServer,
  waitForClamd,
};

export default clamAVServer;
