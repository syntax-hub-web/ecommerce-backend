import { Controller, Get, InternalServerErrorException, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/guards/auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    try {
      const users = await this.usersService.findAll()
      return {
        success: true,
        message: "Users fetched successfully"
        , data: { users }
      }
    } catch (error) {
      throw new InternalServerErrorException(error?.message || "Internal server error");
    }
  }
}
