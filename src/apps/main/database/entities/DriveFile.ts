import { Brand } from '@/context/shared/domain/Brand';
import { Column, Entity, PrimaryColumn } from 'typeorm';

export type FileUuid = Brand<string, 'FileUuid'>;
export type ContentsId = Brand<string, 'ContentsId'>;
export type SimpleDriveFile = {
  id: number;
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
  status: 'EXISTS' | 'TRASHED' | 'DELETED';
};

@Entity('drive_file')
export class DriveFile {
  @Column({ nullable: false, unique: true, type: 'varchar' })
  fileId!: string;

  @Column({ nullable: false, type: 'int' })
  id!: number;

  @PrimaryColumn({ nullable: false, unique: true, type: 'varchar' })
  uuid!: string;

  @Column({ nullable: true, default: '', type: 'varchar' })
  workspaceId?: string;

  @Column({ nullable: true, default: '', type: 'varchar' })
  type!: string;

  @Column({ nullable: false, type: 'int' })
  size!: number;

  @Column({ nullable: false, type: 'varchar' })
  bucket!: string;

  @Column({ nullable: false, type: 'int' })
  folderId!: number;

  @Column({ nullable: true, type: 'varchar' })
  folderUuid?: string;

  @Column({ nullable: false, type: 'int' })
  userId!: number;

  /**
   * v2.5.1 Daniel Jiménez
   * We mark this field as empty to allow the migration to complete.
   * However, the value is populated by a custom migration on the startup.
   */
  @Column({ nullable: false, default: '', type: 'varchar' })
  userUuid!: string;

  @Column({ nullable: false, type: 'varchar' })
  modificationTime!: string;

  @Column({ nullable: false, type: 'varchar' })
  createdAt!: string;

  @Column({ nullable: false, type: 'varchar' })
  updatedAt!: string;

  @Column({ nullable: true, type: 'varchar' })
  plainName?: string;

  @Column({ nullable: false, type: 'varchar' })
  name!: string;

  @Column({ nullable: false, type: 'varchar' })
  status!: 'EXISTS' | 'TRASHED' | 'DELETED';

  @Column({ nullable: false, default: true, type: 'boolean' })
  isDangledStatus!: boolean;
}
