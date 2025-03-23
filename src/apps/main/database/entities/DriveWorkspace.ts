import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('drive_workspace')
export class DriveWorkspace {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  ownerId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'uuid' })
  defaultTeamId!: string;

  @Column({ type: 'uuid' })
  workspaceUserId!: string;

  @Column({ type: 'boolean', default: false })
  setupCompleted!: boolean;

  @Column({ type: 'boolean', default: false })
  removed!: boolean;

  @Column({ type: 'varchar' })
  mnemonic!: string;

  @Column({ type: 'uuid' })
  rootFolderId!: string;

  @CreateDateColumn({ type: 'varchar' })
  createdAt!: string;

  @UpdateDateColumn({ type: 'varchar' })
  updatedAt!: string;
}
