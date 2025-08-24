import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import { RolesService } from './roles.service';


@Controller('api/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) { }

  @Get()
  async findAll() {
    try {
      const roles = await this.rolesService.findAll();
      return {
        status: true,
        message: "Roles fetched successfully",
        data: roles
      }
    } catch (error) {
      throw new InternalServerErrorException(error?.message || 'Internal server error');
    }
  }
}
