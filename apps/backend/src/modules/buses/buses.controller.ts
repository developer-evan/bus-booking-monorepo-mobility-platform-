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
import { BusesService } from './buses.service';
import { CreateBusDto } from './dto/create-bus.dto';
import { QueryBusDto } from './dto/query-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';

@ApiTags('buses')
@Controller('buses')
export class BusesController {
  constructor(private readonly busesService: BusesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all buses' })
  findAll(@Query() query: QueryBusDto) {
    return this.busesService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get bus by id' })
  findOne(@Param('id') id: string) {
    return this.busesService.findById(id);
  }

  @Post()
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Create a bus (company staff)' })
  create(
    @Body() createBusDto: CreateBusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const companyId = this.busesService.assertWritableCompany(user);
    return this.busesService.create(createBusDto, companyId);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Update a bus (company staff)' })
  update(
    @Param('id') id: string,
    @Body() updateBusDto: UpdateBusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.busesService.update(id, updateBusDto, user);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a bus (company admin)' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.busesService.remove(id, user);
    return { message: 'Bus deleted successfully' };
  }
}
