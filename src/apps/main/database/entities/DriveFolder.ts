import { Column, Entity, PrimaryColumn } from 'typeorm';
import { Brand } from '../../../../context/shared/domain/Brand';

export type FolderUuid = Brand<string, 'FolderUuid'>;
export type SimpleDriveFolder = {
  uuid: FolderUuid;
  name: string;
  parentId: number | undefined;
  createdAt: string;
  updatedAt: string;
  status: string;
};

@Entity('drive_folder')
export class DriveFolder {
  @PrimaryColumn({
    type: 'varchar',
    nullable: false,
  })
  uuid!: string;

  @Column({ type: 'varchar', nullable: false })
  type!: string;

  @Column({ type: 'integer', nullable: false, unique: true })
  id!: number;

  @Column({ type: 'integer', nullable: true })
  parentId?: number;

  @Column({ type: 'varchar', nullable: true })
  bucket?: string;

  @Column({ type: 'integer', nullable: false })
  userId!: number;

  @Column({ type: 'varchar', nullable: false })
  createdAt!: string;

  @Column({ type: 'varchar', nullable: false })
  updatedAt!: string;

  @Column({ type: 'varchar', nullable: true })
  plainName?: string;

  @Column({ type: 'varchar', nullable: false })
  name!: string;

  @Column({ type: 'varchar', nullable: false })
  status!: string;
}
