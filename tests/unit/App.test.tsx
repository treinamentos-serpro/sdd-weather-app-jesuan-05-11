import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { getWeather, searchCities } from '../../src/services/weatherService';
import type { City, WeatherData } from '../../src/types/weather';
import { deferred } from '../fixtures/deferred';
import { city, otherCity, weather } from '../fixtures/weather';

vi.mock('../../src/services/weatherService', () => ({
  searchCities: vi.fn(),
  getWeather: vi.fn(),
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(searchCities).mockResolvedValue([city]);
  vi.mocked(getWeather).mockResolvedValue(weather);
});

async function selectInitialCity(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
  await user.click(await screen.findByRole('button', { name: /São Paulo.*Brasil/ }));
  await screen.findByText('24 °C');
}

describe('interface conectada ao servico', () => {
  it('exibe clima atual e cinco dias, convertendo todas as temperaturas', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    await selectInitialCity(user);
    expect(screen.getByRole('heading', { name: 'São Paulo', level: 1 })).toBeVisible();
    expect(screen.getByText('24 °C')).toBeVisible();
    expect(screen.getAllByRole('article')).toHaveLength(5);
    for (const metric of ['Umidade', 'Vento', 'Precipitação', 'Pressão'])
      expect(screen.getByText(metric)).toBeVisible();
    await user.click(screen.getByRole('radio', { name: 'Fahrenheit' }));
    expect(screen.getByText('75 °F')).toBeVisible();
    expect(screen.getByRole('main')).not.toHaveTextContent('°C');
    for (const [index, card] of screen.getAllByRole('article').entries()) {
      const temperatures = [
        ['64 °F', '81 °F'],
        ['66 °F', '84 °F'],
        ['68 °F', '79 °F'],
        ['63 °F', '73 °F'],
        ['64 °F', '77 °F'],
      ][index];
      for (const temperature of temperatures)
        expect(within(card).getByText(temperature)).toBeVisible();
    }
    await user.click(screen.getByRole('radio', { name: 'Celsius' }));
    expect(screen.getByText('24 °C')).toBeVisible();
    expect(screen.queryByText('75 °F')).not.toBeInTheDocument();
    expect(screen.getByRole('main')).not.toHaveTextContent('°F');
    expect(getWeather).toHaveBeenCalledOnce();
  });

  it('valida busca vazia e permite buscar sem acentos e selecionar pelo teclado', async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByRole('searchbox', { name: 'Buscar cidade' });
    await user.type(input, '   {Enter}');
    expect(screen.getByRole('alert')).toHaveTextContent('Informe o nome');
    expect(searchCities).not.toHaveBeenCalled();
    await user.clear(input);
    vi.mocked(searchCities).mockResolvedValueOnce([otherCity]);
    await user.type(input, 'rio{Enter}');
    const result = await screen.findByRole('button', { name: /Rio de Janeiro.*Brasil/ });
    result.focus();
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('heading', { name: 'Rio de Janeiro', level: 1 })).toBeVisible();
    expect(
      await within(screen.getByRole('region', { name: 'Rio de Janeiro' })).findByText('24 °C'),
    ).toBeVisible();
    await user.type(input, 'sao{Enter}');
    expect(await screen.findByRole('button', { name: /São Paulo.*Brasil/ })).toBeVisible();
  });

  it('exibe busca sem resultados sem apagar a cidade selecionada', async () => {
    const user = userEvent.setup();
    render(<App />);
    await selectInitialCity(user);
    vi.mocked(searchCities).mockResolvedValueOnce([]);
    await user.type(screen.getByRole('searchbox'), 'Atlantida{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('Nenhuma cidade encontrada');
    expect(screen.getByRole('heading', { name: 'São Paulo', level: 1 })).toBeVisible();
  });

  it('preserva cidade apos falha da previsao e permite retry', async () => {
    const user = userEvent.setup();
    vi.mocked(getWeather).mockRejectedValueOnce(new Error('Falha na consulta.'));
    render(<App />);
    await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
    await user.click(await screen.findByRole('button', { name: /São Paulo.*Brasil/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Falha na consulta');
    expect(screen.getByRole('heading', { name: 'São Paulo', level: 1 })).toBeVisible();
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: 'Tentar consultar o tempo novamente' }));
    expect(await screen.findByText('24 °C')).toBeVisible();
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(getWeather).toHaveBeenCalledTimes(2);
  });

  it('anuncia busca pendente e recupera falha sem apagar dados selecionados', async () => {
    const user = userEvent.setup();
    render(<App />);
    await selectInitialCity(user);
    const pending = deferred<City[]>();
    vi.mocked(searchCities).mockReturnValueOnce(pending.promise);
    await user.type(screen.getByRole('searchbox'), 'rio{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('Buscando cidades');
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
    expect(screen.getByText('24 °C')).toBeVisible();
    await act(async () => pending.reject(new Error('Falha de busca.')));
    expect(screen.getByRole('alert')).toHaveTextContent('Falha de busca.');
    expect(screen.getByRole('heading', { name: 'São Paulo', level: 1 })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeEnabled();
    vi.mocked(searchCities).mockResolvedValueOnce([otherCity]);
    await user.click(screen.getByRole('button', { name: 'Tentar buscar novamente' }));
    expect(await screen.findByRole('button', { name: /Rio de Janeiro.*Brasil/ })).toBeVisible();
    expect(searchCities).toHaveBeenLastCalledWith('rio', expect.any(AbortSignal));
    expect(getWeather).toHaveBeenCalledOnce();
  });

  it('limpa dados antigos e aplica a unidade escolhida durante a nova consulta', async () => {
    const user = userEvent.setup();
    render(<App />);
    await selectInitialCity(user);
    const pending = deferred<WeatherData>();
    vi.mocked(searchCities).mockResolvedValueOnce([otherCity]);
    vi.mocked(getWeather).mockReturnValueOnce(pending.promise);
    await user.type(screen.getByRole('searchbox'), 'rio{Enter}');
    await user.click(await screen.findByRole('button', { name: /Rio de Janeiro.*Brasil/ }));
    expect(screen.getByRole('status')).toHaveTextContent('Carregando dados');
    expect(screen.queryByText('24 °C')).not.toBeInTheDocument();
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    await user.click(screen.getByRole('radio', { name: 'Fahrenheit' }));
    await act(async () => pending.resolve(weather));
    expect(await screen.findByText('75 °F')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Rio de Janeiro', level: 1 })).toBeVisible();
    expect(screen.getByRole('main')).not.toHaveTextContent('°C');
    expect(getWeather).toHaveBeenLastCalledWith(-22.91, -43.17, expect.any(AbortSignal));
    expect(getWeather).toHaveBeenCalledTimes(2);
  });

  it.each([
    {
      current: weather.current,
      forecast: null,
      message: 'Previsão diária indisponível.',
      cards: 0,
    },
    { current: null, forecast: weather.forecast, message: 'Clima atual indisponível.', cards: 5 },
    { current: null, forecast: null, message: 'Clima atual indisponível.', cards: 0 },
  ])('mantem secoes independentes quando exibe $message com $cards dias', async (data) => {
    const user = userEvent.setup();
    vi.mocked(getWeather).mockResolvedValueOnce({ current: data.current, forecast: data.forecast });
    render(<App />);
    await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
    await user.click(await screen.findByRole('button', { name: /São Paulo.*Brasil/ }));
    expect(await screen.findByText(data.message)).toBeVisible();
    expect(screen.getByRole('heading', { name: 'São Paulo', level: 1 })).toBeVisible();
    expect(
      screen.getAllByRole('status').some((status) => status.textContent?.includes(data.message)),
    ).toBe(true);
    expect(screen.queryAllByRole('article')).toHaveLength(data.cards);
    if (data.current) expect(screen.getByText('24 °C')).toBeVisible();
    else expect(screen.queryByText('24 °C')).not.toBeInTheDocument();
  });

  it('mantem foco no conteudo apos selecionar, sem roubar foco ao terminar loading', async () => {
    const user = userEvent.setup();
    const pending = deferred<WeatherData>();
    vi.mocked(getWeather).mockReturnValueOnce(pending.promise);
    render(<App />);
    await user.type(screen.getByRole('searchbox'), 'sao{Enter}');
    await user.click(await screen.findByRole('button', { name: /São Paulo.*Brasil/ }));
    expect(screen.getByRole('main', { name: 'Tempo em São Paulo' })).toHaveFocus();
    await user.click(screen.getByRole('radio', { name: 'Fahrenheit' }));
    await act(async () => pending.resolve(weather));
    expect(screen.getByRole('radio', { name: 'Fahrenheit' })).toHaveFocus();
    expect(screen.getByText('75 °F')).toBeVisible();
  });

  it('distingue erros simultaneos e devolve foco ao contexto de cada retry', async () => {
    const user = userEvent.setup();
    vi.mocked(getWeather).mockRejectedValueOnce(new Error('Falha do tempo'));
    render(<App />);
    await user.type(screen.getByRole('searchbox'), 'sao{Enter}');
    await user.click(await screen.findByRole('button', { name: /São Paulo.*Brasil/ }));
    vi.mocked(searchCities).mockRejectedValueOnce(new Error('Falha da busca'));
    await user.type(screen.getByRole('searchbox'), 'rio{Enter}');
    expect(screen.getAllByRole('alert')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Tentar buscar novamente' }));
    expect(screen.getByRole('searchbox')).toHaveFocus();
    expect(screen.getByRole('alert')).toHaveTextContent('Falha do tempo');
    await user.click(screen.getByRole('button', { name: 'Tentar consultar o tempo novamente' }));
    expect(screen.getByRole('main')).toHaveFocus();
    expect(await screen.findByText('24 °C')).toBeVisible();
    expect(getWeather).toHaveBeenCalledTimes(2);
    expect(searchCities).toHaveBeenCalledTimes(3);
  });
});
