import { describe, expect, it } from 'vitest';
import { formatTemperature } from '../../../src/lib/temperature';

describe('formatTemperature', () => {
  it.each([
    [0, '32 °F'],
    [100, '212 °F'],
    [-40, '-40 °F'],
    [20.3, '69 °F'],
  ])('converte %s Celsius antes de arredondar', (value, expected) => {
    expect(formatTemperature(value, 'fahrenheit')).toBe(expected);
  });

  it.each([
    [20.6, '21 °C'],
    [20.4, '20 °C'],
    [-12.6, '-13 °C'],
    [0, '0 °C'],
  ])('arredonda %s Celsius somente na apresentacao', (value, expected) => {
    expect(formatTemperature(value, 'celsius')).toBe(expected);
  });

  it.each([
    null,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ])('nao converte o valor indisponivel %s em nenhuma escala', (value) => {
    expect(formatTemperature(value, 'celsius')).toBe('—');
    expect(formatTemperature(value, 'fahrenheit')).toBe('—');
  });

  it('nao acumula arredondamento ao alternar a unidade', () => {
    const temperature = 20.3;
    expect(formatTemperature(temperature, 'celsius')).toBe('20 °C');
    expect(formatTemperature(temperature, 'fahrenheit')).toBe('69 °F');
    expect(formatTemperature(temperature, 'celsius')).toBe('20 °C');
  });
});
