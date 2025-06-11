import { buildPaymentsService } from '../../payments/builder';
import { PaymentsService } from '../../payments/service';
import * as clamAVServer from '../ClamAVDaemon';
import { clearDailyScan, scheduleDailyScan } from '../scanCronJob';
import { logger } from '@/apps/shared/logger/logger';

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
  paymentService = buildPaymentsService();

  try {
    const availableProducts = await paymentService.getAvailableProducts();
    const isAntivirusEnabled = availableProducts.antivirus;

    if (isAntivirusEnabled) {
      await clamAVServer.startClamdServer();
      await clamAVServer.waitForClamd();

      logger.debug({ msg: '[INITIALIZING CLAM AV] ClamAV is running. Scheduling daily scan...' });
      // scheduleDailyScan();

      isClamAVRunning = true;
      clamAVInitializationPromise = null;

      return { antivirusEnabled: true };
    } else {
      logger.debug({ msg: '[INITIALIZING CLAM AV] Antivirus not enabled for this user. Clearing any running ClamAV instance...' });
      clamAVInitializationPromise = null;

      clearAntivirus();

      return { antivirusEnabled: false };
    }
  } catch (error) {
    logger.warn({ msg: '[INITIALIZING CLAM AV] Error initializing antivirus:', exc: error });
    clamAVInitializationPromise = null;
    clearAntivirus();

    return { antivirusEnabled: false };
  }
}

export function clearAntivirus() {
  if (isClamAVRunning) {
    clearDailyScan();
    clamAVServer.stopClamdServer();

    isClamAVRunning = false;
    logger.debug({ msg: '[CLEARING ANTIVIRUS] ClamAV has been stopped successfully.' });
  }
}
