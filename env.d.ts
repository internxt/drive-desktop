declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Encryption keys for backups and data protection
      CRYPTO_KEY: string;
      MAGIC_IV: string;
      MAGIC_SALT: string;
      NEW_CRYPTO_KEY: string;

      // Core API endpoints
      NEW_DRIVE_URL: string;
      BRIDGE_URL: string;
      PAYMENTS_URL: string;
      NOTIFICATIONS_URL: string;
      INTERNXT_DESKTOP_HEADER_KEY: string;
      ENABLE_ANTIVIRUS?: string;
      NODE_ENV?: string;
      PORT?: string;
    }
  }
}

export {};
