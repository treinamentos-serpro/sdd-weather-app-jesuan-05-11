import { expect, type Locator, type Page, test } from '@playwright/test';
import { deferred } from '../fixtures/deferred';
import { forecastResponse, geocodingResponse } from '../fixtures/weather';

const forecastExpectations = [
  {
    date: 'qui., 05/11',
    celsius: ['18 °C', '27 °C'],
    fahrenheit: ['64 °F', '81 °F'],
    condition: 'Parcialmente nublado',
    precipitation: '0 mm',
  },
  {
    date: 'sex., 06/11',
    celsius: ['19 °C', '29 °C'],
    fahrenheit: ['66 °F', '84 °F'],
    condition: 'Céu limpo',
    precipitation: '0 mm',
  },
  {
    date: 'sáb., 07/11',
    celsius: ['20 °C', '26 °C'],
    fahrenheit: ['68 °F', '79 °F'],
    condition: 'Chuva',
    precipitation: '4,2 mm',
  },
  {
    date: 'dom., 08/11',
    celsius: ['17 °C', '23 °C'],
    fahrenheit: ['63 °F', '73 °F'],
    condition: 'Nublado',
    precipitation: '0,8 mm',
  },
  {
    date: 'seg., 09/11',
    celsius: ['18 °C', '25 °C'],
    fahrenheit: ['64 °F', '77 °F'],
    condition: 'Predominantemente ensolarado',
    precipitation: '0 mm',
  },
];

async function selectCity(page: Page, query = 'sao', name = /São Paulo.*Brasil/) {
  await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill(query);
  await page.getByRole('searchbox', { name: 'Buscar cidade' }).press('Enter');
  await page.getByRole('button', { name }).click();
}

async function expectForecast(page: Page, unit: 'celsius' | 'fahrenheit') {
  const cards = page.getByRole('article');
  await expect(cards).toHaveCount(5);
  for (const [index, day] of forecastExpectations.entries()) {
    const card = cards.nth(index);
    await expect(card).toHaveAccessibleName(`Previsão de ${day.date}`);
    for (const temperature of day[unit])
      await expect(card.getByText(temperature, { exact: true })).toBeVisible();
    await expect(card.getByText(day.condition, { exact: true })).toBeVisible();
    await expect(
      card.getByText(`Precipitação: ${day.precipitation}`, { exact: true }),
    ).toBeVisible();
  }
}

async function selectUnit(page: Page, unit: 'celsius' | 'fahrenheit') {
  await page.getByRole('radio', { name: unit === 'celsius' ? 'Celsius' : 'Fahrenheit' }).check();
}

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-05T14:30:00Z') });
  await page.route('https://*.open-meteo.com/**', async (route) => {
    await route.abort('blockedbyclient');
    throw new Error(`Chamada Open-Meteo sem mock: ${route.request().url()}`);
  });
  await page.route('https://geocoding-api.open-meteo.com/v1/search?**', async (route) => {
    const query =
      new URL(route.request().url()).searchParams
        .get('name')
        ?.normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase() ?? '';
    const results = geocodingResponse.results.filter((city) =>
      city.name
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .includes(query),
    );
    await route.fulfill({ json: { results } });
  });
  await page.route('https://api.open-meteo.com/v1/forecast?**', (route) =>
    route.fulfill({ json: forecastResponse }),
  );
});

