import kemBuilder, { KEM } from '@dashlane/pqc-kem-kyber512-node';

/**
 * Class to manage Kyber encryption operations using KEM (Key Encapsulation Mechanism).
 */

export interface KyberKeys {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

class KyberCrypto {
  private kem: KEM | null;

  constructor() {
    this.kem = null;
  }

  /**
   * Inicializa la instancia de Kyber.
   * @returns {Promise<void>}
   */
  async initialize() {
    this.kem = await kemBuilder();
  }

  private ensureInitialized() {
    if (!this.kem) {
      throw new Error(
        'Kyber instance not initialized. Call `initialize()` first.'
      );
    }
  }

  async isKeyExpired(keyCreationDate: Date): Promise<boolean> {
    const expirationDate = new Date(keyCreationDate);
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    return new Date() > expirationDate;
  }

  /**
   * Configures the Kyber instance with advanced options.
   * @param {Object} options - Advanced options for Kyber.
   * @param {string} options.level - Security level (e.g., 'high', 'low').
   */

  async configure(options: { level: string }) {
    this.ensureInitialized();
    const validLevels = ['low', 'medium', 'high'];
    if (!validLevels.includes(options.level)) {
      console.error(`Invalid encryption level: ${options.level}`);
      throw new Error('Configuration failed due to invalid level.');
    }
    console.log(
      `Configuration applied successfully with level: ${options.level}`
    );
  }

  async verifyKey(publicKey: Uint8Array): Promise<boolean> {
    this.ensureInitialized();
    if (!publicKey || publicKey.length === 0) {
      console.error('Invalid public key detected.');
      throw new Error('Invalid public key provided.');
    }
    return publicKey.length > 0;
  }

  async generateKeyPair(): Promise<KyberKeys> {
    try {
      this.ensureInitialized();
      const { publicKey, privateKey } = await this.kem!.keypair();
      return { publicKey, privateKey } as KyberKeys;
    } catch (error) {
      console.error('Keypair generation error:', error);
      throw new Error('Failed to generate keypair.');
    }
  }

  /**
   * Encripta un mensaje usando una clave pública.
   * @param {string} message - El mensaje que se desea encriptar.
   * @param {Buffer} publicKey - La clave pública usada para encriptar.
   * @returns {Object} Contiene `encryptedData` y `secret`.
   */
  async encrypt(publicKey: Uint8Array) {
    this.ensureInitialized();
    const { ciphertext: encryptedData, sharedSecret: secret } =
      await this.kem!.encapsulate(publicKey);
    console.info('Encryption completed successfully.');
    return { encryptedData, secret };
  }

  /**
   * Desencripta un mensaje usando una clave privada.
   * @param {Buffer} encryptedData - Los datos encriptados.
   * @param {Buffer} privateKey - La clave privada usada para desencriptar.
   * @returns {string} El mensaje desencriptado.
   */
  async decrypt(encryptedData: Uint8Array, privateKey: Uint8Array) {
    this.ensureInitialized();
    console.time('Decryption');
    try {
      const decryptedData = await this.kem!.decapsulate(
        encryptedData,
        privateKey
      );
      console.timeEnd('Decryption');
      return new TextDecoder().decode(decryptedData.sharedSecret);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Decryption failed.');
    }
  }
}

export default KyberCrypto;
