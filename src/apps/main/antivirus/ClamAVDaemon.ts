import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { app } from 'electron';
import net from 'net';
import path from 'path';
import Logger from 'electron-log';
import os from 'os';
import fs from 'fs';
const SERVER_HOST = '127.0.0.1';
const SERVER_PORT = 3310;

let clamdProcess: ChildProcessWithoutNullStreams | null = null;
const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'clamAV')
  : path.join(__dirname, '../../../../clamAV');

let timer: NodeJS.Timeout | null = null;

const userHomeDir = os.homedir();
const configDir = path.join(userHomeDir, '.config', 'internxt', 'clamav');
const logDir = path.join(configDir, 'logs');
const dbDir = path.join(configDir, 'db');
const logFilePath = path.join(logDir, 'clamd.log');

const ensureDirectories = () => {
  const dirs = [configDir, logDir, dbDir];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
      Logger.info(`Created directory: ${dir}`);
    }
  }

  if (!fs.existsSync(logFilePath)) {
    fs.writeFileSync(logFilePath, '', { mode: 0o644 });
    Logger.info(`Created log file: ${logFilePath}`);
  }

  const resourceDbDir = path.join(RESOURCES_PATH, 'db');
  if (fs.existsSync(resourceDbDir)) {
    const files = fs.readdirSync(resourceDbDir);
    for (const file of files) {
      const srcPath = path.join(resourceDbDir, file);
      const destPath = path.join(dbDir, file);
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(srcPath, destPath);
        Logger.info(`Copied database file: ${file}`);
      }
    }
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

const clamdPath = path.join(RESOURCES_PATH, '/bin/clamd');
const clamdConfigPath = path.join(RESOURCES_PATH, '/etc/clamd.conf');

const startClamdServer = async (): Promise<void> => {
  Logger.info('Starting clamd server...');

  try {
    ensureDirectories();

    return new Promise((resolve, reject) => {
      clamdProcess = spawn(clamdPath, [
        '--config-file',
        clamdConfigPath,
        '--foreground',
        '--debug',
      ]);

      clamdProcess.stdout.on('data', (data) => {
        const output = data.toString();
        Logger.info(`[clamd stdout]: ${output}`);

        if (output.includes('Listening daemon')) {
          Logger.info('clamd server started successfully (from stdout)');
          resolve();
        }
      });

      clamdProcess.stderr.on('data', (data) => {
        const errorMsg = data.toString();
        Logger.error(`[clamd stderr]: ${errorMsg}`);
        if (
          errorMsg.includes('ERROR: Can not open/parse the config file') ||
          errorMsg.includes('Fatal error') ||
          errorMsg.includes('ERROR: No supported database files found')
        ) {
          reject(new Error(errorMsg));
        }
      });

      clamdProcess.on('close', (code) => {
        if (code !== 0) {
          Logger.error(`clamd process exited with code ${code}`);
          clamdProcess = null;
          reject(new Error(`clamd process exited with code ${code}`));
        }
      });

      clamdProcess.on('error', (error) => {
        Logger.error('Failed to start clamd server:', error);
        reject(error);
      });

      setTimeout(() => {
        checkClamdAvailability()
          .then((available) => {
            if (available) {
              Logger.info('clamd server started successfully');
              resolve();
            } else {
              setTimeout(() => {
                checkClamdAvailability()
                  .then((available) => {
                    if (available) {
                      Logger.info(
                        'clamd server started successfully (second attempt)'
                      );
                      resolve();
                    } else {
                      reject(
                        new Error(
                          'clamd server failed to start after multiple attempts'
                        )
                      );
                    }
                  })
                  .catch(reject);
              }, 5000);
            }
          })
          .catch(reject);
      }, 5000);
    });
  } catch (error) {
    Logger.error('Error during clamd server startup:', error);
    throw error;
  }
};

const stopClamdServer = (): void => {
  if (clamdProcess) {
    Logger.info('Stopping clamd server...');
    clamdProcess.kill();
    clamdProcess = null;
  }

  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
};

const waitForClamd = async (
  timeout = 180000,
  interval = 5000
): Promise<void> => {
  const startTime = Date.now();
  let attempts = 0;

  Logger.info(
    `Waiting for clamd server to become available (timeout: ${timeout}ms, interval: ${interval}ms)...`
  );

  while (Date.now() - startTime < timeout) {
    attempts++;
    Logger.info(`Attempt ${attempts} to connect to clamd...`);

    try {
      const isAvailable = await checkClamdAvailability();
      if (isAvailable) {
        Logger.info(
          `Successfully connected to clamd after ${attempts} attempts`
        );
        return;
      }
      Logger.info(
        `Clamd not available yet, waiting ${interval}ms before next attempt...`
      );
    } catch (error) {
      Logger.error(`Error checking clamd availability: ${error}`);
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  const timeElapsed = Date.now() - startTime;
  throw new Error(
    `Timeout (${timeElapsed}ms) waiting for clamd server to become available after ${attempts} attempts`
  );
};

const clamAVServer = {
  startClamdServer,
  checkClamdAvailability,
  stopClamdServer,
  waitForClamd,
};

export default clamAVServer;
