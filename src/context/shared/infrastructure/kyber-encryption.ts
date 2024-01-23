import kemBuilder, { KEM } from '@dashlane/pqc-kem-kyber512-node';

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

  /**
   * Genera un par de claves pública y privada.
   * @returns {Object} Contiene `publicKey` y `privateKey`.
   */
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
    return decryptedData.toString();
  }
}

export default KyberCrypto;
