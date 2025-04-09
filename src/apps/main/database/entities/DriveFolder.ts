import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('drive_folder')
export class DriveFolder {
  @PrimaryColumn({
    nullable: false,
    type: 'varchar',
  })
  uuid!: string;

  @Column({ nullable: false, type: 'varchar' })
  type!: string;

  @Column({ nullable: false, unique: true, type: 'int' })
  id!: number;

  @Column({ nullable: true, type: 'varchar' })
  workspaceId?: string;

  @Column({ nullable: true, type: 'int' })
  parentId?: number;

  @Column({ nullable: true, type: 'varchar' })
  parentUuid?: string;

  @Column({ nullable: true, type: 'varchar' })
  bucket?: string;

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
  createdAt!: string;

  @Column({ nullable: false, type: 'varchar' })
  updatedAt!: string;

  @Column({ nullable: true, type: 'varchar' })
  plainName?: string;

  @Column({ nullable: false, type: 'varchar' })
  name!: string;

  @Column({ nullable: false, type: 'varchar' })
  status!: string;
}
