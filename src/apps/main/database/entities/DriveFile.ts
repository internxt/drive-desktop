import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('drive_file')
export class DriveFile {
  @Column({ nullable: false, unique: true, type: 'varchar' })
  fileId!: string;

  @Column({ nullable: false, type: 'int' })
  id!: number;

  @PrimaryColumn({
    nullable: false,
    unique: true,
    type: 'varchar',
  })
  uuid!: string;

  @Column({ nullable: true, type: 'varchar' })
  workspaceId?: string;

  @Column({ nullable: true, default: '', type: 'varchar' })
  type!: string;

  @Column({ nullable: false, type: 'int' })
  size!: number;

  @Column({ nullable: false, type: 'varchar' })
  bucket!: string;

  @Column({ nullable: false, type: 'int' })
  folderId!: number;

  @Column({ nullable: false, type: 'varchar' })
  folderUuid!: string;

  @Column({ nullable: false, type: 'int' })
  userId!: number;

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
  status!: string;

  @Column({ nullable: false, default: true, type: 'boolean' })
  isDangledStatus!: boolean;
}
