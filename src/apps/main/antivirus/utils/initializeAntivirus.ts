import { buildPaymentsService } from '../../payments/builder';
import { PaymentsService } from '../../payments/service';
import clamAVServer from '../ClamAVDaemon';
import { clearDailyScan, scheduleDailyScan } from '../scanCronJob';
import Logger from 'electron-log';

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
  if (!paymentService) {
    Logger.info('[INITIALIZING CLAM AV] Building payment service...');
    paymentService = buildPaymentsService();
  }

  Logger.info('[INITIALIZING CLAM AV] Checking user subscription...');
  try {
    const availableProducts = await paymentService.getAvailableProducts();
    const isAntivirusEnabled = availableProducts.antivirus;

    if (isAntivirusEnabled) {
      Logger.info('[INITIALIZING CLAM AV] Antivirus is enabled. Starting ClamAV daemon...');
      await clamAVServer.startClamdServer();

      Logger.info('[INITIALIZING CLAM AV] Waiting for ClamAV to be ready...');
      await clamAVServer.waitForClamd();

      Logger.info('[INITIALIZING CLAM AV] ClamAV is running. Scheduling daily scan...');
      scheduleDailyScan();

      isClamAVRunning = true;
      clamAVInitializationPromise = null;

      Logger.info('[INITIALIZING CLAM AV] ClamAV initialization completed successfully.');
      return { antivirusEnabled: true };
    } else {
      Logger.info('[INITIALIZING CLAM AV] Antivirus not enabled for this user. Clearing any running ClamAV instance...');
      clamAVInitializationPromise = null;

      await clearAntivirus();

      return { antivirusEnabled: false };
    }
  } catch (error) {
    console.error('[INITIALIZING CLAM AV] Error initializing antivirus:', error);
    clamAVInitializationPromise = null;
    await clearAntivirus();

    return { antivirusEnabled: false };
  }
}

export async function clearAntivirus() {
  if (isClamAVRunning) {
    Logger.info('[CLEARING ANTIVIRUS] Stopping ClamAV and clearing daily scan...');
    clearDailyScan();
    clamAVServer.stopClamdServer();

    isClamAVRunning = false;
    Logger.info('[CLEARING ANTIVIRUS] ClamAV has been stopped successfully.');
  } else {
    Logger.info('[CLEARING ANTIVIRUS] ClamAV is not running, nothing to stop.');
  }
}
