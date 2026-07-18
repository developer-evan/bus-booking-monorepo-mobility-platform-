import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './schemas/user.schema';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a user (company admin or super admin)' })
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    if (currentUser.role === UserRole.ADMIN) {
      createUserDto.company = currentUser.companyId;
      createUserDto.role = UserRole.OPERATOR;
    }

    const user = await this.usersService.create(createUserDto);
    return this.usersService.sanitizeUser(user);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List users' })
  async findAll(@CurrentUser() currentUser: AuthenticatedUser) {
    const companyId =
      currentUser.role === UserRole.ADMIN ? currentUser.companyId : undefined;
    const users = await this.usersService.findAll(companyId);
    return users.map((user) => this.usersService.sanitizeUser(user));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id (admin, super admin, or self)' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    this.assertAccess(id, currentUser);
    const user = await this.usersService.findById(id);
    return this.usersService.sanitizeUser(user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    this.assertAccess(id, currentUser);

    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.SUPER_ADMIN
    ) {
      delete updateUserDto.role;
      delete updateUserDto.isActive;
    }

    if (currentUser.role === UserRole.ADMIN) {
      delete updateUserDto.role;
      delete updateUserDto.isActive;
    }

    const user = await this.usersService.update(id, updateUserDto);
    return this.usersService.sanitizeUser(user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete user' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    this.assertAccess(id, currentUser);
    await this.usersService.remove(id);
    return { message: 'User deleted successfully' };
  }

  private assertAccess(
    targetUserId: string,
    currentUser: AuthenticatedUser,
  ): void {
    if (currentUser.userId === targetUserId) {
      return;
    }

    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return;
    }

    if (currentUser.role === UserRole.ADMIN) {
      return;
    }

    throw new ForbiddenException('You can only access your own profile');
  }
}
