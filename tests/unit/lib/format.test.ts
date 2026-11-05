import { describe, expect, it, vi } from 'vitest';
import {
  formatDate,
  formatNumber,
  isValidDate,
  isValidObservationTime,
} from '../../../src/lib/format';

describe('formatDate — RF3, RNF5, T-07', () => {
  it.each([
    ['2026-11-05', 'qui., 05/11'],
    ['2026-11-06', 'sex., 06/11'],
    ['2026-11-07', 'sáb., 07/11'],
    ['2026-11-08', 'dom., 08/11'],
    ['2026-11-09', 'seg., 09/11'],
    ['2026-12-31', 'qui., 31/12'],
    ['2027-01-01', 'sex., 01/01'],
    ['2024-02-29', 'qui., 29/02'],
  ])('localiza a data civil %s em pt-BR', (date, expected) => {
    expect(formatDate(date)).toBe(expected);
  });

  describe('validacao de datas e numeros — hardening', () => {
    it.each([
      '2026-02-29',
      '2026-02-31',
      '2026-04-31',
      '2026-13-01',
      '2026-11-5',
      '',
      null,
    ])('rejeita data civil invalida %s sem normalizar para outro dia', (date) =>
      expect(isValidDate(date)).toBe(false));

    it.each(['2024-02-29', '2026-12-31', '2027-01-01'])('aceita data civil real %s', (date) => {
      expect(isValidDate(date)).toBe(true);
    });

    it.each([
      '2026-02-31T12:00',
      '2026-11-05T24:00',
      '2026-11-05T14:60',
      '2026-11-05T14:30junk',
    ])('nao apresenta horario local invalido %s', (time) =>
      expect(isValidObservationTime(time)).toBe(false));

    it.each([
      '2026-11-05T00:00',
      '2026-11-05T23:59',
      '2026-11-05T14:30:15',
    ])('aceita horario local %s', (time) => expect(isValidObservationTime(time)).toBe(true));

    it('formata metricas em pt-BR com separadores consistentes', () => {
      expect(formatNumber(1015)).toBe('1.015');
      expect(formatNumber(4.2)).toBe('4,2');
      expect(formatNumber(0)).toBe('0');
    });
  });

  it.each([
    'America/Sao_Paulo',
    'Pacific/Kiritimati',
    'Pacific/Honolulu',
  ])('preserva o dia no fuso %s', (timezone) => {
    try {
      vi.stubEnv('TZ', timezone);
      expect(formatDate('2027-01-01')).toBe('sex., 01/01');
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
