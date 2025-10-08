import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpModule } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { AxiosError } from 'axios';
import { GeoService } from '../src/geo/geo.service';

describe('GeoService', () => {
  const cacheMock = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('devuelve caché cuando existe hit', async () => {
    const cachedResponse = {
      centroid: { lat: 0, lng: 0 },
      bounds: { north: 1, south: -1, east: 1, west: -1 },
    };

    cacheMock.get.mockResolvedValueOnce(cachedResponse);

    const module = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        GeoService,
        {
          provide: CACHE_MANAGER,
          useValue: cacheMock,
        },
      ],
    })
      .overrideProvider(HttpModule)
      .useValue({
        post: () => of({ data: cachedResponse }),
      })
      .compile();

    const service = module.get<GeoService>(GeoService);
    const result = await service.process({ points: [{ lat: 1, lng: 1 }] });

    expect(result).toEqual(cachedResponse);
    expect(cacheMock.set).not.toHaveBeenCalled();
  });

  it('propaga error 400 como BadRequestException', async () => {
    cacheMock.get.mockResolvedValueOnce(undefined);
    const axiosError = {
      config: {},
      isAxiosError: true,
      name: 'AxiosError',
      message: 'Bad request',
      toJSON: () => ({}),
      response: {
        status: 400,
        data: { detail: 'Invalid payload' },
        statusText: 'Bad Request',
        headers: {},
        config: {},
      },
    } as AxiosError;

    const module = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        GeoService,
        {
          provide: CACHE_MANAGER,
          useValue: cacheMock,
        },
      ],
    }).compile();

    const service = module.get<GeoService>(GeoService);
    jest
      .spyOn(service['http'], 'post')
      .mockReturnValue(throwError(() => axiosError) as any);

    await expect(service.process({ points: [{ lat: 1, lng: 1 }] })).rejects.toMatchObject({
      status: 400,
    });
  });
});

