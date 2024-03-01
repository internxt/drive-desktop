import { ipcMain } from 'electron';
import KyberCrypto from '../../../context/shared/infrastructure/kyber-encryption';

const kyber = new KyberCrypto();

(async () => {
  try {
    await kyber.initialize();
    console.log('KyberCrypto initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize KyberCrypto:', error);
  }
})();

ipcMain.handle('generate-key-pair', async () => {
  try {
    const { publicKey, privateKey } = await kyber.generateKeyPair();
    return {
      publicKey: publicKey,
      privateKey: privateKey,
    };
  } catch (error) {
    console.error('Error generating key pair:', error);
    throw error;
  }
});

ipcMain.handle('encrypt', async (_, publicKey) => {
  try {
    const result = await kyber.encrypt(publicKey);
    return {
      encryptedData: result.encryptedData,
      secret: result.secret,
    };
  } catch (error) {
    console.error('Error during encryption:', error);
    throw error;
  }
});

ipcMain.handle('decrypt', async (_, encryptedData, privateKey) => {
  try {
    const decryptedMessage = await kyber.decrypt(encryptedData, privateKey);
    return decryptedMessage;
  } catch (error) {
    console.error('Error during decryption:', error);
    throw error;
  }
});
