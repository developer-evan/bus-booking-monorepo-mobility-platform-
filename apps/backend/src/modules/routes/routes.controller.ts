import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UserRole } from '../users/schemas/user.schema';
import { CreateRouteDto } from './dto/create-route.dto';
import { QueryRouteDto } from './dto/query-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { RoutesService } from './routes.service';

@ApiTags('routes')
@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List routes with optional filters' })
  findAll(@Query() query: QueryRouteDto) {
    return this.routesService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get route by id' })
  findOne(@Param('id') id: string) {
    return this.routesService.findById(id);
  }

  @Post()
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Create a route (company staff)' })
  create(
    @Body() createRouteDto: CreateRouteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const companyId = this.routesService.assertWritableCompany(user);
    return this.routesService.create(createRouteDto, companyId);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Update a route (company staff)' })
  update(
    @Param('id') id: string,
    @Body() updateRouteDto: UpdateRouteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.routesService.update(id, updateRouteDto, user);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a route (company admin)' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.routesService.remove(id, user);
    return { message: 'Route deleted successfully' };
  }
}
