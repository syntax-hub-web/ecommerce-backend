import { Expose } from 'class-transformer';
import { Seller } from 'src/auth/entities/seller.entity';
import { UserStatus } from 'src/libs/enums';
import { Role } from 'src/roles/entities/role.entity';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,

} from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: number;

    @Column({ name: 'first_name' })
    firstName: string;

    @Column({ name: 'last_name' })
    lastName: string;

    @Column({ unique: true })
    email: string;

    @Column({ unique: true, nullable: true })
    phone: string;

    @Column({ type: 'text', nullable: true })
    address: string;

    @Column({ nullable: true })
    avatar: string;

    @ManyToOne(() => Role, (role) => role.users, { eager: true })
    role: Role;

    @Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.INACTIVE,
    })
    status: UserStatus;

    @Column({ type: 'varchar', nullable: true })
    otp: string;

    @Column({ type: 'timestamp', nullable: true })
    otpExpire: Date;

    @Column({ type: 'varchar', nullable: true })
    activeCode: string;

    @OneToOne(() => Seller, (seller) => seller.user)
    seller: Seller;

    @Column()
    password: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column({ type: 'timestamptz', nullable: true })
    lastLogin: Date;

    @Column({ default: 0 })
    failedAttempts: number;

    @Column({ type: 'timestamp', nullable: true })
    blockUntil: Date | null
}
