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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UserRole } from '../users/schemas/user.schema';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreatePosBookingDto } from './dto/create-pos-booking.dto';
import { LookupBookingDto } from './dto/lookup-booking.dto';
import { QueryBookingDto } from './dto/query-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@ApiTags('bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Book seats on a trip (customer online)' })
  create(
    @Body() createBookingDto: CreateBookingDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bookingsService.create(user.userId, createBookingDto);
  }

  @Post('pos')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({
    summary: 'POS booking for walk-in customer without an account',
  })
  createPos(
    @Body() createPosBookingDto: CreatePosBookingDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bookingsService.createPos(user, createPosBookingDto);
  }

  @Get('lookup')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Look up a POS booking by reference and passenger contact',
  })
  lookup(
    @Query() lookupBookingDto: LookupBookingDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bookingsService.lookup(lookupBookingDto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'List bookings (customers see own, staff see company)',
  })
  findAll(
    @Query() query: QueryBookingDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bookingsService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking by id' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bookingsService.findById(id, user);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update booking status (customer cancel, staff manage)',
  })
  updateStatus(
    @Param('id') id: string,
    @Body() updateBookingStatusDto: UpdateBookingStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bookingsService.updateStatus(id, updateBookingStatusDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a booking (admin only)' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.bookingsService.remove(id, user);
    return { message: 'Booking deleted successfully' };
  }
}
