import { Column, Entity, PrimaryColumn } from 'typeorm';

export const SCANNED_ITEMS_DB_ENTITY = 'scanned_files';

@Entity(SCANNED_ITEMS_DB_ENTITY)
export class ScannedItem {
  @PrimaryColumn({ nullable: false, unique: true, type: 'varchar' })
  id!: string;

  @Column({ nullable: true, default: '', type: 'varchar' })
  type!: string;

  @Column({ nullable: false, type: 'int' })
  size!: number;

  @Column({ nullable: true, type: 'varchar' })
  hash?: string;

  @Column({ nullable: false, type: 'varchar' })
  createdAt!: string;

  @Column({ nullable: false, type: 'varchar' })
  updatedAt!: string;

  @Column({ nullable: false, type: 'varchar' })
  creationTimeW!: string;

  @Column({ nullable: false, type: 'varchar' })
  updatedAtW!: string;

  @Column({ nullable: false, type: 'varchar' })
  pathName!: string;

  @Column({ nullable: false, type: 'varchar' })
  status!: 'scanned' | 'pending';

  @Column({ nullable: false, type: 'boolean' })
  isInfected!: boolean;
}
