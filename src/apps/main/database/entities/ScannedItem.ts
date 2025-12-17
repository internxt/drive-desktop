import { Column, Entity, PrimaryColumn } from 'typeorm';

export const SCANNED_ITEMS_DB_ENTITY = 'scanned_files';

@Entity(SCANNED_ITEMS_DB_ENTITY)
export class ScannedItem {
  @PrimaryColumn({ type: 'varchar', nullable: false, unique: true })
  id!: string;

  @Column({ type: 'varchar', nullable: true, default: '' })
  type!: string;

  @Column({ type: 'integer', nullable: false })
  size!: number;

  @Column({ type: 'varchar', nullable: true })
  hash?: string;

  @Column({ type: 'varchar', nullable: false })
  createdAt!: string;

  @Column({ type: 'varchar', nullable: false })
  updatedAt!: string;

  @Column({ type: 'varchar', nullable: false })
  creationTimeW!: string;

  @Column({ type: 'varchar', nullable: false })
  updatedAtW!: string;

  @Column({ type: 'varchar', nullable: false })
  pathName!: string;

  @Column({ type: 'varchar', nullable: false })
  status!: 'scanned' | 'pending';

  @Column({ type: 'boolean', nullable: false })
  isInfected!: boolean;
}
