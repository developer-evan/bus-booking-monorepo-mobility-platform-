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
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
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
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a user (admin only)' })
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return this.usersService.sanitizeUser(user);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all users (admin only)' })
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map((user) => this.usersService.sanitizeUser(user));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id (admin or self)' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    this.assertSelfOrAdmin(id, currentUser);
    const user = await this.usersService.findById(id);
    return this.usersService.sanitizeUser(user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user (admin or self)' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    this.assertSelfOrAdmin(id, currentUser);

    if (currentUser.role !== UserRole.ADMIN) {
      delete updateUserDto.role;
      delete updateUserDto.isActive;
    }

    const user = await this.usersService.update(id, updateUserDto);
    return this.usersService.sanitizeUser(user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete user (admin only)' })
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { message: 'User deleted successfully' };
  }

  private assertSelfOrAdmin(
    targetUserId: string,
    currentUser: AuthenticatedUser,
  ): void {
    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.userId !== targetUserId
    ) {
      throw new ForbiddenException('You can only access your own profile');
    }
  }
}
