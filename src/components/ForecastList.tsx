import { CalendarDays } from 'lucide-react';
import type { ForecastDay, TemperatureUnit } from '../types/weather';
import ForecastDayCard from './ForecastDayCard';
import EmptyState from './states/EmptyState';

interface ForecastListProps {
  days: ForecastDay[] | null;
  unit: TemperatureUnit;
}

export default function ForecastList({ days, unit }: ForecastListProps) {
  return (
    <section aria-labelledby="forecast-heading" className="pb-10">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h2 id="forecast-heading" className="flex items-center gap-2 text-lg font-semibold">
          <CalendarDays size={18} aria-hidden="true" className="text-slate-400" />
          Previsão diária
        </h2>
        {days?.length ? <span className="text-xs text-slate-300">{days.length} dias</span> : null}
      </div>
      {days?.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {days.map((day) => (
            <li key={day.date}>
              <ForecastDayCard day={day} unit={unit} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState message="Previsão diária indisponível." />
      )}
    </section>
  );
}
