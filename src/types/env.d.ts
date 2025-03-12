declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ANALYZE: 'true' | 'false';
      CRYPTO_KEY: string;
      NEW_CRYPTO_KEY: string;
      API_URL: string;
      NEW_DRIVE_URL: string;
      BRIDGE_URL: string;
      BUG_REPORTING_URL: string;
      platform: string;
      NOTIFICATIONS_URL: string;
      NODE_ENV?: 'none' | 'development' | 'production';
      PHOTOS_URL: string;
      SENTRY_DSN: string;
      PAYMENTS_URL: string;
      NOTIFICATIONS_URL: string;
    }
  }
}

export {};
