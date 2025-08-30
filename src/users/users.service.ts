import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/roles/entities/role.entity';
import { UserQueryDto } from './dto/userQueryDto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) { }

  async findAll(query: UserQueryDto) {
    const { name, roleId, status, isPaginated, limit, page } = query;

    let first: string | undefined;
    let last: string | undefined;

    if (name) {
      const parts = name.trim().split(' ');
      first = parts[0];
      last = parts[1]; // could be undefined if only one word
    }

    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.firstName',
        'user.lastName',
        'user.phone',
        'user.status',
        'user.createdAt',
        'user.updatedAt',
        'user.lastLogin',
      ])
      .leftJoinAndSelect('user.seller', 'seller')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.isDeleted = false');

    if (first && last) {
      queryBuilder
        .where('user.firstName LIKE :first', { first: `%${first}%` })
        .andWhere('user.lastName LIKE :last', { last: `%${last}%` });
    } else if (first) {
      queryBuilder
        .where('user.firstName LIKE :first', { first: `%${first}%` })
        .orWhere('user.lastName LIKE :first', { first: `%${first}%` });
    }

    if (roleId) {
      queryBuilder.andWhere('user.roleId = :roleId', { roleId });
    }

    if (typeof status !== 'undefined') {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    if (isPaginated) {
      queryBuilder.skip((page - 1) * limit).take(limit);
    }

    const users = await queryBuilder.getMany();

    return users.map((user) => {
      if (!user.seller) delete user.seller;
      return user;
    });
  }

  async findOne(id: string) {
    const queryBuilder = this.usersRepository.createQueryBuilder('user');
    queryBuilder
      .where('user.id = :id', { id })
      .andWhere('user.isDeleted = false')
      .leftJoinAndSelect('user.seller', 'seller')
      .leftJoinAndSelect('user.role', 'role');

    const user = await queryBuilder.getOne();
    return user;
  }

  async calcUsersCount() {
    return this.usersRepository.count({ where: { isDeleted: false } });
  }

  async findByEmail(email: string) {
    const user = await this.usersRepository.findOne({ where: { email, isDeleted: false } });
    return user;
  }

  async delete(id: string) {
    await this.usersRepository.update(id, { isDeleted: true });
  }

  async restore(id: string) {
    await this.usersRepository.update(id, { isDeleted: false });
  }
}
