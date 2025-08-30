import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/guards/auth.guard';
import { UserQueryDto } from './dto/userQueryDto';
import { UserRole } from 'src/libs/enums';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiConsumes } from '@nestjs/swagger';
import { multerConfig } from 'src/config/multer.config';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateSellerDto } from './dto/seller.dto';
import { UpdateUserAndSellerDto } from './dto/user-seller-dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query() query: UserQueryDto) {
    try {
      const users = await this.usersService.findAll(query);
      const userCount = await this.usersService.calcUsersCount();
      return {
        success: true,
        message: 'Users fetched successfully',
        data: {
          users,
          ...(query.isPaginated
            ? {
              pagination: {
                total: userCount,
                page: query.page,
                limit: query.limit,
              }
            }
            : null),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error?.message || 'Internal server error',
      );
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id.toString());

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    return {
      success: true,
      message: 'User fetched successfully',
      data: { user },
    };
  }


  // @Put(':id')
  // @UseGuards(JwtAuthGuard)
  // @ApiConsumes('multipart/form-data')
  // @UseInterceptors(FileInterceptor('avatar', multerConfig))
  // async update(
  //   @Param('id') id: string,
  //   @Body() body: UpdateUserAndSellerDto,
  //   @UploadedFile() file?: Express.Multer.File
  // ) {
  //   if (file && body.user) {
  //     body.user.avatar = `/uploads/${file.filename}`;
  //   }

  //   if (body.user) {
  //     await this.usersService.update(id, body.user);
  //   }

  //   if (body.seller) {
  //     await this.usersService.updateSeller(id, body.seller);
  //   }

  //   const updatedUser = await this.usersService.findOne(id);
  //   return {
  //     success: true,
  //     message: 'User updated successfully',
  //     data: updatedUser,
  //   };
  // }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string, @CurrentUser() currentUser: User,
  ) {
    const user = await this.usersService.findOne(id.toString());


    if (!user) {
      throw new NotFoundException('User not found!');
    }

    if (currentUser.role.name !== UserRole.SUPERADMIN) {
      throw new ForbiddenException(
        'You do not have permission to delete this user',
      );
    }

    try {
      await this.usersService.delete(id.toString());
      return {
        success: true,
        message: 'User deleted successfully',
        data: null
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error?.message || 'Internal server error',
      );
    }
  }


}
