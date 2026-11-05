import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useWeather from '../../../src/hooks/useWeather';
import { getWeather, searchCities } from '../../../src/services/weatherService';
import type { City, WeatherData } from '../../../src/types/weather';
import { deferred } from '../../fixtures/deferred';
import { city, otherCity, weather } from '../../fixtures/weather';

vi.mock('../../../src/services/weatherService', () => ({
  searchCities: vi.fn(),
  getWeather: vi.fn(),
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(searchCities).mockResolvedValue([city]);
  vi.mocked(getWeather).mockResolvedValue(weather);
});

describe('useWeather', () => {
  it('inicia sem cidade, ignora busca vazia e publica resultados e estado vazio', async () => {
    const { result } = renderHook(() => useWeather());
    expect(result.current.selectedCity).toBeNull();
    expect(result.current.unit).toBe('celsius');
    await act(async () => {
      await result.current.search('  ');
    });
    expect(searchCities).not.toHaveBeenCalled();
    const pending = deferred<City[]>();
    vi.mocked(searchCities).mockReturnValueOnce(pending.promise);
    let search: Promise<void> = Promise.resolve();
    act(() => {
      search = result.current.search('São Paulo');
    });
    expect(result.current.searchStatus).toBe('loading');
    await act(async () => {
      pending.resolve([city]);
      await search;
    });
    expect(result.current.searchResults).toEqual([city]);
    expect(result.current.searchStatus).toBe('success');
    vi.mocked(searchCities).mockResolvedValueOnce([]);
    await act(async () => {
      await result.current.search('inexistente');
    });
    expect(result.current.searchStatus).toBe('empty');
  });

  it('preserva unidade alterada durante consulta e limpa dados ao trocar cidade', async () => {
    const { result } = renderHook(() => useWeather());
    await act(async () => {
      await result.current.selectCity(city);
    });
    const pending = deferred<WeatherData>();
    vi.mocked(getWeather).mockReturnValueOnce(pending.promise);
    let selection: Promise<void> = Promise.resolve();
    act(() => {
      selection = result.current.selectCity(otherCity);
    });
    expect(result.current.weatherStatus).toBe('loading');
    expect(result.current.weather).toBeNull();
    act(() => {
      result.current.setUnit('fahrenheit');
    });
    await act(async () => {
      pending.resolve(weather);
      await selection;
    });
    expect(result.current.selectedCity).toEqual(otherCity);
    expect(result.current.unit).toBe('fahrenheit');
    expect(result.current.weatherStatus).toBe('success');
    expect(getWeather).toHaveBeenCalledTimes(2);
  });

  it('separa falhas, preserva cidade e permite retry de previsao e busca', async () => {
    const { result } = renderHook(() => useWeather());
    vi.mocked(getWeather).mockRejectedValueOnce(new Error('Falha de previsão'));
    await act(async () => {
      await result.current.selectCity(city);
    });
    expect(result.current.selectedCity).toEqual(city);
    expect(result.current.weatherStatus).toBe('error');
    vi.mocked(searchCities).mockRejectedValueOnce(new Error('Falha de busca'));
    await act(async () => {
      await result.current.search('São Paulo');
    });
    expect(result.current.searchStatus).toBe('error');
    expect(result.current.weatherError).toBe('Falha de previsão');
    await act(async () => {
      await result.current.retryWeather();
    });
    expect(result.current.weatherStatus).toBe('success');
    expect(result.current.searchStatus).toBe('error');
    await act(async () => {
      await result.current.retrySearch();
    });
    expect(result.current.searchStatus).toBe('success');
    expect(result.current.selectedCity).toEqual(city);
    expect(vi.mocked(searchCities).mock.calls.at(-1)?.[0]).toBe('São Paulo');
  });

  it('cancela e ignora buscas antigas mesmo quando o servico responde fora de ordem', async () => {
    const old = deferred<City[]>();
    vi.mocked(searchCities).mockReturnValueOnce(old.promise).mockResolvedValueOnce([otherCity]);
    const { result } = renderHook(() => useWeather());
    let previous: Promise<void> = Promise.resolve();
    act(() => {
      previous = result.current.search('São Paulo');
    });
    const previousSignal = vi.mocked(searchCities).mock.calls[0][1];
    await act(async () => {
      await result.current.search('Rio');
    });
    expect(previousSignal?.aborted).toBe(true);
    await act(async () => {
      old.resolve([city]);
      await previous;
    });
    expect(result.current.searchResults).toEqual([otherCity]);
  });

  it('ignora falha obsoleta de previsao apos selecionar outra cidade', async () => {
    const old = deferred<WeatherData>();
    vi.mocked(getWeather).mockReturnValueOnce(old.promise).mockResolvedValueOnce(weather);
    const { result } = renderHook(() => useWeather());
    let previous: Promise<void> = Promise.resolve();
    act(() => {
      previous = result.current.selectCity(city);
    });
    await act(async () => {
      await result.current.selectCity(otherCity);
    });
    await act(async () => {
      old.reject(new Error('Falha antiga'));
      await previous;
    });
    expect(result.current.selectedCity).toEqual(otherCity);
    expect(result.current.weatherStatus).toBe('success');
    expect(result.current.weatherError).toBeNull();
  });

  it('cancela consultas pendentes ao desmontar', () => {
    vi.mocked(searchCities).mockReturnValue(new Promise(() => {}));
    vi.mocked(getWeather).mockReturnValue(new Promise(() => {}));
    const { result, unmount } = renderHook(() => useWeather());
    act(() => {
      void result.current.selectCity(city);
      void result.current.search('Rio');
    });
    const searchSignal = vi.mocked(searchCities).mock.calls[0][1];
    const weatherSignal = vi.mocked(getWeather).mock.calls[0][2];
    unmount();
    expect(searchSignal?.aborted).toBe(true);
    expect(weatherSignal?.aborted).toBe(true);
  });

  it('ignora sucesso obsoleto sem misturar dados de cidades diferentes', async () => {
    const old = deferred<WeatherData>();
    const latest = { current: null, forecast: null };
    vi.mocked(getWeather).mockReturnValueOnce(old.promise).mockResolvedValueOnce(latest);
    const { result } = renderHook(() => useWeather());
    let previous = Promise.resolve();
    act(() => {
      previous = result.current.selectCity(city);
    });
    const signal = vi.mocked(getWeather).mock.calls[0][2];
    await act(async () => {
      await result.current.selectCity(otherCity);
    });
    expect(signal?.aborted).toBe(true);
    await act(async () => {
      old.resolve(weather);
      await previous;
    });
    expect(result.current.selectedCity).toEqual(otherCity);
    expect(result.current.weather).toEqual(latest);
  });

  it('ignora erro de busca obsoleta depois de selecionar uma cidade', async () => {
    const pending = deferred<City[]>();
    vi.mocked(searchCities).mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useWeather());
    let search = Promise.resolve();
    act(() => {
      search = result.current.search('São Paulo');
    });
    await act(async () => {
      await result.current.selectCity(otherCity);
      pending.reject(new Error('Erro obsoleto'));
      await search;
    });
    expect(result.current.searchStatus).toBe('idle');
    expect(result.current.searchError).toBeNull();
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.selectedCity).toEqual(otherCity);
  });

  it('retry da busca usa o ultimo envio, nao o texto editado depois', async () => {
    vi.mocked(searchCities).mockRejectedValueOnce(new Error('Falha de busca'));
    const { result } = renderHook(() => useWeather());
    await act(async () => {
      await result.current.search(' São Paulo ');
    });
    act(() => result.current.setQuery('Rio'));
    await act(async () => {
      await result.current.retrySearch();
    });
    expect(vi.mocked(searchCities).mock.calls.map(([query]) => query)).toEqual([
      'São Paulo',
      'São Paulo',
    ]);
    expect(result.current.query).toBe('Rio');
  });

  it('editar busca pendente cancela a resposta antiga e libera outra sem apagar o clima', async () => {
    const pending = deferred<City[]>();
    const { result } = renderHook(() => useWeather());
    await act(async () => {
      await result.current.selectCity(city);
    });
    vi.mocked(searchCities).mockReturnValueOnce(pending.promise);
    let previous = Promise.resolve();
    act(() => {
      previous = result.current.search('sao');
    });
    const signal = vi.mocked(searchCities).mock.calls[0][1];
    act(() => result.current.setQuery('rio'));
    expect(signal?.aborted).toBe(true);
    expect(result.current.searchStatus).toBe('idle');
    expect(result.current.selectedCity).toEqual(city);
    expect(result.current.weather).toEqual(weather);
    vi.mocked(searchCities).mockResolvedValueOnce([otherCity]);
    await act(async () => {
      await result.current.search();
      pending.resolve([city]);
      await previous;
    });
    expect(result.current.searchResults).toEqual([otherCity]);
    expect(result.current.searchStatus).toBe('success');
    expect(getWeather).toHaveBeenCalledOnce();
  });
});
