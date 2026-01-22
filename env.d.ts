declare global {
  namespace NodeJS {
    interface ProcessEnv {
      CRYPTO_KEY: string;
      MAGIC_IV: string;
      MAGIC_SALT: string;
      NEW_CRYPTO_KEY: string;
      NEW_DRIVE_URL: string;
      BRIDGE_URL: string;
      APP_SEGMENT_KEY: string;
      APP_SEGMENT_KEY_TEST: string;
      BUG_REPORTING_URL: string;
      platform: string;
      NOTIFICATIONS_URL: string;
      LOCK_REFRESH_INTERVAL: string;
      DRIVE_API_URL: string;
    }
  }
}

export {};
