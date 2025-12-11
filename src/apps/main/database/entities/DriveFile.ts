import { Column, Entity, PrimaryColumn } from 'typeorm';
import { Brand } from '../../../../context/shared/domain/Brand';

export type FileUuid = Brand<string, 'FileUuid'>;
export type ContentsId = Brand<string, 'ContentsId'>;
export type SimpleDriveFile = {
  uuid: FileUuid;
  name: string;
  nameWithExtension: string;
  extension: string;
  parentId: number;
  parentUuid: string | undefined;
  contentsId: ContentsId;
  size: number;
  createdAt: string;
  updatedAt: string;
  modificationTime: string;
  status: string;
};

@Entity('drive_file')
export class DriveFile {
  @Column({ nullable: false, unique: true })
  fileId!: string;

  @Column({ nullable: false })
  id!: number;

  @PrimaryColumn({
    nullable: false,
    unique: true,
  })
  uuid!: string;

  @Column({ nullable: true, default: '' })
  type!: string;

  @Column({ nullable: false })
  size!: number;

  @Column({ nullable: false })
  bucket!: string;

  @Column({ nullable: false })
  folderId!: number;

  @Column({ nullable: true })
  folderUuid?: string;

  @Column({ nullable: false })
  userId!: number;

  @Column({ nullable: false })
  modificationTime!: string;

  @Column({ nullable: false })
  createdAt!: string;

  @Column({ nullable: false })
  updatedAt!: string;

  @Column({ nullable: true })
  plainName?: string;

  @Column({ nullable: false })
  name!: string;

  @Column({ nullable: false })
  status!: string;
}
