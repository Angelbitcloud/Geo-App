import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ProcessRequestDto, ProcessResponse } from './geo.dto';
import { createHash } from 'crypto';
import { catchError, firstValueFrom, map } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name);
  private readonly ttlSeconds: number;
  private readonly pythonServiceUrl: string;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly http: HttpService,
  ) {
    this.ttlSeconds = parseInt(process.env.NEST_CACHE_TTL ?? '60', 10);
    this.pythonServiceUrl = process.env.PYTHON_SERVICE_URL ?? 'http://localhost:8000';
  }

  async process(dto: ProcessRequestDto): Promise<ProcessResponse> {
    const key = this.generateCacheKey(dto);

    const cached = await this.cache.get<ProcessResponse | undefined>(key);
    if (cached) {
      this.logger.debug(`Cache hit para key ${key}`);
      return cached;
    }

    const response = await firstValueFrom(
      this.http.post<ProcessResponse>(`${this.pythonServiceUrl}/process`, dto).pipe(
        map((res) => res.data),
        catchError((error: AxiosError) => {
          if (error.response) {
            const status = error.response.status ?? 502;
            if (status === 400) {
              throw new BadRequestException(error.response.data);
            }
            throw new BadGatewayException(error.response.data ?? 'Upstream error');
          }
          this.logger.error('Error comunicándose con FastAPI', error.message);
          throw new BadGatewayException('Could not reach python-service');
        }),
      ),
    );

    await this.cache.set(key, response, this.ttlSeconds * 1000);
    return response;
  }

  private generateCacheKey(dto: ProcessRequestDto): string {
    const hash = createHash('sha256');
    hash.update(JSON.stringify(dto.points));
    return `geo:${hash.digest('hex')}`;
  }
}

