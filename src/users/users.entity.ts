import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, BeforeUpdate } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: false })
  isVerified: boolean;
  
  @Column({ nullable: true })
  avatar?: string;  // URL or path to user avatar image

  // Role field for authorization
  @Column({ default: 'user' })
  role: string; // 'user' | 'admin'

  // Brute-force protection fields
  @Column({ default: 0 })
  failedLoginAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lockedUntil?: Date;

  @Column({ default: false })
  isLocked: boolean;
  
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  // Method to check if account is locked
  isAccountLocked(): boolean {
    return this.isLocked && !!this.lockedUntil && new Date() < this.lockedUntil;
  }
}
