import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards 
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../../common/enums/role.enum';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Gestion des admins
  @Get()
  @Roles(Role.ADMIN)
  findAllAdmins() {
    return this.adminService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  findOneAdmin(@Param('id') id: string) {
    return this.adminService.findOne(+id);
  }

  @Post()
  @Roles(Role.ADMIN)
  createAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.create(createAdminDto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  updateAdmin(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return this.adminService.update(+id, updateAdminDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  removeAdmin(@Param('id') id: string) {
    return this.adminService.remove(+id);
  }

  // Gestion de tous les utilisateurs (réservé aux admins)
  @Get('users/all')
  @Roles(Role.ADMIN)
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Delete('users/:id')
  @Roles(Role.ADMIN)
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(+id);
  }
}