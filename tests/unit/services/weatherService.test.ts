import { afterEach, describe, expect, it, vi } from 'vitest';
import { getWeather, searchCities } from '../../../src/services/weatherService';
import { city, forecastResponse, geocodingResponse } from '../../fixtures/weather';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function respond(payload: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => payload });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('weatherService', () => {
  it('codifica a busca e normaliza cidades sem regiao', async () => {
    const fetchMock = respond({
      results: [
        {
          name: 'São Paulo',
          latitude: -23.55,
          longitude: -46.63,
          country: 'Brasil',
          country_code: 'BR',
        },
      ],
    });
    const cities = await searchCities(' São Paulo & região ');
    const url = fetchMock.mock.calls[0][0] as URL;
    expect(url.searchParams.get('name')).toBe('São Paulo & região');
    expect(url.searchParams.get('count')).toBe('5');
    expect(url.searchParams.get('language')).toBe('pt');
    expect(cities[0]).toMatchObject({
      name: 'São Paulo',
      region: null,
      countryCode: 'BR',
      latitude: -23.55,
    });
  });

  it('nao consulta busca vazia e retorna lista vazia sem correspondencias', async () => {
    const fetchMock = respond({});
    expect(await searchCities('   ')).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await searchCities('inexistente')).toEqual([]);
  });

  it('normaliza clima e arrays parciais sem confundir mm com probabilidade', async () => {
    const fetchMock = respond({
      current: {
        time: '2026-11-05T14:30',
        temperature_2m: 24.3,
        weather_code: 2,
        relative_humidity_2m: 64,
        wind_speed_10m: 12,
        surface_pressure: 1015,
        precipitation: 0.5,
      },
      current_units: {
        temperature_2m: '°C',
        weather_code: 'wmo code',
        relative_humidity_2m: '%',
        wind_speed_10m: 'km/h',
        surface_pressure: 'hPa',
        precipitation: 'mm',
      },
      daily: {
        time: ['2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09'],
        temperature_2m_max: [27, 28],
        temperature_2m_min: [18],
        weather_code: [2],
        precipitation_sum: [4.2],
        precipitation_probability_max: [80],
      },
      daily_units: {
        temperature_2m_max: '°C',
        temperature_2m_min: '°C',
        weather_code: 'wmo code',
        precipitation_sum: 'mm',
        precipitation_probability_max: '%',
      },
    });
    const weather = await getWeather(-23.55, -46.63);
    expect(weather.current).toMatchObject({
      temperatureC: 24.3,
      humidityPercent: 64,
      precipitationMm: 0.5,
      pressureHpa: 1015,
      windSpeedKmh: 12,
    });
    expect(weather.forecast).toHaveLength(5);
    expect(weather.forecast?.[0]).toMatchObject({
      minTemperatureC: 18,
      precipitationMm: 4.2,
      precipitationProbabilityPercent: 80,
    });
    expect(weather.forecast?.[1].minTemperatureC).toBeNull();
    const url = fetchMock.mock.calls[0][0] as URL;
    expect(url.searchParams.get('daily')).toContain('precipitation_probability_max');
    expect(url.searchParams.get('temperature_unit')).toBe('celsius');
    expect(url.searchParams.get('timezone')).toBe('auto');
    expect(url.searchParams.get('forecast_days')).toBe('5');
  });

  it('preserva secoes independentes e rejeita unidades inesperadas', async () => {
    respond({
      current: { temperature_2m: 75, wind_speed_10m: 10 },
      current_units: { temperature_2m: '°F', wind_speed_10m: 'mp/h' },
    });
    expect(await getWeather(0, 0)).toMatchObject({
      current: { temperatureC: null, windSpeedKmh: null },
      forecast: null,
    });
    respond({ daily: { time: ['2026-11-05'] }, daily_units: {} });
    const weather = await getWeather(0, 0);
    expect(weather.current).toBeNull();
    expect(weather.forecast).toHaveLength(1);
  });

  it.each(['search', 'forecast'])('trata erros HTTP e de rede em %s', async (operation) => {
    const execute = () => (operation === 'search' ? searchCities('cidade') : getWeather(0, 0));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    await expect(execute()).rejects.toMatchObject({ code: 'http' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    await expect(execute()).rejects.toMatchObject({ code: 'network' });
  });

  it.each(['search', 'forecast'])('aborta e encerra %s apos 10 segundos', async (operation) => {
    vi.useFakeTimers();
    const fetchMock = vi.fn((_url: URL, _options: RequestInit) => new Promise(() => {}));
    vi.stubGlobal('fetch', fetchMock);
    const result = operation === 'search' ? searchCities('cidade') : getWeather(0, 0);
    const rejection = expect(result).rejects.toMatchObject({ code: 'timeout' });
    await vi.advanceTimersByTimeAsync(9_999);
    expect(fetchMock.mock.calls[0][1].signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await rejection;
    expect(fetchMock.mock.calls[0][1].signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('propaga cancelamento externo sem sucesso ou timeout', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    );

    const controller = new AbortController();
    const result = searchCities('cidade', controller.signal);
    const rejection = expect(result).rejects.toMatchObject({ code: 'cancelled' });
    controller.abort();
    await rejection;
  });

  it('classifica SyntaxError de WebKit mesmo quando e DOMException', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new DOMException('JSON truncado', 'SyntaxError');
        },
      }),
    );
    await expect(getWeather(0, 0)).rejects.toMatchObject({ code: 'invalid-response' });
  });

  it('ignora datas invalidas sem perder os dados atuais', async () => {
    respond({
      current: { temperature_2m: 20 },
      current_units: { temperature_2m: '°C' },
      daily: { time: ['2026-99-99', null, '2026-11-05'] },
    });
    const weather = await getWeather(0, 0);
    expect(weather.current?.temperatureC).toBe(20);
    expect(weather.forecast).toHaveLength(1);
    expect(weather.forecast?.[0].date).toBe('2026-11-05');
  });

  it.each([
    null,
    { error: true },
    { results: 'invalid' },
  ])('trata resposta invalida de geocoding', async (payload) => {
    respond(payload);
    await expect(searchCities('cidade')).rejects.toMatchObject({ code: 'invalid-response' });
  });

  it('preserva cidades homonimas e seu contexto geografico', async () => {
    respond({
      results: [
        { ...geocodingResponse.results[0], name: 'Santa Maria', admin1: 'Rio Grande do Sul' },
        {
          ...geocodingResponse.results[1],
          name: 'Santa Maria',
          admin1: 'Califórnia',
          country: 'Estados Unidos',
        },
      ],
    });
    const cities = await searchCities('Santa Maria');
    expect(cities).toHaveLength(2);
    expect(cities[0]).toMatchObject({
      name: 'Santa Maria',
      region: 'Rio Grande do Sul',
      country: 'Brasil',
    });
    expect(cities[1]).toMatchObject({
      name: 'Santa Maria',
      region: 'Califórnia',
      country: 'Estados Unidos',
    });
    expect(cities[0].latitude).not.toBe(cities[1].latitude);
  });

  it.each([
    { name: '' },
    { latitude: null },
    { longitude: '10' },
    { latitude: 91 },
    { longitude: -181 },
  ])('descarta local invalido sem perder correspondencias validas: %j', async (invalid) => {
    respond({
      results: [{ ...geocodingResponse.results[0], ...invalid }, geocodingResponse.results[1]],
    });
    expect(await searchCities('cidade')).toEqual([
      expect.objectContaining({ name: 'Rio de Janeiro', latitude: -22.91, longitude: -43.17 }),
    ]);
  });

  it('normaliza todos os campos e mantem exatamente cinco datas na ordem da fonte', async () => {
    const fetchMock = respond(forecastResponse);
    const result = await getWeather(city.latitude, city.longitude);
    expect(result.current).toEqual({
      observedAt: '2026-11-05T14:30',
      temperatureC: 24,
      weatherCode: 2,
      humidityPercent: 64,
      windSpeedKmh: 12,
      precipitationMm: 0,
      pressureHpa: 1015,
    });
    expect(result.forecast?.map((day) => day.date)).toEqual([
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
      '2026-11-09',
    ]);
    expect(result.forecast?.[2]).toEqual({
      date: '2026-11-07',
      minTemperatureC: 20,
      maxTemperatureC: 26,
      weatherCode: 61,
      precipitationMm: 4.2,
      precipitationProbabilityPercent: 80,
    });
    const url: URL = fetchMock.mock.calls[0][0];
    expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast');
    expect(url.searchParams.get('latitude')).toBe('-23.55');
    expect(url.searchParams.get('longitude')).toBe('-46.63');
    expect(url.searchParams.get('wind_speed_unit')).toBe('kmh');
    expect(url.searchParams.get('precipitation_unit')).toBe('mm');
  });

  it('limita previsao excedente a cinco dias', async () => {
    respond({
      ...forecastResponse,
      daily: {
        ...forecastResponse.daily,
        time: [...(forecastResponse.daily.time ?? []), '2026-11-10'],
      },
    });
    expect((await getWeather(0, 0)).forecast).toHaveLength(5);
  });

  it.each([
    null,
    '24',
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ])('marca temperatura invalida %s como indisponivel sem apagar outras metricas', async (value) => {
    respond({
      ...forecastResponse,
      current: { ...forecastResponse.current, temperature_2m: value },
      daily: { ...forecastResponse.daily, temperature_2m_min: [value, 19, 20, 17, 18] },
    });
    const result = await getWeather(0, 0);
    expect(result.current?.temperatureC).toBeNull();
    expect(result.current?.humidityPercent).toBe(64);
    expect(result.forecast?.[0].minTemperatureC).toBeNull();
    expect(result.forecast?.[1].minTemperatureC).toBe(19);
    expect(result.forecast).toHaveLength(5);
  });

  it.each([
    {},
    { current: null, daily: { time: [] } },
  ])('nao inventa dados para uma resposta sem secoes: %j', async (payload) => {
    respond(payload);
    expect(await getWeather(0, 0)).toEqual({ current: null, forecast: null });
  });

  it.each([
    null,
    [],
    'invalid',
    { error: true },
  ])('explicita erro em resposta de previsao invalida: %j', async (payload) => {
    respond(payload);
    await expect(getWeather(0, 0)).rejects.toMatchObject({ code: 'invalid-response' });
  });

  it.each(['search', 'forecast'])('nao inicia %s com sinal ja cancelado', async (operation) => {
    const fetchMock = respond({});
    const controller = new AbortController();
    controller.abort();
    const result =
      operation === 'search'
        ? searchCities('cidade', controller.signal)
        : getWeather(0, 0, controller.signal);
    await expect(result).rejects.toMatchObject({ code: 'cancelled' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('remove o timer e o listener externo depois de sucesso', async () => {
    vi.useFakeTimers();
    const fetchMock = respond(geocodingResponse);
    const controller = new AbortController();
    await searchCities('cidade', controller.signal);
    expect(vi.getTimerCount()).toBe(0);
    controller.abort();
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(false);
  });

  it.each([
    'search',
    'forecast',
  ])('classifica JSON malformado de %s como resposta invalida', async (operation) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new SyntaxError('JSON truncado');
        },
      }),
    );
    const result = operation === 'search' ? searchCities('cidade') : getWeather(0, 0);
    await expect(result).rejects.toMatchObject({
      code: 'invalid-response',
      message: 'O serviço retornou dados inválidos. Tente novamente.',
    });
  });

  it('normaliza nomes e remove coordenadas repetidas sem confundir homonimos', async () => {
    respond({
      results: [
        { ...geocodingResponse.results[0], name: ' São Paulo ' },
        geocodingResponse.results[0],
        geocodingResponse.results[1],
      ],
    });
    const result = await searchCities('sao');
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('São Paulo');
    expect(result[1].name).toBe('Rio de Janeiro');
  });

  it('descarta datas impossiveis e repetidas mantendo os indices dos demais campos', async () => {
    respond({
      ...forecastResponse,
      daily: {
        ...forecastResponse.daily,
        time: ['2026-02-31', '2026-11-06', '2026-11-06', '2026-11-08', '2026-11-09'],
      },
    });
    const result = await getWeather(0, 0);
    expect(result.forecast?.map((day) => [day.date, day.minTemperatureC])).toEqual([
      ['2026-11-06', 19],
      ['2026-11-08', 17],
      ['2026-11-09', 18],
    ]);
    expect(result.current?.temperatureC).toBe(24);
  });

  it.each([
    ['relative_humidity_2m', 'humidityPercent', -1],
    ['relative_humidity_2m', 'humidityPercent', 101],
    ['wind_speed_10m', 'windSpeedKmh', -2],
    ['precipitation', 'precipitationMm', -0.5],
    ['surface_pressure', 'pressureHpa', -10],
    ['weather_code', 'weatherCode', 2.5],
  ])('marca %s fora de faixa como indisponivel: %s = %s', async (field, normalized, value) => {
    respond({ ...forecastResponse, current: { ...forecastResponse.current, [field]: value } });
    expect((await getWeather(0, 0)).current).toMatchObject({
      [normalized]: null,
      temperatureC: 24,
    });
  });

  it('invalida extremos invertidos e precipitacao fora de faixa sem apagar o dia', async () => {
    respond({
      ...forecastResponse,
      daily: {
        ...forecastResponse.daily,
        temperature_2m_min: [30, 19, 20, 17, 18],
        precipitation_sum: [-1, 0, 4.2, 0.8, 0],
        precipitation_probability_max: [101, -1, 80, 30, 5],
      },
    });
    const result = await getWeather(0, 0);
    expect(result.forecast).toHaveLength(5);
    expect(result.forecast?.[0]).toMatchObject({
      minTemperatureC: null,
      maxTemperatureC: null,
      precipitationMm: null,
      precipitationProbabilityPercent: null,
      weatherCode: 2,
    });
    expect(result.forecast?.[1]).toMatchObject({
      minTemperatureC: 19,
      maxTemperatureC: 29,
      precipitationProbabilityPercent: null,
    });
  });

  it('preserva limites validos e temperaturas negativas sem aplicar faixa indevida', async () => {
    respond({
      ...forecastResponse,
      current: {
        ...forecastResponse.current,
        temperature_2m: -40,
        relative_humidity_2m: 0,
      },
      daily: {
        ...forecastResponse.daily,
        precipitation_probability_max: [0, 100, 80, 30, 5],
      },
    });
    const result = await getWeather(0, 0);
    expect(result.current).toMatchObject({
      temperatureC: -40,
      humidityPercent: 0,
      precipitationMm: 0,
    });
    expect(result.forecast?.[1].precipitationProbabilityPercent).toBe(100);
  });
});
