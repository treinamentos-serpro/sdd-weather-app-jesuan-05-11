import type { TemperatureUnit } from '../types/weather';

interface UnitToggleProps {
  unit: TemperatureUnit;
  onChange: (unit: TemperatureUnit) => void;
}

export default function UnitToggle({ unit, onChange }: UnitToggleProps) {
  return (
    <fieldset className="flex shrink-0 items-center rounded-lg border border-slate-400 bg-white/5 p-1 backdrop-blur-md">
      <legend className="sr-only">Unidade de temperatura</legend>
      {(['celsius', 'fahrenheit'] as const).map((option) => (
        <label key={option} className="relative cursor-pointer">
          <input
            type="radio"
            name="temperature-unit"
            value={option}
            checked={unit === option}
            onChange={() => onChange(option)}
            className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
            aria-label={option === 'celsius' ? 'Celsius' : 'Fahrenheit'}
          />
          <span className="flex h-11 w-12 items-center justify-center rounded-md text-sm font-semibold text-slate-300 transition-colors peer-checked:bg-cyan-300 peer-checked:text-night-900 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan-300">
            {option === 'celsius' ? '°C' : '°F'}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
