import { isValidDate } from '../lib/format';
import type { City, WeatherData } from '../types/weather';

type ServiceErrorCode = 'network' | 'http' | 'invalid-response' | 'timeout' | 'cancelled';

export class WeatherServiceError extends Error {
  constructor(
    public readonly code: ServiceErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'WeatherServiceError';
  }
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

async function request(url: URL, signal?: AbortSignal): Promise<Record<string, unknown>> {
  if (signal?.aborted) throw new WeatherServiceError('cancelled', 'Consulta cancelada.');
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 10_000);
  let rejectOnAbort: () => void = () => {};
  const cancelled = new Promise<never>((_resolve, reject) => {
    rejectOnAbort = () =>
      reject(
        new WeatherServiceError(
          timedOut ? 'timeout' : 'cancelled',
          timedOut
            ? 'A consulta demorou mais de 10 segundos. Tente novamente.'
            : 'Consulta cancelada.',
        ),
      );
    controller.signal.addEventListener('abort', rejectOnAbort, { once: true });
  });

  try {
    return await Promise.race([
      (async () => {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok)
          throw new WeatherServiceError(
            'http',
            'O serviço de tempo está indisponível. Tente novamente.',
          );
        const payload: unknown = await response.json();
        if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
          throw new WeatherServiceError(
            'invalid-response',
            'O serviço retornou dados inválidos. Tente novamente.',
          );
        }
        const data = record(payload);
        if (data.error)
          throw new WeatherServiceError(
            'invalid-response',
            'O serviço não conseguiu atender à consulta. Tente novamente.',
          );
        return data;
      })(),
      cancelled,
    ]);
  } catch (error) {
    if (error instanceof WeatherServiceError) throw error;
    if (
      error instanceof SyntaxError ||
      (error instanceof DOMException && error.name === 'SyntaxError')
    )
      throw new WeatherServiceError(
        'invalid-response',
        'O serviço retornou dados inválidos. Tente novamente.',
      );
    throw new WeatherServiceError(
      'network',
      'Não foi possível conectar ao serviço de tempo. Tente novamente.',
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
    controller.signal.removeEventListener('abort', rejectOnAbort);
  }
}

export async function searchCities(name: string, signal?: AbortSignal): Promise<City[]> {
  const query = name.trim();
  if (!query) return [];
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.search = new URLSearchParams({
    name: query,
    count: '5',
    language: 'pt',
    format: 'json',
  }).toString();
  const data = await request(url, signal);
  if (data.results === undefined) return [];
  if (!Array.isArray(data.results))
    throw new WeatherServiceError(
      'invalid-response',
      'A busca retornou dados inválidos. Tente novamente.',
    );
  const coordinates = new Set<string>();
  return data.results.flatMap((value: unknown) => {
    const city = record(value);
    const latitude = finiteNumber(city.latitude);
    const longitude = finiteNumber(city.longitude);
    const cityName = text(city.name);
    if (
      !cityName ||
      latitude === null ||
      longitude === null ||
      Math.abs(latitude) > 90 ||
      Math.abs(longitude) > 180
    )
      return [];
    const key = `${latitude}:${longitude}`;
    if (coordinates.has(key)) return [];
    coordinates.add(key);
    return [
      {
        name: cityName,
        latitude,
        longitude,
        country: text(city.country) ?? '',
        countryCode: text(city.country_code),
        region: text(city.admin1),
      },
    ];
  });
}

function measurement(
  data: Record<string, unknown>,
  units: Record<string, unknown>,
  key: string,
  unit: string,
  index?: number,
): number | null {
  if (units[key] !== unit) return null;
  const values = data[key];
  const value = finiteNumber(
    index === undefined ? values : Array.isArray(values) ? values[index] : null,
  );
  if (value === null) return null;
  if (unit === '%' && (value < 0 || value > 100)) return null;
  if (['mm', 'km/h', 'hPa'].includes(unit) && value < 0) return null;
  if (unit === 'wmo code' && !Number.isInteger(value)) return null;
  return value;
}

export async function getWeather(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<WeatherData> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current:
      'temperature_2m,relative_humidity_2m,wind_speed_10m,surface_pressure,precipitation,weather_code',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    precipitation_unit: 'mm',
    forecast_days: '5',
    timezone: 'auto',
  }).toString();
  const data = await request(url, signal);
  const current = record(data.current);
  const currentUnits = record(data.current_units);
  const daily = record(data.daily);
  const dailyUnits = record(data.daily_units);
  const dates: unknown[] = Array.isArray(daily.time) ? daily.time : [];
  const seenDates = new Set<string>();
  const forecast = dates.slice(0, 5).flatMap((date, index) => {
    if (!isValidDate(date) || seenDates.has(date)) return [];
    seenDates.add(date);
    const minimum = measurement(daily, dailyUnits, 'temperature_2m_min', '°C', index);
    const maximum = measurement(daily, dailyUnits, 'temperature_2m_max', '°C', index);
    const inverted = minimum !== null && maximum !== null && minimum > maximum;
    return [
      {
        date,
        minTemperatureC: inverted ? null : minimum,
        maxTemperatureC: inverted ? null : maximum,
        weatherCode: measurement(daily, dailyUnits, 'weather_code', 'wmo code', index),
        precipitationMm: measurement(daily, dailyUnits, 'precipitation_sum', 'mm', index),
        precipitationProbabilityPercent: measurement(
          daily,
          dailyUnits,
          'precipitation_probability_max',
          '%',
          index,
        ),
      },
    ];
  });
  return {
    current: Object.keys(current).length
      ? {
          observedAt: text(current.time) ?? '',
          temperatureC: measurement(current, currentUnits, 'temperature_2m', '°C'),
          weatherCode: measurement(current, currentUnits, 'weather_code', 'wmo code'),
          humidityPercent: measurement(current, currentUnits, 'relative_humidity_2m', '%'),
          windSpeedKmh: measurement(current, currentUnits, 'wind_speed_10m', 'km/h'),
          pressureHpa: measurement(current, currentUnits, 'surface_pressure', 'hPa'),
          precipitationMm: measurement(current, currentUnits, 'precipitation', 'mm'),
        }
      : null,
    forecast: forecast.length ? forecast : null,
  };
}
