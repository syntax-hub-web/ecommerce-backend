import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/roles/entities/role.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
    ) { }

    async findAll() {
        const users = await this.usersRepository
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
            .getMany();


        return users.map(user => {
            if (!user.seller) delete user.seller;
            return user;
        });
    }



    async findByEmail(email: string) {
        const user = await this.usersRepository.findOne({ where: { email } })
        return user
    }


}   
