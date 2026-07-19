import {
  Body,
  Controller,
  Get,
  Param,
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
import { RecordCashPaymentDto } from './dto/record-cash-payment.dto';
import { QueryPaymentDto } from './dto/query-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('cash')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Record a cash payment and confirm a pending booking',
  })
  recordCash(
    @Body() recordCashPaymentDto: RecordCashPaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.recordCashPayment(user, recordCashPaymentDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List payments (customers see own, staff see company)',
  })
  findAll(
    @Query() query: QueryPaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.findAll(query, user);
  }

  @Get('booking/:bookingId')
  @ApiOperation({ summary: 'List payments for a booking' })
  findByBooking(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.findByBookingId(bookingId, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by id' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.findById(id, user);
  }
}
