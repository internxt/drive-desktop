import { Column, Entity, PrimaryColumn } from 'typeorm';
import { Brand } from '@/context/shared/domain/Brand';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

export type FolderUuid = Brand<string, 'FolderUuid'>;
export type SimpleDriveFolder = {
  uuid: FolderUuid;
  name: string;
  parentUuid: string | undefined;
  createdAt: string;
  updatedAt: string;
  status: 'EXISTS' | 'TRASHED' | 'DELETED';
};
export type ExtendedDriveFolder = SimpleDriveFolder & {
  absolutePath: AbsolutePath;
};

@Entity('drive_folder')
export class DriveFolder {
  @Column({ nullable: false, unique: true, type: 'int' })
  id!: number;

  @PrimaryColumn({ nullable: false, type: 'varchar' })
  uuid!: string;

  @Column({ nullable: false, type: 'varchar' })
  status!: 'EXISTS' | 'TRASHED' | 'DELETED';

  @Column({ nullable: true, type: 'varchar' })
  plainName!: string;

  @Column({ nullable: false, type: 'varchar' })
  createdAt!: string;

  @Column({ nullable: false, type: 'varchar' })
  updatedAt!: string;

  @Column({ nullable: true, type: 'varchar' })
  parentUuid?: string;

  @Column({ nullable: true, default: '', type: 'varchar' })
  workspaceId?: string;

  @Column({ nullable: true, type: 'int' })
  parentId?: number;

  /**
   * v2.5.1 Daniel Jiménez
   * We mark this field as empty to allow the migration to complete.
   * However, the value is populated by a custom migration on the startup.
   */
  @Column({ nullable: false, default: '', type: 'varchar' })
  userUuid!: string;
}
