import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  async create(userDto: any) {
    // Hash password before saving to database
    if (userDto.password) {
      const saltRounds = 10;
      userDto.password = await bcrypt.hash(userDto.password, saltRounds);
    }
    const user = this.repo.create(userDto);
    return this.repo.save(user);
  }
  findAll() {
    return this.repo.find();
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: number, data: Partial<User>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.repo.delete(id);
    return { deleted: true };
  }

  async markAsVerified(email: string) {
    const user = await this.findByEmail(email);
    if (!user) return null;
    user.isVerified = true;
    return this.repo.save(user);
  }
  
  // Update user's avatar URL
  async setAvatar(id: number, avatarUrl: string) {
    await this.repo.update(id, { avatar: avatarUrl });
    return this.findOne(id);
  }

  // Brute-force protection methods
  async incrementFailedAttempts(email: string) {
    const user = await this.findByEmail(email);
    if (!user) return;

    user.failedLoginAttempts += 1;

    // Lock account after 5 failed attempts
    const MAX_ATTEMPTS = 5;
    const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

    if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
      user.isLocked = true;
      user.lockedUntil = new Date(Date.now() + LOCK_TIME);
    }

    await this.repo.save(user);
  }

  // Reset failed attempts when login is successful
  async resetFailedAttempts(email: string) {
    const user = await this.findByEmail(email);
    if (user) {
      user.failedLoginAttempts = 0;
      user.isLocked = false;
      user.lockedUntil = undefined;
      await this.repo.save(user);
    }
  }

  // Admin function to unlock account manually
  async unlockAccount(email: string) {
    const user = await this.findByEmail(email);
    if (user) {
      user.failedLoginAttempts = 0;
      user.isLocked = false;
      user.lockedUntil = undefined;
      await this.repo.save(user);
    }
    return { message: 'Tài khoản đã được mở khóa thành công' };
  }
}
