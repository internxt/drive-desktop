import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import net from 'net';
import path from 'path';
import Logger from 'electron-log';
import fs from 'fs';
import { AntivirusError } from './AntivirusError';
import {
  SERVER_HOST,
  SERVER_PORT,
  DIRECTORY_MODE,
  FILE_MODE,
  RESOURCES_PATH,
  userHomeDir,
  configDir,
  logDir,
  dbDir,
  logFilePath,
  freshclamLogPath,
  clamdPath,
  clamdConfigTemplatePath,
  DEFAULT_CLAMD_WAIT_TIMEOUT,
  DEFAULT_CLAMD_CHECK_INTERVAL,
} from './constants';

let clamdProcess: ChildProcessWithoutNullStreams | null = null;
let timer: NodeJS.Timeout | null = null;

export const ensureDirectories = () => {
  const dirs = [configDir, logDir, dbDir];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: DIRECTORY_MODE });
      Logger.info(`[CLAM_AVD] Created directory: ${dir}`);
    }
  }

  if (!fs.existsSync(logFilePath)) {
    fs.writeFileSync(logFilePath, '', { mode: FILE_MODE });
    Logger.info(`[CLAM_AVD] Created log file: ${logFilePath}`);
  }

  const resourceDbDir = path.join(RESOURCES_PATH, 'db');
  if (fs.existsSync(resourceDbDir)) {
    const files = fs.readdirSync(resourceDbDir);
    for (const file of files) {
      const srcPath = path.join(resourceDbDir, file);
      const destPath = path.join(dbDir, file);
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(srcPath, destPath);
        Logger.info(`[CLAM_AVD] Copied database file: ${file}`);
      }
    }
  }
};

/**
 * Prepares the configuration files by replacing placeholder variables with actual paths
 * This allows config files to be portable and work in any user environment
 */
export const prepareConfigFiles = (): {
  clamdConfigPath: string;
  freshclamConfigPath: string;
} => {
  // Create temporary modified configs in the user's config directory
  const tempClamdConfigPath = path.join(configDir, 'clamd.conf');
  const tempFreshclamConfigPath = path.join(configDir, 'freshclam.conf');

  // Read the original config files from resources
  const originalClamdConfig = fs.readFileSync(
    path.join(RESOURCES_PATH, '/etc/clamd.conf'),
    'utf8'
  );
  const originalFreshclamConfig = fs.readFileSync(
    path.join(RESOURCES_PATH, '/etc/freshclam.conf'),
    'utf8'
  );

  const modifiedClamdConfig = originalClamdConfig
    .replace('LOGFILE_PATH', logFilePath)
    .replace('DATABASE_DIRECTORY', dbDir);

  const modifiedFreshclamConfig = originalFreshclamConfig
    .replace('DATABASE_DIRECTORY', dbDir)
    .replace('FRESHCLAM_LOG_PATH', freshclamLogPath);

  fs.writeFileSync(tempClamdConfigPath, modifiedClamdConfig);
  fs.writeFileSync(tempFreshclamConfigPath, modifiedFreshclamConfig);

  Logger.info(`[CLAM_AVD] Created modified config files in ${configDir}`);

  return {
    clamdConfigPath: tempClamdConfigPath,
    freshclamConfigPath: tempFreshclamConfigPath,
  };
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

    client.on('error', (error) => {
      client.destroy();
      Logger.debug(`[CLAM_AVD] Connection to clamd failed: ${error.message}`);
      resolve(false);
    });
  });
};

export const getEnvWithLibraryPath = () => {
  const env = { ...process.env };
  const libPath = path.join(RESOURCES_PATH, 'lib');

  env.LD_LIBRARY_PATH = `${libPath}:${env.LD_LIBRARY_PATH || ''}`;

  Logger.info(`[CLAM_AVD] Setting library path to: ${libPath}`);
  return env;
};

