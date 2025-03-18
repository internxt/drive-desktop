import { buildPaymentsService } from '../../payments/builder';
import { PaymentsService } from '../../payments/service';
import clamAVServer from '../ClamAVDaemon';
import { clearDailyScan, scheduleDailyScan } from '../scanCronJob';

let paymentService: PaymentsService | null = null;
let isClamAVRunning = false;
let clamAVInitializationPromise: Promise<{
  antivirusEnabled: boolean;
}> | null = null;

export async function initializeAntivirusIfAvailable() {
  if (isClamAVRunning) {
    return { antivirusEnabled: true };
  }

  if (clamAVInitializationPromise) {
    console.log('CLAM D IS INITIALIZING...');
    return clamAVInitializationPromise;
  }

  clamAVInitializationPromise = initializeClamAV();
  return clamAVInitializationPromise;
}

async function initializeClamAV() {
  if (!paymentService) {
    paymentService = buildPaymentsService();
  }

  try {
    const availableProducts = await paymentService.getAvailableProducts();
    const isAntivirusEnabled = availableProducts.antivirus;

    if (isAntivirusEnabled) {
      await clamAVServer.startClamdServer();
      await clamAVServer.waitForClamd();
      scheduleDailyScan();

      isClamAVRunning = true;
      clamAVInitializationPromise = null;
      return { antivirusEnabled: true };
    } else {
      clamAVInitializationPromise = null;
      return { antivirusEnabled: false };
    }
  } catch (error) {
    console.error('Error initializing antivirus:', error);
    clamAVInitializationPromise = null;
    return { antivirusEnabled: false };
  }
}

export async function clearAntivirusIfAvailable() {
  if (isClamAVRunning) {
    clearDailyScan();
    clamAVServer.stopClamdServer();
  }
}