for (const viewport of [
  { width: 320, height: 800, columns: 2 },
  { width: 768, height: 1024, columns: 3 },
  { width: 1440, height: 1000, columns: 5 },
]) {
  test(`fluxo Open-Meteo em ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const apiRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('open-meteo.com')) apiRequests.push(request.url());
    });
    await page.goto('/');
    const search = page.getByRole('searchbox', { name: 'Buscar cidade' });
    await search.fill('sao');
    await search.press('Enter');
    await page.getByRole('button', { name: /São Paulo.*Brasil/ }).click();
    await expect(page.getByRole('heading', { name: 'São Paulo', level: 1 })).toBeVisible();
    await expect(page.getByRole('region', { name: 'São Paulo' }).getByText('24 °C')).toBeVisible();
    await expectForecast(page, 'celsius');
    await expect(page.getByText('Chance de chuva: 80%')).toBeVisible();

    const columns = await page
      .getByRole('region', { name: 'Previsão diária' })
      .locator('ul')
      .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(viewport.columns);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    const backgroundLoaded = await page.evaluate(async () => {
      const element = document.querySelector('.app-shell');
      if (!element) return false;
      const background = getComputedStyle(element).backgroundImage;
      const url = background.match(/url\("?([^")]+)"?\)/)?.[1];
      if (!url) return false;
      const image = new Image();
      image.src = url;
      await image.decode();
      return image.naturalWidth > 0 && image.naturalHeight > 0;
    });
    expect(backgroundLoaded).toBe(true);

    await search.fill('rio');
    await search.press('Enter');
    const result = page.getByRole('button', { name: /Rio de Janeiro.*Brasil/ });
    await result.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Rio de Janeiro', level: 1 })).toBeVisible();
    await page.getByRole('radio', { name: 'Celsius' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('radio', { name: 'Fahrenheit' })).toBeChecked();
    await expect(
      page.getByRole('region', { name: 'Rio de Janeiro' }).getByText('75 °F'),
    ).toBeVisible();
    await expect(page.getByRole('article').getByText(/°C/)).toHaveCount(0);
    await expectForecast(page, 'fahrenheit');
    await selectUnit(page, 'celsius');
    await expect(
      page.getByRole('region', { name: 'Rio de Janeiro' }).getByText('24 °C'),
    ).toBeVisible();
    await expect(page.getByRole('main')).not.toContainText('°F');
    await expectForecast(page, 'celsius');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await search.fill('cidade inexistente');
    await search.press('Enter');
    await expect(page.getByRole('status')).toContainText('Nenhuma cidade encontrada');
    await expect(page.getByRole('heading', { name: 'Rio de Janeiro', level: 1 })).toBeVisible();
    expect(apiRequests).toHaveLength(5);
    await search.clear();
    await page.screenshot({
      path: testInfo.outputPath(`weather-${viewport.width}.png`),
      fullPage: true,
    });
  });
}

test('falha de previsao permite retry sem perder a cidade', async ({ page }) => {
  let attempts = 0;
  await page.route('https://api.open-meteo.com/v1/forecast?**', async (route) => {
    attempts += 1;
    if (attempts === 1) await route.abort('failed');
    else await route.fulfill({ json: forecastResponse });
  });
  await page.goto('/');
  await page.getByRole('searchbox').fill('sao');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page.getByRole('button', { name: /São Paulo.*Brasil/ }).click();
  await expect(page.getByRole('alert')).toContainText('Não foi possível conectar');
  await expect(page.getByRole('heading', { name: 'São Paulo', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Tentar consultar o tempo novamente' }).click();
  await expect(page.getByRole('article')).toHaveCount(5);
  expect(attempts).toBe(2);
});

test('timeout encerra loading e permite nova tentativa', async ({ page }) => {
  let attempts = 0;
  await page.route('https://api.open-meteo.com/v1/forecast?**', async (route) => {
    attempts += 1;
    if (attempts > 1) await route.fulfill({ json: forecastResponse });
  });
  await page.goto('/');
  await page.getByRole('searchbox').fill('sao');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page.getByRole('button', { name: /São Paulo.*Brasil/ }).click();
  await expect(page.getByRole('status')).toContainText('Carregando dados');
  await page.clock.fastForward(10_000);
  await expect(page.getByRole('alert')).toContainText('10 segundos');
  await expect(page.getByRole('heading', { name: 'São Paulo', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Tentar consultar o tempo novamente' }).click();
  await expect(page.getByRole('article')).toHaveCount(5);
});

test('busca vazia orienta sem consultar a API e permite corrigir o nome', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('open-meteo.com')) requests.push(request.url());
  });
  await page.goto('/');
  const search = page.getByRole('searchbox', { name: 'Buscar cidade' });
  await expect(page.getByRole('status')).toContainText('Nenhuma cidade selecionada');
  for (const query of ['', '   ']) {
    await search.fill(query);
    await search.press('Enter');
    await expect(page.getByRole('alert')).toContainText('Informe o nome de uma cidade');
    await expect(search).toHaveAttribute('aria-invalid', 'true');
  }
  expect(requests).toEqual([]);
  await selectCity(page, ' São Paulo ');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(search).toHaveAttribute('aria-invalid', 'false');
  await expectForecast(page, 'celsius');
});

test('desambigua cidades homonimas e usa as coordenadas da escolhida', async ({ page }) => {
  await page.route('https://geocoding-api.open-meteo.com/v1/search?**', (route) =>
    route.fulfill({
      json: {
        results: [
          { ...geocodingResponse.results[0], name: 'Santa Maria', admin1: 'Rio Grande do Sul' },
          {
            ...geocodingResponse.results[1],
            name: 'Santa Maria',
            admin1: 'Califórnia',
            country: 'Estados Unidos',
            latitude: 34.95,
            longitude: -120.44,
          },
        ],
      },
    }),
  );
  await page.goto('/');
  await page.getByRole('searchbox').fill('Santa Maria');
  await page.getByRole('searchbox').press('Enter');
  await expect(
    page.getByRole('button', { name: /Santa Maria.*Rio Grande do Sul.*Brasil/ }),
  ).toBeVisible();
  const request = page.waitForRequest('https://api.open-meteo.com/v1/forecast?**');
  await page.getByRole('button', { name: /Santa Maria.*Califórnia.*Estados Unidos/ }).click();
  const url = new URL((await request).url());
  expect(url.searchParams.get('latitude')).toBe('34.95');
  expect(url.searchParams.get('longitude')).toBe('-120.44');
  await expect(page.getByRole('heading', { name: 'Santa Maria', level: 1 })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Santa Maria' })).toContainText(
    'Califórnia · Estados Unidos',
  );
  await expectForecast(page, 'celsius');
});

for (const failure of ['network', 'http', 'timeout'] as const) {
  test(`falha de geocoding (${failure}) preserva dados e repete a busca original`, async ({
    page,
  }) => {
    await page.goto('/');
    await selectCity(page);
    await expectForecast(page, 'celsius');
    const queries: (string | null)[] = [];
    await page.route('https://geocoding-api.open-meteo.com/v1/search?**', async (route) => {
      queries.push(new URL(route.request().url()).searchParams.get('name'));
      if (queries.length > 1)
        await route.fulfill({ json: { results: [geocodingResponse.results[1]] } });
      else if (failure === 'network') await route.abort('failed');
      else if (failure === 'http') await route.fulfill({ status: 503, json: { error: true } });
    });
    const search = page.getByRole('searchbox');
    await search.fill('rio');
    await search.press('Enter');
    if (failure === 'timeout') {
      await expect(page.getByRole('status')).toContainText('Buscando cidades');
      await page.clock.fastForward(10_000);
    }
    await expect(page.getByRole('alert')).toContainText(
      failure === 'timeout'
        ? '10 segundos'
        : failure === 'http'
          ? 'indisponível'
          : 'Não foi possível conectar',
    );
    await expect(page.getByRole('heading', { name: 'São Paulo', level: 1 })).toBeVisible();
    await expect(page.getByRole('region', { name: 'São Paulo' }).getByText('24 °C')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Buscar', exact: true })).toBeEnabled();
    await search.fill('texto editado');
    await page.getByRole('button', { name: 'Tentar buscar novamente' }).click();
    await expect(page.getByRole('button', { name: /Rio de Janeiro.*Brasil/ })).toBeVisible();
    expect(queries).toEqual(['rio', 'rio']);
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
}

test('busca sem correspondencias permite uma nova busca', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox').fill('cidade inexistente');
  await page.getByRole('searchbox').press('Enter');
  await expect(page.getByText('Nenhuma cidade encontrada.', { exact: true })).toBeVisible();
  await selectCity(page, 'rio', /Rio de Janeiro.*Brasil/);
  await expect(page.getByRole('heading', { name: 'Rio de Janeiro', level: 1 })).toBeVisible();
  await expectForecast(page, 'celsius');
});

test('carregamento nao mostra dados antigos e respeita unidade alterada durante a consulta', async ({
  page,
}) => {
  await page.goto('/');
  await selectCity(page);
  await expectForecast(page, 'celsius');
  const pending = deferred<void>();
  let requests = 0;
  await page.route('https://api.open-meteo.com/v1/forecast?**', async (route) => {
    requests += 1;
    await pending.promise;
    await route.fulfill({ json: forecastResponse });
  });
  try {
    await selectCity(page, 'rio', /Rio de Janeiro.*Brasil/);
    await expect(page.getByRole('status')).toContainText('Carregando dados');
    await expect(page.getByRole('heading', { name: 'Rio de Janeiro', level: 1 })).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(0);
    await expect(page.getByRole('main')).not.toContainText('24 °C');
    await selectUnit(page, 'fahrenheit');
  } finally {
    pending.resolve();
  }
  await expect(
    page.getByRole('region', { name: 'Rio de Janeiro' }).getByText('75 °F'),
  ).toBeVisible();
  await expectForecast(page, 'fahrenheit');
  await expect(page.getByRole('main')).not.toContainText('°C');
  expect(requests).toBe(1);
});

for (const section of ['current', 'daily'] as const) {
  test(`ausencia de ${section} mantem a outra secao independente`, async ({ page }) => {
    await page.route('https://api.open-meteo.com/v1/forecast?**', (route) =>
      route.fulfill({ json: { ...forecastResponse, [section]: null } }),
    );
    await page.goto('/');
    await selectCity(page);
    await expect(page.getByRole('heading', { name: 'São Paulo', level: 1 })).toBeVisible();
    await expect(page.getByRole('status')).toContainText(
      section === 'current' ? 'Clima atual indisponível' : 'Previsão diária indisponível',
    );
    if (section === 'current') await expectForecast(page, 'celsius');
    else {
      await expect(
        page.getByRole('region', { name: 'São Paulo' }).getByText('24 °C'),
      ).toBeVisible();
      await expect(page.getByRole('article')).toHaveCount(0);
    }
  });
}

test('dados parciais e codigo desconhecido nao apagam dias nem outras metricas', async ({
  page,
}) => {
  await page.route('https://api.open-meteo.com/v1/forecast?**', (route) =>
    route.fulfill({
      json: {
        ...forecastResponse,
        current: { ...forecastResponse.current, temperature_2m: null, weather_code: 999 },
        daily: { ...forecastResponse.daily, temperature_2m_min: [null, 19, 20, 17, 18] },
      },
    }),
  );
  await page.goto('/');
  await selectCity(page);
  const current = page.getByRole('region', { name: 'São Paulo' });
  await expect(current.getByText('—', { exact: true })).toBeVisible();
  await expect(current.getByText('Condição indisponível')).toBeVisible();
  await expect(current.getByRole('definition').filter({ hasText: '64%' })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(5);
  const firstDay = page.getByRole('article', { name: 'Previsão de qui., 05/11' });
  await expect(firstDay.getByText('—', { exact: true })).toBeVisible();
  await expect(firstDay.getByText('27 °C', { exact: true })).toBeVisible();
  await selectUnit(page, 'fahrenheit');
  await expect(current.getByText('—', { exact: true })).toBeVisible();
  await expect(firstDay.getByText('—', { exact: true })).toBeVisible();
  await expect(firstDay.getByText('81 °F', { exact: true })).toBeVisible();
  await expect(page.getByRole('main')).not.toContainText('°C');
});

test('fluxo essencial funciona somente com teclado', async ({ page }) => {
  await page.route('https://geocoding-api.open-meteo.com/v1/search?**', (route) =>
    route.fulfill({ json: geocodingResponse }),
  );
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Ir para o conteúdo' })).toBeFocused();
  await expect(page.getByRole('link', { name: 'Ir para o conteúdo' })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('searchbox', { name: 'Buscar cidade' })).toBeFocused();
  await page.keyboard.type('cidade');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: /Rio de Janeiro.*Brasil/ })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Buscar', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('radio', { name: 'Celsius' })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'Fahrenheit' })).toBeChecked();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: /São Paulo.*Brasil/ })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: /Rio de Janeiro.*Brasil/ })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Rio de Janeiro', level: 1 })).toBeVisible();
  await expectForecast(page, 'fahrenheit');
});

test('redimensionar entre mobile e desktop preserva cidade, dados e unidade sem nova consulta', async ({
  page,
}) => {
  let requests = 0;
  page.on('request', (request) => {
    if (request.url().includes('open-meteo.com')) requests += 1;
  });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  await selectCity(page);
  await selectUnit(page, 'fahrenheit');
  for (const width of [320, 1440, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(page.getByRole('heading', { name: 'São Paulo', level: 1 })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Fahrenheit' })).toBeChecked();
    await expect(page.getByRole('region', { name: 'São Paulo' }).getByText('75 °F')).toBeVisible();
    await expectForecast(page, 'fahrenheit');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  expect(requests).toBe(2);
});

test('foco e erros simultaneos permanecem operaveis em cada contexto', async ({ page }) => {
  let attempts = 0;
  await page.route('https://api.open-meteo.com/v1/forecast?**', async (route) => {
    attempts += 1;
    if (attempts === 1) await route.fulfill({ status: 503, json: {} });
    else await route.fulfill({ json: forecastResponse });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByRole('searchbox')).toBeFocused();
  await expect(page.getByRole('searchbox')).toHaveAccessibleDescription(
    'Informe o nome de uma cidade.',
  );
  await selectCity(page);
  await expect(page.getByRole('main', { name: 'Tempo em São Paulo' })).toBeFocused();
  await expect(page.getByRole('alert')).toContainText('indisponível');
  let searches = 0;
  await page.route('https://geocoding-api.open-meteo.com/v1/search?**', async (route) => {
    searches += 1;
    if (searches === 1) await route.abort('failed');
    else await route.fulfill({ json: geocodingResponse });
  });
  await page.getByRole('searchbox').fill('rio');
  await page.getByRole('searchbox').press('Enter');
  await expect(page.getByRole('alert')).toHaveCount(2);
  await page.getByRole('button', { name: 'Tentar buscar novamente' }).click();
  await expect(page.getByRole('searchbox')).toBeFocused();
  await expect(page.getByRole('alert')).toHaveCount(1);
  await page.getByRole('button', { name: 'Tentar consultar o tempo novamente' }).click();
  await expect(page.getByRole('main')).toBeFocused();
  await expectForecast(page, 'celsius');
  await expect(page.getByRole('main')).toBeFocused();
});

test('editar busca pendente libera novo envio sem esperar timeout', async ({ page }) => {
  await page.goto('/');
  await selectCity(page);
  await expectForecast(page, 'celsius');
  let attempts = 0;
  await page.route('https://geocoding-api.open-meteo.com/v1/search?**', async (route) => {
    attempts += 1;
    if (attempts > 1) await route.fulfill({ json: { results: [geocodingResponse.results[1]] } });
  });
  const search = page.getByRole('searchbox');
  await search.fill('sao');
  await search.press('Enter');
  await expect(page.getByRole('status')).toContainText('Buscando cidades');
  await expect(page.getByRole('status')).toHaveAttribute('aria-atomic', 'true');
  await expect(page.getByRole('button', { name: 'Buscar', exact: true })).toBeDisabled();
  await search.fill('rio');
  await expect(page.getByRole('button', { name: 'Buscar', exact: true })).toBeEnabled();
  await expect(page.getByRole('status')).toHaveCount(0);
  await search.press('Enter');
  await expect(page.getByRole('button', { name: /Rio de Janeiro.*Brasil/ })).toBeVisible();
  await expect(page.getByRole('region', { name: 'São Paulo' }).getByText('24 °C')).toBeVisible();
  expect(attempts).toBe(2);
});

test('JSON malformado permite retry e resposta inconsistente preserva campos validos', async ({
  page,
}) => {
  let attempts = 0;
  await page.route('https://api.open-meteo.com/v1/forecast?**', async (route) => {
    attempts += 1;
    if (attempts === 1)
      await route.fulfill({ contentType: 'application/json', body: '{"current":' });
    else
      await route.fulfill({
        json: {
          ...forecastResponse,
          current: {
            ...forecastResponse.current,
            time: '2026-02-31T14:30',
            relative_humidity_2m: 101,
          },
          daily: {
            ...forecastResponse.daily,
            time: ['2026-02-31', '2026-11-06', '2026-11-06', '2026-11-08', '2026-11-09'],
            temperature_2m_min: [18, 40, 20, 17, 18],
          },
        },
      });
  });
  await page.goto('/');
  await selectCity(page);
  await expect(page.getByRole('alert')).toContainText('dados inválidos');
  await page.getByRole('button', { name: 'Tentar consultar o tempo novamente' }).click();
  const current = page.getByRole('region', { name: 'São Paulo' });
  await expect(current.getByText('24 °C')).toBeVisible();
  await expect(current.getByText('Horário indisponível')).toBeVisible();
  await expect(current.getByRole('definition').filter({ hasText: '—' })).toHaveCount(1);
  await expect(page.getByRole('article')).toHaveCount(3);
  const inverted = page.getByRole('article', { name: 'Previsão de sex., 06/11' });
  await expect(inverted.getByRole('definition')).toHaveText(['—', '—']);
  await expect(inverted.getByText('Céu limpo', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('article', { name: 'Previsão de dom., 08/11' }).getByText('23 °C'),
  ).toBeVisible();
});

test('interface inicial utilizavel em ate 2 segundos mesmo com fonte pendente', async ({
  page,
}, testInfo) => {
  const font = deferred<void>();
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.route('**/*.woff2', async (route) => {
    await font.promise;
    await route.continue();
  });
  const started = Date.now();
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('searchbox', { name: 'Buscar cidade' })).toBeVisible({
      timeout: 2_000,
    });
    await expect(page.getByRole('button', { name: 'Buscar', exact: true })).toBeEnabled();
    const elapsed = Date.now() - started;
    testInfo.annotations.push({ type: 'initial-ui-local-ms', description: String(elapsed) });
    expect(elapsed).toBeLessThanOrEqual(2_000);
    await page.getByRole('searchbox').press('Enter');
    await expect(page.getByRole('alert')).toContainText('Informe o nome');
    expect(requests.some((url) => /fonts\.googleapis\.com|fonts\.gstatic\.com/.test(url))).toBe(
      false,
    );
  } finally {
    font.resolve();
  }
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(() =>
      Array.from(document.fonts).some(
        (fontFace) => fontFace.family === 'Inter' && fontFace.status === 'loaded',
      ),
    ),
  ).toBe(true);
});

async function contrast(locator: Locator, property = 'color', pseudo?: string): Promise<number> {
  const appearance = await locator.evaluate(
    (element, options) => {
      const foreground = getComputedStyle(element, options.pseudo).getPropertyValue(
        options.property,
      );
      const backgrounds: string[] = [];
      let ancestor: Element | null = element;
      while (ancestor && !ancestor.classList.contains('app-shell')) {
        backgrounds.unshift(getComputedStyle(ancestor).backgroundColor);
        ancestor = ancestor.parentElement;
      }
      if (!ancestor) throw new Error('Elemento fora do fundo da aplicação.');
      const gradient = getComputedStyle(ancestor).backgroundImage.match(/rgba?\([^)]+\)/g);
      if (!gradient?.length) throw new Error('Fundo sem gradiente para calcular contraste.');
      return { foreground, backgrounds, gradient };
    },
    { property, pseudo },
  );
  const parse = (value: string) => {
    const channels = value.match(/[\d.]+/g)?.map(Number);
    if (!channels || channels.length < 3) throw new Error(`Cor não suportada: ${value}`);
    return [channels[0], channels[1], channels[2], channels[3] ?? 1];
  };
  const blend = (foreground: number[], background: number[]) =>
    background.map(
      (channel, index) => foreground[index] * foreground[3] + channel * (1 - foreground[3]),
    );
  const luminance = (color: number[]) =>
    color.reduce((sum, value, index) => {
      const channel = value / 255;
      const linear = channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      return sum + linear * [0.2126, 0.7152, 0.0722][index];
    }, 0);
  // Imagem branca e o ponto mais claro do gradiente dão o pior fundo permitido.
  const lightest = appearance.gradient
    .map(parse)
    .sort((a, b) => luminance(blend(b, [255, 255, 255])) - luminance(blend(a, [255, 255, 255])))[0];
  const background = appearance.backgrounds
    .map(parse)
    .reduce(
      (background, foreground) => blend(foreground, background),
      blend(lightest, [255, 255, 255]),
    );
  const foreground = blend(parse(appearance.foreground), background);
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test('contraste de textos e controles atende limites AA no pior fundo permitido', async ({
  page,
}) => {
  await page.goto('/');
  const search = page.getByRole('searchbox');
  expect(await contrast(search, 'color', '::placeholder')).toBeGreaterThanOrEqual(4.5);
  expect(await contrast(search.locator('..'), 'border-top-color')).toBeGreaterThanOrEqual(3);
  const group = page.getByRole('group', { name: 'Unidade de temperatura' });
  expect(await contrast(group, 'border-top-color')).toBeGreaterThanOrEqual(3);
  for (const unit of ['°C', '°F'])
    expect(await contrast(group.getByText(unit, { exact: true }))).toBeGreaterThanOrEqual(4.5);
  await search.fill('sao');
  await search.press('Enter');
  const result = page.getByRole('button', { name: /São Paulo.*Brasil/ });
  expect(await contrast(result, 'border-top-color')).toBeGreaterThanOrEqual(3);
  expect(await contrast(result.getByText('São Paulo, Brasil'))).toBeGreaterThanOrEqual(4.5);
  await result.click();
  await expectForecast(page, 'celsius');
  for (const label of ['Parcialmente nublado', '5 dias', 'Dados meteorológicos por Open-Meteo'])
    expect(await contrast(page.getByText(label, { exact: true }).first())).toBeGreaterThanOrEqual(
      4.5,
    );
  await search.focus();
  const focus = await search
    .locator('..')
    .evaluate((element) => getComputedStyle(element).borderColor);
  expect(focus).toBe('rgb(103, 232, 249)');
});

test('movimento reduzido desativa animacoes e controles mantem alvo de toque', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  let requests = 0;
  await page.route('https://api.open-meteo.com/v1/forecast?**', async () => {
    requests += 1;
  });
  await selectCity(page);
  await expect(page.getByRole('status')).toContainText('Carregando dados');
  expect(
    await page.getByRole('main').evaluate((element) => getComputedStyle(element).animationName),
  ).toBe('none');
  expect(
    await page
      .getByRole('status')
      .locator('svg')
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe('none');
  for (const name of ['Celsius', 'Fahrenheit']) {
    const bounds = await page.getByRole('radio', { name }).boundingBox();
    if (!bounds) throw new Error(`Controle ${name} sem limites visiveis.`);
    expect(bounds.width).toBeGreaterThanOrEqual(44);
    expect(bounds.height).toBeGreaterThanOrEqual(44);
  }
  await selectUnit(page, 'fahrenheit');
  await page.clock.fastForward(10_000);
  await expect(page.getByRole('alert')).toContainText('10 segundos');
  expect(requests).toBe(1);
});

test('nomes geograficos longos nao causam rolagem horizontal em 320px', async ({ page }) => {
  const name = 'Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch';
  await page.setViewportSize({ width: 320, height: 800 });
  await page.route('https://geocoding-api.open-meteo.com/v1/search?**', (route) =>
    route.fulfill({ json: { results: [{ ...geocodingResponse.results[0], name, admin1: name }] } }),
  );
  await page.goto('/');
  await page.getByRole('searchbox').fill(name);
  await page.getByRole('searchbox').press('Enter');
  await expect(page.getByRole('button', { name: `${name}, ${name}, Brasil` })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: `${name}, ${name}, Brasil` }).click();
  await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();
  await expectForecast(page, 'celsius');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
