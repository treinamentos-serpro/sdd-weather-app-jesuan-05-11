import { Droplets, Gauge, MapPin, Umbrella, Wind } from 'lucide-react';
import { formatDate, formatNumber, isValidObservationTime } from '../lib/format';
import { formatTemperature } from '../lib/temperature';
import { getWeatherCondition } from '../lib/weatherCodes';
import type { City, CurrentWeather as CurrentWeatherData, TemperatureUnit } from '../types/weather';
import WeatherIcon from './WeatherIcon';

interface CurrentWeatherProps {
  city: City;
  weather: CurrentWeatherData;
  unit: TemperatureUnit;
}

export default function CurrentWeather({ city, weather, unit }: CurrentWeatherProps) {
  const hasObservationTime = isValidObservationTime(weather.observedAt);
  const metrics = [
    {
      label: 'Umidade',
      value: weather.humidityPercent,
      unit: '%',
      Icon: Droplets,
      color: 'text-cyan-300',
    },
    {
      label: 'Vento',
      value: weather.windSpeedKmh,
      unit: 'km/h',
      Icon: Wind,
      color: 'text-emerald-300',
    },
    {
      label: 'Precipitação',
      value: weather.precipitationMm,
      unit: 'mm',
      Icon: Umbrella,
      color: 'text-sky-300',
    },
    {
      label: 'Pressão',
      value: weather.pressureHpa,
      unit: 'hPa',
      Icon: Gauge,
      color: 'text-amber-200',
    },
  ];

  return (
    <section aria-labelledby="current-heading" className="relative py-10 sm:py-14">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-full">
          <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-cyan-200">
            <MapPin size={14} aria-hidden="true" />
            <span className="min-w-0 break-words">
              {[city.region, city.country].filter(Boolean).join(' · ')}
            </span>
          </p>
          <h1 id="current-heading" className="break-words text-3xl font-semibold sm:text-4xl">
            {city.name}
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            {hasObservationTime ? (
              <>
                <time dateTime={weather.observedAt.slice(0, 10)}>
                  {formatDate(weather.observedAt.slice(0, 10))}
                </time>
                <span className="mx-2 text-slate-500">/</span>
                {weather.observedAt.slice(11, 16)} · Horário local
              </>
            ) : (
              'Horário indisponível'
            )}
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-amber-200/5 px-3 py-1.5 text-xs text-amber-100">
          <span className="h-1.5 w-1.5 rounded-full bg-sun" />
          Open-Meteo
        </span>
      </div>
      <div className="my-9 flex flex-wrap items-center justify-between gap-6 sm:my-12 sm:justify-start sm:gap-16">
        <div aria-live="polite" aria-atomic="true">
          <h2 className="mb-1 text-sm text-slate-300">Tempo agora</h2>
          <p className="temperature text-6xl font-medium leading-none text-white sm:text-8xl lg:text-9xl">
            {formatTemperature(weather.temperatureC, unit)}
          </p>
          <p className="mt-4 text-base text-slate-200 sm:text-lg">
            {getWeatherCondition(weather.weatherCode).label}
          </p>
        </div>
        <WeatherIcon
          code={weather.weatherCode}
          className="h-20 w-20 shrink-0 drop-shadow-[0_0_24px_rgba(245,185,66,0.15)] sm:h-36 sm:w-36"
        />
      </div>
      <dl className="grid grid-cols-2 gap-x-5 gap-y-7 border-t border-white/10 pt-7 sm:grid-cols-4 sm:gap-6">
        {metrics.map(({ label, value, unit: metricUnit, Icon, color }) => (
          <div key={label} className="min-w-0">
            <dt className="mb-2 flex items-center gap-2 text-xs text-slate-300 sm:text-sm">
              <Icon size={17} aria-hidden="true" className={color} />
              {label}
            </dt>
            <dd className="text-2xl font-medium tabular-nums">
              {value === null ? (
                '—'
              ) : (
                <>
                  {formatNumber(value)}
                  <span className="ml-1.5 text-sm font-normal text-slate-300">{metricUnit}</span>
                </>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
