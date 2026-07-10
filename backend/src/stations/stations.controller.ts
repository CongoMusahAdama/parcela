import { Controller, Get, Param, Query } from '@nestjs/common';
import { StationsService } from './stations.service';

@Controller('stations')
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

  @Get()
  findAll(
    @Query('q') q?: string,
    @Query('operator') operator?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('excludeId') excludeId?: string,
  ) {
    return this.stationsService.findAll({
      q,
      operator,
      lat: lat ? parseFloat(lat) : undefined,
      lng: lng ? parseFloat(lng) : undefined,
      excludeId,
    });
  }

  @Get('cities/list')
  listCities() {
    return this.stationsService.listGhanaCities();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stationsService.findByStationId(id);
  }
}
