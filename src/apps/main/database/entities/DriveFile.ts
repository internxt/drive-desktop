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
  @Column({ type: 'varchar', nullable: false })
  fileId!: string;

  @Column({ type: 'integer', nullable: false })
  id!: number;

  @PrimaryColumn({
    type: 'varchar',
    nullable: false,
    unique: true,
  })
  uuid!: string;

  @Column({ type: 'varchar', nullable: true, default: '' })
  type!: string;

  @Column({ type: 'integer', nullable: false })
  size!: number;

  @Column({ type: 'varchar', nullable: false })
  bucket!: string;

  @Column({ type: 'integer', nullable: false })
  folderId!: number;

  @Column({ type: 'varchar', nullable: true })
  folderUuid?: string;

  @Column({ type: 'integer', nullable: false })
  userId!: number;

  @Column({ type: 'varchar', nullable: false })
  modificationTime!: string;

  @Column({ type: 'varchar', nullable: false })
  createdAt!: string;

  @Column({ type: 'varchar', nullable: false })
  updatedAt!: string;

  @Column({ type: 'varchar', nullable: false })
  plainName!: string;

  @Column({ type: 'varchar', nullable: true })
  name?: string;

  @Column({ type: 'varchar', nullable: false })
  status!: string;
}
