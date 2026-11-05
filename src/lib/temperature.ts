import type { TemperatureUnit } from '../types/weather';

export function formatTemperature(value: number | null, unit: TemperatureUnit): string {
  if (value === null || !Number.isFinite(value)) return '—';
  const converted = unit === 'fahrenheit' ? (value * 9) / 5 + 32 : value;
  return `${Math.round(converted)} °${unit === 'fahrenheit' ? 'F' : 'C'}`;
}
