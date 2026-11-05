import { Droplets } from 'lucide-react';
import { formatDate, formatNumber } from '../lib/format';
import { formatTemperature } from '../lib/temperature';
import { getWeatherCondition } from '../lib/weatherCodes';
import type { ForecastDay, TemperatureUnit } from '../types/weather';
import WeatherIcon from './WeatherIcon';

interface ForecastDayCardProps {
  day: ForecastDay;
  unit: TemperatureUnit;
}

export default function ForecastDayCard({ day, unit }: ForecastDayCardProps) {
  return (
    <article
      aria-label={`Previsão de ${formatDate(day.date)}`}
      className="flex h-full min-w-0 flex-col rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-md transition-colors hover:border-white/25 hover:bg-white/[0.08] sm:p-5"
    >
      <h3 className="text-sm font-medium text-slate-200">
        <time dateTime={day.date}>{formatDate(day.date)}</time>
      </h3>
      <WeatherIcon code={day.weatherCode} className="my-6 h-12 w-12" />
      <p className="min-h-10 text-xs leading-5 text-slate-300">
        {getWeatherCondition(day.weatherCode).label}
      </p>
      <dl className="mt-4 space-y-2 text-sm tabular-nums">
        <div className="flex flex-wrap items-baseline justify-between gap-x-1">
          <dt className="text-xs text-slate-300">Máx.</dt>
          <dd className="font-semibold">{formatTemperature(day.maxTemperatureC, unit)}</dd>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-1">
          <dt className="text-xs text-slate-300">Mín.</dt>
          <dd className="text-slate-300">{formatTemperature(day.minTemperatureC, unit)}</dd>
        </div>
      </dl>
      <p className="mt-5 flex items-center gap-2 border-t border-white/10 pt-3 text-xs text-cyan-200">
        <Droplets size={14} aria-hidden="true" />
        <span>
          <span className="sr-only">Precipitação: </span>
          {day.precipitationMm === null ? '—' : `${formatNumber(day.precipitationMm)} mm`}
        </span>
      </p>
      {day.precipitationProbabilityPercent !== undefined && (
        <p className="mt-2 text-xs text-slate-300">
          Chance de chuva:{' '}
          {day.precipitationProbabilityPercent === null
            ? '—'
            : `${formatNumber(day.precipitationProbabilityPercent)}%`}
        </p>
      )}
    </article>
  );
}
