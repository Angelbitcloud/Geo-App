import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { GeoService } from './geo.service';
import { ProcessRequestDto } from './geo.dto';

@Controller('geo')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Post('process')
  @HttpCode(HttpStatus.OK)
  process(@Body() dto: ProcessRequestDto) {
    return this.geoService.process(dto);
  }
}

