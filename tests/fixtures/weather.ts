import type { City, WeatherData } from '../../src/types/weather';

export const city: City = {
  name: 'São Paulo',
  region: 'São Paulo',
  country: 'Brasil',
  countryCode: 'BR',
  latitude: -23.55,
  longitude: -46.63,
};
export const otherCity: City = {
  name: 'Rio de Janeiro',
  region: 'Rio de Janeiro',
  country: 'Brasil',
  countryCode: 'BR',
  latitude: -22.91,
  longitude: -43.17,
};

export const weather: WeatherData = {
  current: {
    observedAt: '2026-11-05T14:30',
    temperatureC: 24,
    weatherCode: 2,
    humidityPercent: 64,
    windSpeedKmh: 12,
    precipitationMm: 0,
    pressureHpa: 1015,
  },
  forecast: [
    {
      date: '2026-11-05',
      minTemperatureC: 18,
      maxTemperatureC: 27,
      weatherCode: 2,
      precipitationMm: 0,
    },
    {
      date: '2026-11-06',
      minTemperatureC: 19,
      maxTemperatureC: 29,
      weatherCode: 0,
      precipitationMm: 0,
    },
    {
      date: '2026-11-07',
      minTemperatureC: 20,
      maxTemperatureC: 26,
      weatherCode: 61,
      precipitationMm: 4.2,
    },
    {
      date: '2026-11-08',
      minTemperatureC: 17,
      maxTemperatureC: 23,
      weatherCode: 3,
      precipitationMm: 0.8,
    },
    {
      date: '2026-11-09',
      minTemperatureC: 18,
      maxTemperatureC: 25,
      weatherCode: 1,
      precipitationMm: 0,
    },
  ],
};

export const mockLocations = [{ city, weather }];

export const geocodingResponse = {
  results: [city, otherCity].map((location) => ({
    name: location.name,
    admin1: location.region,
    country: location.country,
    country_code: location.countryCode,
    latitude: location.latitude,
    longitude: location.longitude,
  })),
};

export const forecastResponse = {
  current: {
    time: '2026-11-05T14:30',
    temperature_2m: 24,
    weather_code: 2,
    relative_humidity_2m: 64,
    wind_speed_10m: 12,
    surface_pressure: 1015,
    precipitation: 0,
  },
  current_units: {
    temperature_2m: '°C',
    weather_code: 'wmo code',
    relative_humidity_2m: '%',
    wind_speed_10m: 'km/h',
    surface_pressure: 'hPa',
    precipitation: 'mm',
  },
  daily: {
    time: weather.forecast?.map((day) => day.date),
    temperature_2m_min: weather.forecast?.map((day) => day.minTemperatureC),
    temperature_2m_max: weather.forecast?.map((day) => day.maxTemperatureC),
    weather_code: weather.forecast?.map((day) => day.weatherCode),
    precipitation_sum: weather.forecast?.map((day) => day.precipitationMm),
    precipitation_probability_max: [10, 0, 80, 30, 5],
  },
  daily_units: {
    temperature_2m_min: '°C',
    temperature_2m_max: '°C',
    weather_code: 'wmo code',
    precipitation_sum: 'mm',
    precipitation_probability_max: '%',
  },
};