const startClamdServer = async (): Promise<void> => {
  Logger.info('[CLAM_AVD] Starting clamd server...');

  try {
    ensureDirectories();

    // Prepare configuration files with proper paths
    const { clamdConfigPath } = prepareConfigFiles();

    const env = getEnvWithLibraryPath();

    return new Promise((resolve, reject) => {
      clamdProcess = spawn(
        clamdPath,
        ['--config-file', clamdConfigPath, '--foreground', '--debug'],
        { env }
      );

      clamdProcess.stdout.on('data', (data) => {
        const output = data.toString();
        Logger.info(`[CLAM_AVD] [clamd stdout]: ${output}`);

        if (output.includes('Listening daemon')) {
          Logger.info(
            '[CLAM_AVD] clamd server started successfully (from stdout)'
          );
          resolve();
        }
      });

      clamdProcess.stderr.on('data', (data) => {
        const errorMsg = data.toString();
        Logger.error(`[CLAM_AVD] [clamd stderr]: ${errorMsg}`);
        if (
          errorMsg.includes('ERROR: Can not open/parse the config file') ||
          errorMsg.includes('Fatal error') ||
          errorMsg.includes('ERROR: No supported database files found')
        ) {
          reject(AntivirusError.clamdConfigError(errorMsg));
        }
      });

      clamdProcess.on('close', (code) => {
        if (code !== 0) {
          Logger.error(`[CLAM_AVD] clamd process exited with code ${code}`);
          clamdProcess = null;
          reject(
            AntivirusError.clamdStartFailed(
              `clamd process exited with code ${code}`
            )
          );
        }
      });

      clamdProcess.on('error', (error) => {
        Logger.error('[CLAM_AVD] Failed to start clamd server:', error);
        reject(
          AntivirusError.clamdStartFailed('Failed to start clamd server', error)
        );
      });

      setTimeout(() => {
        checkClamdAvailability()
          .then((available) => {
            if (available) {
              Logger.info('[CLAM_AVD] clamd server started successfully');
              resolve();
            } else {
              setTimeout(() => {
                checkClamdAvailability()
                  .then((available) => {
                    if (available) {
                      Logger.info(
                        '[CLAM_AVD] clamd server started successfully (second attempt)'
                      );
                      resolve();
                    } else {
                      reject(
                        AntivirusError.clamdNotAvailable(
                          'clamd server failed to start after multiple attempts'
                        )
                      );
                    }
                  })
                  .catch(reject);
              }, DEFAULT_CLAMD_CHECK_INTERVAL);
            }
          })
          .catch(reject);
      }, DEFAULT_CLAMD_CHECK_INTERVAL);
    });
  } catch (error) {
    Logger.error('[CLAM_AVD] Error during clamd server startup:', error);
    throw AntivirusError.clamdStartFailed(
      'Error during clamd server startup',
      error
    );
  }
};

const stopClamdServer = (): void => {
  if (clamdProcess) {
    Logger.info('[CLAM_AVD] Stopping clamd server...');
    clamdProcess.kill();
    clamdProcess = null;
  }

  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
};

const waitForClamd = async (
  timeout = DEFAULT_CLAMD_WAIT_TIMEOUT,
  interval = DEFAULT_CLAMD_CHECK_INTERVAL
): Promise<void> => {
  const startTime = Date.now();
  let attempts = 0;

  Logger.info(
    `[CLAM_AVD] Waiting for clamd server to become available (timeout: ${timeout}ms, interval: ${interval}ms)...`
  );

  while (Date.now() - startTime < timeout) {
    attempts++;
    Logger.info(`[CLAM_AVD] Attempt ${attempts} to connect to clamd...`);

    try {
      const isAvailable = await checkClamdAvailability();
      if (isAvailable) {
        Logger.info(
          `[CLAM_AVD] Successfully connected to clamd after ${attempts} attempts`
        );
        return;
      }
      Logger.info(
        `[CLAM_AVD] Clamd not available yet, waiting ${interval}ms before next attempt...`
      );
    } catch (error) {
      Logger.error('[CLAM_AVD] Error checking clamd availability:', error);
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  const timeElapsed = Date.now() - startTime;
  throw AntivirusError.clamdTimeout(attempts, timeout);
};

const clamAVServer = {
  startClamdServer,
  checkClamdAvailability,
  stopClamdServer,
  waitForClamd,
};

export default clamAVServer;
