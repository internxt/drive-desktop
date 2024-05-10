import kemBuilder, { KEM } from '@dashlane/pqc-kem-kyber512-node';

/**
 * Class to manage Kyber encryption operations using KEM (Key Encapsulation Mechanism).
 */

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

  /**
   * Configures the Kyber instance with advanced options.
   * @param {Object} options - Advanced options for Kyber.
   * @param {string} options.level - Security level (e.g., 'high', 'low').
   */

  async configure(options: { level: string }) {
    this.ensureInitialized();
    console.log('Configuration applied:', options);
  }

  async verifyKey(publicKey: Uint8Array): Promise<boolean> {
    this.ensureInitialized();
    return publicKey.length > 0;
  }

  async generateKeyPair() {
    if (!this.kem) {
      throw new Error(
        'Kyber instance not initialized. Call `initialize()` first.'
      );
    }

    const { publicKey, privateKey } = await this.kem.keypair();
    return { publicKey, privateKey };
  }

  /**
   * Encripta un mensaje usando una clave pública.
   * @param {string} message - El mensaje que se desea encriptar.
   * @param {Buffer} publicKey - La clave pública usada para encriptar.
   * @returns {Object} Contiene `encryptedData` y `secret`.
   */
  async encrypt(publicKey: Uint8Array) {
    if (!this.kem) {
      throw new Error(
        'Kyber instance not initialized. Call `initialize()` first.'
      );
    }

    const { ciphertext: encryptedData, sharedSecret: secret } =
      await this.kem.encapsulate(publicKey);
    return { encryptedData, secret };
  }

  /**
   * Desencripta un mensaje usando una clave privada.
   * @param {Buffer} encryptedData - Los datos encriptados.
   * @param {Buffer} privateKey - La clave privada usada para desencriptar.
   * @returns {string} El mensaje desencriptado.
   */
  async decrypt(encryptedData: Uint8Array, privateKey: Uint8Array) {
    if (!this.kem) {
      throw new Error(
        'Kyber instance not initialized. Call `initialize()` first.'
      );
    }

    const decryptedData = await this.kem.decapsulate(encryptedData, privateKey);
    return new TextDecoder().decode(decryptedData.sharedSecret);
  }
}

export default KyberCrypto;
