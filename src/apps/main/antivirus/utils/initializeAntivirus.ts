import { logger } from '@/apps/shared/logger/logger';
import { buildPaymentsService } from '../../payments/builder';
import { PaymentsService } from '../../payments/service';
import clamAVServer from '../ClamAVDaemon';
import { clearDailyScan, scheduleDailyScan } from '../scanCronJob';

let paymentService: PaymentsService | null = null;
let isClamAVRunning = false;

let clamAVInitializationPromise: Promise<{ antivirusEnabled: boolean }> | null = null;

export async function initializeAntivirusIfAvailable() {
  isClamAVRunning = await clamAVServer.checkClamdAvailability();
  if (isClamAVRunning) {
    return { antivirusEnabled: true };
  }

  if (clamAVInitializationPromise) {
    return clamAVInitializationPromise;
  }

  clamAVInitializationPromise = initializeClamAV();
  return clamAVInitializationPromise;
}

async function initializeClamAV() {
  logger.info({ msg: '[INITIALIZING CLAM AV] Building payment service...' });
  paymentService = buildPaymentsService();

  logger.info({ msg: '[INITIALIZING CLAM AV] Checking user subscription...' });
  try {
    const availableProducts = await paymentService.getAvailableProducts();
    const isAntivirusEnabled = availableProducts.antivirus;

    if (isAntivirusEnabled) {
      logger.info({ msg: '[INITIALIZING CLAM AV] Antivirus is enabled. Starting ClamAV daemon...' });
      await clamAVServer.startClamdServer();

      logger.info({ msg: '[INITIALIZING CLAM AV] Waiting for ClamAV to be ready...' });
      await clamAVServer.waitForClamd();

      logger.info({ msg: '[INITIALIZING CLAM AV] ClamAV is running. Scheduling daily scan...' });
      scheduleDailyScan();

      isClamAVRunning = true;
      clamAVInitializationPromise = null;

      logger.info({ msg: '[INITIALIZING CLAM AV] ClamAV initialization completed successfully.' });
      return { antivirusEnabled: true };
    } else {
      logger.info({ msg: '[INITIALIZING CLAM AV] Antivirus not enabled for this user. Clearing any running ClamAV instance...' });
      clamAVInitializationPromise = null;

      await clearAntivirus();

      return { antivirusEnabled: false };
    }
  } catch (error) {
    logger.warn({ msg: '[INITIALIZING CLAM AV] Error initializing antivirus:', exc: error });
    clamAVInitializationPromise = null;
    await clearAntivirus();

    return { antivirusEnabled: false };
  }
}

export async function clearAntivirus() {
  if (isClamAVRunning) {
    logger.info({ msg: '[CLEARING ANTIVIRUS] Stopping ClamAV and clearing daily scan...' });
    clearDailyScan();
    clamAVServer.stopClamdServer();

    isClamAVRunning = false;
    logger.info({ msg: '[CLEARING ANTIVIRUS] ClamAV has been stopped successfully.' });
  } else {
    logger.info({ msg: '[CLEARING ANTIVIRUS] ClamAV is not running, nothing to stop.' });
  }
}
