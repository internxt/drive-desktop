import { Entity, Column, PrimaryColumn } from 'typeorm';
@Entity('maintenance')
export class Maintenance {
    @PrimaryColumn({
        nullable: false,
    })
    uuid!: string;

    @Column({ nullable: false })
    integrityCheckCompleted!: boolean;

    @Column({ nullable: false })
    createdAt!: string;

    @Column({ nullable: false })
    updatedAt!: string;
}

