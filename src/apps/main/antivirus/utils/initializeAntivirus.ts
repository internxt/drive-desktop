import { buildPaymentsService } from '../../payments/builder';
import { PaymentsService } from '../../payments/service';
import * as clamAVServer from '../ClamAVDaemon';
import { isWindowsDefenderRealTimeProtectionActive } from '../../ipcs/ipcMainAntivirus';
import { clearDailyScan, scheduleDailyScan } from '../scanCronJob';
import { logger } from '@/apps/shared/logger/logger';

let paymentService: PaymentsService | null = null;
let isClamAVRunning = false;
let clamAVInitializationPromise: Promise<{ antivirusEnabled: boolean }> | null = null;

export async function initializeAntivirusIfAvailable() {
  paymentService = buildPaymentsService();

  try {
    const availableProducts = await paymentService.getAvailableProducts();
    const isAntivirusEnabled = availableProducts.antivirus;

    if (!isAntivirusEnabled) {
      logger.debug({
        tag: 'ANTIVIRUS',
        msg: 'Antivirus not enabled for this user. Clearing any running ClamAV instance.',
      });

      clearAntivirus();

      return { antivirusEnabled: false };
    }

    // Check if Windows Defender is active first
    const isWindowsDefenderActive = await isWindowsDefenderRealTimeProtectionActive();

    if (isWindowsDefenderActive) {
      logger.debug({
        tag: 'ANTIVIRUS',
        msg: 'Using Windows defender.',
      });
      return { antivirusEnabled: true };
    }

    isClamAVRunning = await clamAVServer.checkClamdAvailability();

    if (isClamAVRunning) {
      return { antivirusEnabled: true };
    }

    if (clamAVInitializationPromise) {
      return clamAVInitializationPromise;
    }

    clamAVInitializationPromise = initializeClamAV();
    return clamAVInitializationPromise;
  } catch (error) {
    logger.warn({
      tag: 'ANTIVIRUS',
      msg: 'Error initializing antivirus.',
      exc: error,
    });

    clamAVInitializationPromise = null;
    clearAntivirus();

    return { antivirusEnabled: false };
  }
}

export async function initializeClamAV() {
  await clamAVServer.startClamdServer();
  await clamAVServer.waitForClamd();

  logger.debug({
    tag: 'ANTIVIRUS',
    msg: 'ClamAV is running. Scheduling daily scan.',
  });

  scheduleDailyScan();

  isClamAVRunning = true;
  clamAVInitializationPromise = null;

  return { antivirusEnabled: true };
}

export function clearAntivirus() {
  if (isClamAVRunning) {
    clearDailyScan();
    clamAVServer.stopClamdServer();
    isClamAVRunning = false;

    logger.debug({
      tag: 'ANTIVIRUS',
      msg: 'ClamAV has been stopped successfully.',
    });
  }
}
