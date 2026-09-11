export type MailBridgeClientCredentials = {
  username: string;
  password: string;
};

export type MailBridgeSession = {
  account_id: string;
  addresses: string[];
  backend_session: {
    token: string;
    encryption_private_key: string;
  };
  mail_client: MailBridgeClientCredentials;
};
export type StoredCredentials = MailBridgeClientCredentials;
