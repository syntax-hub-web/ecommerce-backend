import { Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';

import * as bcrypt from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { Role } from 'src/roles/entities/role.entity';
import * as jwt from 'jsonwebtoken';
import { MailerService } from '@nestjs-modules/mailer';
import { UserStatus } from 'src/libs/enums';
import { Seller } from './entities/seller.entity';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Seller)
    private readonly sellerRepository: Repository<Seller>,
    private readonly mailerService: MailerService,
  ) {}

  LOCK_TIME = 15 * 60 * 1000;

  async handleFieldAttempt(user: User) {
    user.failedAttempts += 1;

    if (user.failedAttempts >= 3) {
      user.blockUntil = new Date(Date.now() + this.LOCK_TIME);
      user.failedAttempts = 0;
    }

    await this.usersRepository.save(user);
  }

  async resetFailedAttempts(user: User) {
    await this.usersRepository.update(user.id, {
      failedAttempts: 0,
      blockUntil: null,
    });
  }

  async findByEmail(email: string) {
    const user = await this.usersRepository.findOneBy({ email });
    return user;
  }

  async findByPhone(phone: string) {
    const user = await this.usersRepository.findOneBy({ phone });
    return user;
  }

  async hashPassword(password: string) {
    const hashPassword = await bcrypt.hash(password, 10);
    return hashPassword;
  }

  async register(createAuthDto: CreateAuthDto) {
    let role = null;
    role = await this.roleRepository.findOne({ where: { name: 'user' } });

    const user = await this.usersRepository.save({
      ...createAuthDto,
      role,
    });
    return user;
  }

  async generateToken(
    payload: {
      email: string;
      lastLogin: number;
    },
    SECRET_KEY: string,
    expireTime: any,
  ) {
    const token = jwt.sign(payload, SECRET_KEY, {
      expiresIn: `${expireTime}`,
    });
    return token;
  }

  async sendTestEmail(messagePayload: {
    email: string;
    subject: string;
    text: string;
    html: string;
  }) {
    await this.mailerService.sendMail({
      to: messagePayload.email,
      subject: messagePayload.subject,
      text: messagePayload.text,
      html: messagePayload.html,
    });
  }

  async addTokenToUser(email: string, token: string) {
    await this.usersRepository.update({ email }, { activeCode: token });
  }

  async verifyToken(token: string, SECRET_KEY: string) {
    const decoded = jwt.verify(token, SECRET_KEY);
    return decoded;
  }

  async updateUserStatus(userId: string) {
    await this.usersRepository.update(userId, {
      activeCode: null,
      status: UserStatus.ACTIVE,
    });
  }

  async comparePassword(password: string, userPassword: string) {
    const isMatched = bcrypt.compare(password, userPassword);
    return isMatched;
  }

  async generateOtp() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expireOtp = new Date();
    expireOtp.setMinutes(expireOtp.getMinutes() + 5);
    return { otp, expireOtp };
  }

  async updateUserOtp(userId: string, otp: string, expireOtp: Date) {
    await this.usersRepository.update(userId, {
      otp,
      otpExpire: expireOtp,
    });
  }

  async updateUserPassword(userId: string, password: string) {
    return await this.usersRepository.update(userId, {
      password,
    });
  }

  async getRoleById(id: string) {
    return await this.roleRepository.findOne({ where: { id } });
  }

  async createSeller(data: {
    user_id: string;
    brand_name?: string;
    brand_description?: string;
  }) {
    const seller = this.sellerRepository.create(data);
    return await this.sellerRepository.save(seller);
  }

  async updateUserLastLogin(user: User) {
    await this.usersRepository.update(user.id, {
      lastLogin: user.lastLogin,
    });
  }
}
