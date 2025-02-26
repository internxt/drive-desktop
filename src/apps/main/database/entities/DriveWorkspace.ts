import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('drive_workspace')
export class DriveWorkspace {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  ownerId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column('uuid')
  defaultTeamId!: string;

  @Column('uuid')
  workspaceUserId!: string;

  @Column({ type: 'boolean', default: false })
  setupCompleted!: boolean;

  @Column('uuid')
  rootFolderId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
