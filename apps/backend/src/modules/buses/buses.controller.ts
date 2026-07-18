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
  @ApiOperation({ summary: 'Create a bus (admin/operator)' })
  create(@Body() createBusDto: CreateBusDto) {
    return this.busesService.create(createBusDto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Update a bus (admin/operator)' })
  update(@Param('id') id: string, @Body() updateBusDto: UpdateBusDto) {
    return this.busesService.update(id, updateBusDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a bus (admin only)' })
  async remove(@Param('id') id: string) {
    await this.busesService.remove(id);
    return { message: 'Bus deleted successfully' };
  }
}
