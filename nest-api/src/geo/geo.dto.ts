import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsNumber,
  ValidateNested,
} from 'class-validator';

const POINTS_ERROR = 'points must be a non-empty array of {lat,lng}.';

export class PointDto {
  @IsNumber({}, { message: POINTS_ERROR })
  lat!: number;

  @IsNumber({}, { message: POINTS_ERROR })
  lng!: number;
}

export class ProcessRequestDto {
  @IsDefined({ message: POINTS_ERROR })
  @IsArray({ message: POINTS_ERROR })
  @ArrayMinSize(1, { message: POINTS_ERROR })
  @ValidateNested({ each: true })
  @Type(() => PointDto)
  points!: PointDto[];
}

export interface ProcessResponse {
  centroid: {
    lat: number;
    lng: number;
  };
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

