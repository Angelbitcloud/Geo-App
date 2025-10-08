import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { GeoController } from './geo.controller';
import { GeoService } from './geo.service';

@Module({
  imports: [HttpModule, CacheModule.register()],
  controllers: [GeoController],
  providers: [GeoService],
})
export class GeoModule {}

