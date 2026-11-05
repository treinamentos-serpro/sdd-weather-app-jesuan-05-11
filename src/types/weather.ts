export type TemperatureUnit = 'celsius' | 'fahrenheit';

export interface City {
  name: string;
  country: string;
  countryCode: string | null;
  region: string | null;
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  observedAt: string;
  temperatureC: number | null;
  weatherCode: number | null;
  humidityPercent: number | null;
  windSpeedKmh: number | null;
  pressureHpa: number | null;
  precipitationMm: number | null;
}

export interface ForecastDay {
  date: string;
  minTemperatureC: number | null;
  maxTemperatureC: number | null;
  weatherCode: number | null;
  precipitationMm: number | null;
  precipitationProbabilityPercent?: number | null;
}

export interface WeatherData {
  current: CurrentWeather | null;
  forecast: ForecastDay[] | null;
}
