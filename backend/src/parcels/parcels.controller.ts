import { Controller, Get, Param, Post, Body, Query } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ParcelsService } from './parcels.service';

@Controller()
export class ParcelsController {
  constructor(private readonly parcelsService: ParcelsService) {}

  @Post('bookings')
  createBooking(@Body() dto: CreateBookingDto) {
    return this.parcelsService.createBooking(dto);
  }

  @Get('bookings/:reference')
  getBooking(@Param('reference') reference: string) {
    return this.parcelsService.getByBookingReference(reference);
  }

  @Get('tracking/code/:code')
  trackByCode(@Param('code') code: string) {
    return this.parcelsService.lookupByQuery(code);
  }

  @Get('tracking/token/:token')
  trackByToken(@Param('token') token: string) {
    return this.parcelsService.lookupByToken(token);
  }

  @Get('parcels/pending')
  listPending(@Query('stationId') stationId?: string) {
    return this.parcelsService.listPendingDropoffs(stationId);
  }
}
