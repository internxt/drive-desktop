export type User = {
  backupsBucket: string;
  bridgeUser: string;
  bucket: string;
  createdAt: string;
  credit: number;
  email: string;
  hasReferralsProgram: boolean;
  lastname: string;
  mnemonic: string;
  name: string;
  privateKey: string | Record<string, never>;
  publicKey: string | Record<string, never>;
  registerCompleted: boolean;
  revocateKey: string | Record<string, never>;
  root_folder_id: number;
  /** the uuid of the root folder */
  rootFolderId: string;
  sharedWorkspace: boolean;
  teams: boolean;
  userId: string;
  username: string;
  uuid: string;
  avatar?: string;
  emailVerified?: boolean;
  lastPasswordChangedAt?: string;
  keys?: {
    ecc: {
      publicKey: string;
      privateKey: string;
      revocationKey: string;
    };
    kyber: {
      publicKey: string;
      privateKey: string;
    };
  };
};
