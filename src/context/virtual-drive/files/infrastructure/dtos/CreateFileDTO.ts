export interface CreateFileDTO {
  file: {
    bucket: string;
    encrypt_version: '03-aes';
    fileId: string;
    file_id: string;
    folder_id: number;
    name: string;
    plain_name: string;
    size: number;
    type: string;
  };
}
