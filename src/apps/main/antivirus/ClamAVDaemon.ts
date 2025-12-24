import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import net from 'net';
import path from 'path';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import fs from 'fs';
import { AntivirusError } from './AntivirusError';
import {
  SERVER_HOST,
  SERVER_PORT,
  DIRECTORY_MODE,
  FILE_MODE,
  RESOURCES_PATH,
  configDir,
  logDir,
  dbDir,
  logFilePath,
  freshclamLogPath,
  clamdPath,
  DEFAULT_CLAMD_WAIT_TIMEOUT,
  DEFAULT_CLAMD_CHECK_INTERVAL,
} from './constants';

let clamdProcess: ChildProcessWithoutNullStreams | null = null;
let timer: NodeJS.Timeout | null = null;
let serverStartAttempts = 0;
const MAX_SERVER_START_ATTEMPTS = 3;
let lastRestartTime = 0;
const MIN_RESTART_INTERVAL = 30000; // 30 seconds minimum between restarts

export const ensureDirectories = () => {
  const dirs = [configDir, logDir, dbDir];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: DIRECTORY_MODE });
      logger.debug({
        tag: 'ANTIVIRUS',
        msg: `[CLAM_AVD] Created directory: ${dir}`,
      });
    }
  }

  if (!fs.existsSync(logFilePath)) {
    fs.writeFileSync(logFilePath, '', { mode: FILE_MODE });
    logger.debug({
      tag: 'ANTIVIRUS',
      msg: `[CLAM_AVD] Created log file: ${logFilePath}`,
    });
  }

  const resourceDbDir = path.join(RESOURCES_PATH, 'db');
  if (fs.existsSync(resourceDbDir)) {
    const files = fs.readdirSync(resourceDbDir);
    for (const file of files) {
      const srcPath = path.join(resourceDbDir, file);
      const destPath = path.join(dbDir, file);
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(srcPath, destPath);
        logger.debug({
          tag: 'ANTIVIRUS',
          msg: `[CLAM_AVD] Copied database file: ${file}`,
        });
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
  const originalClamdConfig = fs.readFileSync(path.join(RESOURCES_PATH, '/etc/clamd.conf'), 'utf8');
  const originalFreshclamConfig = fs.readFileSync(path.join(RESOURCES_PATH, '/etc/freshclam.conf'), 'utf8');

  const modifiedClamdConfig = originalClamdConfig
    .replace('LOGFILE_PATH', logFilePath)
    .replace('DATABASE_DIRECTORY', dbDir);

  const modifiedFreshclamConfig = originalFreshclamConfig
    .replace('DATABASE_DIRECTORY', dbDir)
    .replace('FRESHCLAM_LOG_PATH', freshclamLogPath);

  fs.writeFileSync(tempClamdConfigPath, modifiedClamdConfig);
  fs.writeFileSync(tempFreshclamConfigPath, modifiedFreshclamConfig);

  logger.debug({
    tag: 'ANTIVIRUS',
    msg: `[CLAM_AVD] Created modified config files in ${configDir}`,
  });

  return {
    clamdConfigPath: tempClamdConfigPath,
    freshclamConfigPath: tempFreshclamConfigPath,
  };
};

const restartClamdServerIfNeeded = async (): Promise<boolean> => {
  const now = Date.now();

  if (now - lastRestartTime < MIN_RESTART_INTERVAL) {
    logger.warn({
      tag: 'ANTIVIRUS',
      msg: '[CLAM_AVD] Refusing to restart clamd too quickly after previous restart',
    });
    return false;
  }

  if (now - lastRestartTime > 300000) {
    serverStartAttempts = 0;
  }

  if (serverStartAttempts >= MAX_SERVER_START_ATTEMPTS) {
    logger.error({
      tag: 'ANTIVIRUS',
      msg: `[CLAM_AVD] Exceeded maximum clamd restart attempts (${MAX_SERVER_START_ATTEMPTS})`,
    });
    return false;
  }

  try {
    serverStartAttempts++;
    lastRestartTime = now;

    stopClamdServer();

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await startClamdServer();
    logger.debug({
      tag: 'ANTIVIRUS',
      msg: `[CLAM_AVD] Successfully restarted clamd server (attempt ${serverStartAttempts})`,
    });
    return true;
  } catch (error) {
    logger.error({
      tag: 'ANTIVIRUS',
      msg: `[CLAM_AVD] Failed to restart clamd server (attempt ${serverStartAttempts}):`,
      error,
    });
    return false;
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

export const getEnvWithLibraryPath = () => {
  const env = { ...process.env };
  const libPath = path.join(RESOURCES_PATH, 'lib');

  env.LD_LIBRARY_PATH = `${libPath}:${env.LD_LIBRARY_PATH || ''}`;

  logger.debug({
    tag: 'ANTIVIRUS',
    msg: `[CLAM_AVD] Setting library path to: ${libPath}`,
  });
  return env;
};

const startClamdServer = async (): Promise<void> => {
  logger.debug({
    tag: 'ANTIVIRUS',
    msg: '[CLAM_AVD] Starting clamd server...',
  });

  try {
    ensureDirectories();

    // Prepare configuration files with proper paths
    const { clamdConfigPath } = prepareConfigFiles();

    const env = getEnvWithLibraryPath();

    return new Promise((resolve, reject) => {
      clamdProcess = spawn(clamdPath, ['--config-file', clamdConfigPath, '--foreground', '--debug'], { env });

      const setupProcessMonitoring = () => {
        clamdProcess?.on('close', async (code) => {
          if (code !== 0 && code !== null) {
            logger.error({
              tag: 'ANTIVIRUS',
              msg: `[CLAM_AVD] clamd process unexpectedly exited with code ${code}, attempting restart`,
            });
            clamdProcess = null;

            const success = await restartClamdServerIfNeeded();
            if (!success) {
              logger.error({
                tag: 'ANTIVIRUS',
                msg: '[CLAM_AVD] Failed to automatically restart clamd server',
              });
            }
          }
        });
      };

      clamdProcess.stdout.on('data', (data) => {
        const output = data.toString();
        logger.debug({
          tag: 'ANTIVIRUS',
          msg: `[CLAM_AVD] [clamd stdout]: ${output}`,
        });

        if (output.includes('Listening daemon')) {
          logger.debug({
            tag: 'ANTIVIRUS',
            msg: '[CLAM_AVD] clamd server started successfully (from stdout)',
          });
          setupProcessMonitoring();
          resolve();
        }
      });

      clamdProcess.stderr.on('data', (data) => {
        const errorMsg = data.toString();
        logger.error({
          tag: 'ANTIVIRUS',
          msg: `[CLAM_AVD] [clamd stderr]: ${errorMsg}`,
        });
        if (
          errorMsg.includes('ERROR: Can not open/parse the config file') ||
          errorMsg.includes('Fatal error') ||
          errorMsg.includes('ERROR: No supported database files found')
        ) {
          reject(AntivirusError.clamdConfigError(errorMsg));
        }
      });

      clamdProcess.on('error', (error) => {
        logger.error({
          tag: 'ANTIVIRUS',
          msg: '[CLAM_AVD] Failed to start clamd server:',
          error,
        });
        reject(AntivirusError.clamdStartFailed('Failed to start clamd server', error));
      });

      setTimeout(() => {
        checkClamdAvailability()
          .then((available) => {
            if (available) {
              logger.debug({
                tag: 'ANTIVIRUS',
                msg: '[CLAM_AVD] clamd server started successfully',
              });
              resolve();
            } else {
              setTimeout(() => {
                checkClamdAvailability()
                  .then((available) => {
                    if (available) {
                      logger.debug({
                        tag: 'ANTIVIRUS',
                        msg: '[CLAM_AVD] clamd server started successfully (second attempt)',
                      });
                      resolve();
                    } else {
                      reject(AntivirusError.clamdNotAvailable('clamd server failed to start after multiple attempts'));
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
    logger.error({
      tag: 'ANTIVIRUS',
      msg: '[CLAM_AVD] Error during clamd server startup:',
      error,
    });
    throw AntivirusError.clamdStartFailed('Error during clamd server startup', error);
  }
};

const stopClamdServer = (): void => {
  if (clamdProcess) {
    logger.debug({
      tag: 'ANTIVIRUS',
      msg: '[CLAM_AVD] Stopping clamd server...',
    });
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
  interval = DEFAULT_CLAMD_CHECK_INTERVAL,
): Promise<void> => {
  const startTime = Date.now();
  let attempts = 0;
  let available = false;

  logger.debug({
    tag: 'ANTIVIRUS',
    msg: `[CLAM_AVD] Waiting for clamd server to become available (timeout: ${timeout}ms, interval: ${interval}ms)...`,
  });

  while (Date.now() - startTime < timeout && !available) {
    attempts++;
    try {
      available = await checkClamdAvailability();

      if (available) {
        logger.debug({
          tag: 'ANTIVIRUS',
          msg: `[CLAM_AVD] clamd server is available after ${attempts} attempts (${Date.now() - startTime}ms)`,
        });
        return;
      }

      if (attempts >= 3 && attempts % 3 === 0) {
        logger.warn({
          tag: 'ANTIVIRUS',
          msg: `[CLAM_AVD] clamd server not responding after ${attempts} attempts, trying to restart...`,
        });
        await restartClamdServerIfNeeded();
      }

      logger.debug({
        tag: 'ANTIVIRUS',
        msg: `[CLAM_AVD] clamd server not yet available (attempt ${attempts}), waiting ${interval}ms...`,
      });

      await new Promise((resolve) => setTimeout(resolve, interval));
    } catch (error) {
      logger.error({
        tag: 'ANTIVIRUS',
        msg: `[CLAM_AVD] Error checking clamd availability (attempt ${attempts}):`,
        error,
      });
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  if (!available) {
    const message = `clamd server not available after ${attempts} attempts (${Date.now() - startTime}ms)`;
    logger.error({
      tag: 'ANTIVIRUS',
      msg: `[CLAM_AVD] ${message}`,
    });
    throw AntivirusError.clamdNotAvailable(message);
  }
};

const clamAVServer = {
  startClamdServer,
  checkClamdAvailability,
  stopClamdServer,
  waitForClamd,
};

export default clamAVServer;
