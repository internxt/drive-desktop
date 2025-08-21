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
  privateKey: string;
  publicKey: string;
  registerCompleted: boolean;
  revocateKey: string;
  root_folder_id: number;
  /** the uuid of the root folder */
  rootFolderId: string;
  sharedWorkspace: boolean;
  teams: boolean;
  userId: string;
  username: string;
  uuid: string;
};
