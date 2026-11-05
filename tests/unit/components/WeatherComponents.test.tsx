import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CurrentWeather from '../../../src/components/CurrentWeather';
import ForecastDayCard from '../../../src/components/ForecastDayCard';
import ForecastList from '../../../src/components/ForecastList';
import SearchBar from '../../../src/components/SearchBar';
import EmptyState from '../../../src/components/states/EmptyState';
import ErrorState from '../../../src/components/states/ErrorState';
import LoadingState from '../../../src/components/states/LoadingState';
import { city, mockLocations, weather } from '../../fixtures/weather';

describe('componentes de apresentacao', () => {
  it('apresenta todas as metricas atuais com unidades e horario local', () => {
    if (!weather.current) throw new Error('Mock sem clima atual');
    render(<CurrentWeather city={city} weather={weather.current} unit="celsius" />);
    const current = within(screen.getByRole('region', { name: 'São Paulo' }));
    expect(current.getByText('24 °C')).toBeVisible();
    expect(current.getByText('Parcialmente nublado')).toBeVisible();
    expect(current.getByText(/14:30 · Horário local/)).toBeVisible();
    for (const value of ['64%', '12km/h', '0mm', '1.015hPa'])
      expect(
        current
          .getAllByRole('definition')
          .some((metric) => metric.textContent?.replace(/\s+/g, ' ').trim() === value),
      ).toBe(true);
  });

  it('preserva os demais campos quando valores estao indisponiveis', () => {
    const { city, weather } = mockLocations[0];
    if (!weather.current) throw new Error('Mock sem clima atual');
    render(
      <CurrentWeather
        city={city}
        unit="fahrenheit"
        weather={{ ...weather.current, temperatureC: null, pressureHpa: null, weatherCode: 999 }}
      />,
    );
    expect(screen.getAllByText('—')).toHaveLength(2);
    expect(screen.getByText('Condição indisponível')).toBeVisible();
    expect(screen.getByText('64')).toBeVisible();
    expect(screen.getByText('km/h')).toBeVisible();
  });

  it('mantem os cinco dias quando um campo diario esta ausente', () => {
    const days = mockLocations[0].weather.forecast;
    if (!days) throw new Error('Mock sem previsao');
    render(
      <ForecastList unit="celsius" days={days.map((day) => ({ ...day, precipitationMm: null }))} />,
    );
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(screen.getAllByText('—')).toHaveLength(5);
    expect(screen.getByText('qui., 05/11')).toBeVisible();
  });

  it('apresenta ausencia de previsao sem inventar dias', () => {
    render(<ForecastList unit="celsius" days={null} />);
    expect(screen.getByRole('status')).toHaveTextContent('Previsão diária indisponível');
    expect(screen.queryAllByRole('article')).toHaveLength(0);
  });

  it('nao completa artificialmente uma previsao parcial', () => {
    render(<ForecastList unit="celsius" days={weather.forecast?.slice(0, 2) ?? null} />);
    expect(screen.getAllByRole('article').map((card) => card.getAttribute('aria-label'))).toEqual([
      'Previsão de qui., 05/11',
      'Previsão de sex., 06/11',
    ]);
  });

  it('indica todos os campos diarios ausentes sem converter null em zero', () => {
    render(
      <ForecastDayCard
        unit="fahrenheit"
        day={{
          date: '2026-11-05',
          minTemperatureC: null,
          maxTemperatureC: null,
          weatherCode: null,
          precipitationMm: null,
          precipitationProbabilityPercent: null,
        }}
      />,
    );
    const card = within(screen.getByRole('article', { name: 'Previsão de qui., 05/11' }));
    expect(card.getAllByText('—')).toHaveLength(3);
    expect(card.getByText('Chance de chuva: —')).toBeVisible();
    expect(card.getByText('Condição indisponível')).toBeVisible();
    expect(card.queryByText(/°F/)).not.toBeInTheDocument();
  });

  it('identifica probabilidade em porcentagem separada do volume em mm', () => {
    const day = mockLocations[0].weather.forecast?.[0];
    if (!day) throw new Error('Mock sem previsao');
    render(
      <ForecastDayCard
        day={{ ...day, precipitationMm: 4.2, precipitationProbabilityPercent: 80 }}
        unit="celsius"
      />,
    );
    expect(screen.getByText('4,2 mm')).toBeVisible();
    expect(screen.getByText('Chance de chuva: 80%')).toBeVisible();
  });

  it('mantem as metricas quando o horario de observacao falta', () => {
    const { city, weather } = mockLocations[0];
    if (!weather.current) throw new Error('Mock sem clima atual');
    render(
      <CurrentWeather
        city={city}
        weather={{ ...weather.current, observedAt: '' }}
        unit="celsius"
      />,
    );
    expect(screen.getByText('Horário indisponível')).toBeVisible();
    expect(screen.getByText('24 °C')).toBeVisible();
  });

  it.each([
    '2026-02-31T14:30',
    '2026-11-05T24:00',
  ])('nao rotula %s como horario valido', (observedAt) => {
    if (!weather.current) throw new Error('Mock sem clima atual');
    render(
      <CurrentWeather city={city} weather={{ ...weather.current, observedAt }} unit="celsius" />,
    );
    expect(screen.getByText('Horário indisponível')).toBeVisible();
    expect(screen.getByText('24 °C')).toBeVisible();
  });

  it('anuncia carregamento e vazio e permite retry por teclado', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <>
        <LoadingState />
        <EmptyState message="Nenhum dado disponível." />
        <ErrorState message="Não foi possível consultar o tempo." onRetry={onRetry} />
      </>,
    );
    expect(screen.getAllByRole('status')).toHaveLength(2);
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível');
    await user.tab();
    await user.keyboard('{Enter}');
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('bloqueia envios duplicados enquanto a busca carrega', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar value="São Paulo" onChange={vi.fn()} onSearch={onSearch} isLoading />);
    await user.click(screen.getByRole('searchbox'));
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
    expect(onSearch).not.toHaveBeenCalled();
  });
});
