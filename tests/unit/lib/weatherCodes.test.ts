import { describe, expect, it } from 'vitest';
import { getWeatherCondition, type WeatherIconName } from '../../../src/lib/weatherCodes';

const conditions: { codes: number[]; label: string; icon: WeatherIconName }[] = [
  { codes: [0], label: 'Céu limpo', icon: 'sun' },
  { codes: [1], label: 'Predominantemente ensolarado', icon: 'cloud-sun' },
  { codes: [2], label: 'Parcialmente nublado', icon: 'cloud-sun' },
  { codes: [3], label: 'Nublado', icon: 'cloud' },
  { codes: [45, 48], label: 'Nevoeiro', icon: 'fog' },
  { codes: [51, 53, 55, 56, 57], label: 'Garoa', icon: 'drizzle' },
  { codes: [61, 63, 65, 66, 67, 80, 81, 82], label: 'Chuva', icon: 'rain' },
  { codes: [71, 73, 75, 77, 85, 86], label: 'Neve', icon: 'snow' },
  { codes: [95, 96, 99], label: 'Trovoadas', icon: 'storm' },
];

describe('getWeatherCondition — RF2, RF3, T-05', () => {
  for (const { codes, label, icon } of conditions) {
    it.each(codes)('mapeia o codigo WMO %s para texto e icone', (code) => {
      expect(getWeatherCondition(code)).toEqual({ label, icon });
    });
  }

  it.each([null, -1, 999, Number.NaN])('usa fallback para %s', (code) => {
    expect(getWeatherCondition(code)).toEqual({
      label: 'Condição indisponível',
      icon: 'unknown',
    });
  });
});
