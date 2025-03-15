declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ANALYZE: 'true' | 'false';
      API_URL: string;
      BRIDGE_URL: string;
      BUG_REPORTING_URL: string;
      CRYPTO_KEY: string;
      NEW_CRYPTO_KEY: string;
      NEW_DRIVE_URL: string;
      NODE_ENV: 'development' | 'production';
      NOTIFICATIONS_URL: string;
      PAYMENTS_URL: string;
      PORT: number;
      PROVIDER_ID: string;
      ROOT_FOLDER_NAME: string;
      SENTRY_DSN: string;
    }
  }
}

export {};
