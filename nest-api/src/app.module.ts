import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { HttpModule } from '@nestjs/axios';
import { GeoModule } from './geo/geo.module';

@Module({
  imports: [
    CacheModule.register({ isGlobal: true }),
    HttpModule.register({ timeout: 5000 }),
    GeoModule,
  ],
})
export class AppModule {}

