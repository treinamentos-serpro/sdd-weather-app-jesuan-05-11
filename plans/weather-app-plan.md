# Plano Técnico — Aplicativo de Previsão do Tempo

**Fonte:** [Especificação do produto](../specs/weather-app-spec.md)  
**Escopo:** versão inicial descrita na spec; este documento define arquitetura e contratos, não a implementação.

## 1. Architecture Overview

Aplicação SPA em React, organizada em camadas e com fluxo de dados unidirecional:

```text
Busca / seleção / unidade
            ↓
      App + useWeather ───────────────→ componentes de apresentação
            ↓                                  ↑
      weatherService ──→ Open-Meteo            │
            ↓                                  │
      normalização ──→ tipos de domínio ───────┘
```

- **Apresentação (`src/components/`):** componentes React focados em busca, clima atual, previsão, unidade e estados de interface. Recebem dados e ações por props.
- **Orquestração (`src/hooks/`):** um hook coordena busca, seleção, consulta, unidade, loading, erros e retry.
- **Dados (`src/services/`):** integração HTTP com geocoding e previsão, independente da UI e fácil de simular nos testes.
- **Domínio (`src/lib/`):** funções puras para conversão de temperatura, mapeamento de códigos meteorológicos e formatação.
- **Contratos (`src/types/`):** modelos normalizados usados entre serviços, hook e componentes.

Essa separação atende RF1–RF6 e RNF4: isola falhas externas, permite exibir estados de recuperação e evita acoplar a interface ao formato da API.

## 2. Tech Stack

| Camada | Tecnologia | Justificativa |
| --- | --- | --- |
| Linguagem | TypeScript strict | Contratos explícitos e menos inconsistências nos dados (RNF4, RNF5). |
| Interface | React + Vite | SPA leve, compatível com o projeto e adequada ao fluxo de consulta (RNF3, RNF6). |
| Estilos | Tailwind CSS | Responsividade e tema dark glassmorphism já definidos para o projeto (RF5, RNF1). |
| Testes unitários | Vitest + Testing Library | Testes de funções, serviços e estados acessíveis da UI. |
| Testes E2E | Playwright | Verificação dos fluxos completos em desktop e viewport móvel (RF1–RF6, RNF1, RNF6). |
| Dados | Open-Meteo | Geocoding e previsão sem chave de API, conforme a baseline da spec. |
| Lint e formatação | Biome | Ferramenta configurada no projeto para consistência do código. |

Não é necessária biblioteca adicional de estado: o estado local de um único fluxo de consulta é suficiente.

## 3. Project Structure

```text
src/
├── components/
│   ├── SearchBar.tsx
│   ├── CityResults.tsx
│   ├── CurrentWeather.tsx
│   ├── ForecastList.tsx
│   ├── ForecastDayCard.tsx
│   ├── UnitToggle.tsx
│   └── states/
│       ├── LoadingState.tsx
│       ├── EmptyState.tsx
│       └── ErrorState.tsx
├── hooks/
│   └── useWeather.ts
├── services/
│   └── weatherService.ts
├── lib/
│   ├── temperature.ts
│   ├── weatherCodes.ts
│   └── format.ts
├── types/
│   └── weather.ts
├── App.tsx
└── main.tsx
tests/
├── setup.ts
├── unit/
│   ├── lib/
│   ├── services/
│   └── components/
└── e2e/
```

Cada componente tem responsabilidade visual única; `weatherService` concentra as requisições e a transformação das respostas externas para os tipos de domínio. A estrutura de testes corresponde aos diretórios já configurados para Vitest e Playwright.

## 4. Data Model

Os tipos abaixo são contratos de domínio normalizados, não espelham diretamente o JSON da API. Campos meteorológicos que a fonte não fornecer são `null`; isso permite indicar indisponibilidade sem ocultar os demais dados.

```ts
export type TemperatureUnit = 'celsius' | 'fahrenheit';

export interface City {
  name: string;
  country: string;
  countryCode: string | null;
  region: string | null;
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  observedAt: string;
  temperatureC: number | null;
  weatherCode: number | null;
  humidityPercent: number | null;
  windSpeedKmh: number | null;
  pressureHpa: number | null;
  precipitationMm: number | null;
}

export interface ForecastDay {
  date: string;
  minTemperatureC: number | null;
  maxTemperatureC: number | null;
  weatherCode: number | null;
  precipitationMm: number | null;
  precipitationProbabilityPercent?: number | null;
}

export interface WeatherData {
  current: CurrentWeather | null;
  forecast: ForecastDay[] | null;
}
```

- `forecast` contém exatamente cinco dias consecutivos quando a previsão diária está disponível; é `null` se nenhum dia estiver disponível. Campos ausentes em dias retornados são `null`.
- `current` e `forecast` podem estar indisponíveis independentemente: a falha ou ausência de uma seção não deve apagar a outra.
- A unidade interna de temperatura é sempre Celsius. A conversão para Fahrenheit ocorre na apresentação, usando o valor não arredondado e arredondando somente o resultado exibido ao grau inteiro mais próximo (RF4).
- A cidade é identificada no estado pela combinação das coordenadas e dos dados geográficos retornados; não se presume um identificador numérico obrigatório do provedor.

## 5. Data Flow

1. A pessoa informa um nome. A busca vazia ou composta somente por espaços é validada na UI e não chama o serviço.
2. `useWeather` inicia a busca e atualiza o estado de loading; `weatherService` envia a consulta de geocoding e normaliza os resultados.
3. A UI apresenta nome e contexto geográfico disponível para cada resultado. Uma resposta sem resultados produz estado vazio, sem substituir a cidade selecionada.
4. Ao selecionar uma cidade, o hook preserva a seleção, inicia a consulta por latitude e longitude e limpa os dados associados à seleção anterior para evitar exibi-los como pertencentes à nova cidade.
5. O serviço normaliza os dados atuais e as séries diárias da previsão, alinhando cada data aos valores correspondentes e tratando campos ausentes individualmente.
6. O hook publica sucesso parcial ou completo; os componentes exibem clima e previsão disponíveis. Em falha, preserva a cidade e oferece retry para ela.
7. A troca de unidade atualiza somente a apresentação das temperaturas atual e previstas; não dispara nova consulta nem altera precipitação, vento ou pressão.
8. Requisições substituídas por uma busca ou seleção mais recente são canceladas ou ignoradas para que respostas antigas não sobrescrevam o estado atual.

## 6. External APIs

### Geocoding

```http
GET https://geocoding-api.open-meteo.com/v1/search
  ?name={query}
  &count=5
  &language=pt
  &format=json
```

`query` deve ser codificada como parâmetro URL. O serviço mapeia `results[]` para `City[]`, usando nome, país, código do país, região (quando disponível) e coordenadas. Ausência ou lista vazia de resultados é um resultado vazio; falhas HTTP, de rede ou timeout são erros recuperáveis.

### Previsão atual e diária

```http
GET https://api.open-meteo.com/v1/forecast
  ?latitude={latitude}
  &longitude={longitude}
  &current=temperature_2m,relative_humidity_2m,wind_speed_10m,surface_pressure,precipitation,weather_code
  &daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum
  &temperature_unit=celsius
  &wind_speed_unit=kmh
  &precipitation_unit=mm
  &forecast_days=5
  &timezone=auto
```

- `current` é normalizado para `CurrentWeather`; `daily` contém arrays paralelos, combinados por índice em até cinco `ForecastDay`.
- `precipitation_sum` representa o total previsto por dia em mm, conforme RNF5; não deve ser confundido com probabilidade de precipitação.
- A integração solicitada também consulta `precipitation_probability_max`, exibida separadamente como chance de chuva em %. O campo normalizado `precipitationProbabilityPercent` é opcional para compatibilidade com consumidores anteriores; o serviço sempre o preenche com número ou `null`.
- `weather_code` segue os códigos WMO da fonte e é convertido por `weatherCodes.ts` em rótulos e ícones adequados à interface em pt-BR.
- Os campos de unidades retornados pela API devem ser conferidos ao normalizar os dados. Valores inesperados ou ausentes não devem ser rotulados silenciosamente como outra unidade.

## 7. State Management

Estado local centralizado em `useWeather`, consumido por `App` e repassado aos componentes. Não persistir cidade nem unidade entre visitas (assumptions da spec).

```ts
type AsyncStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

interface WeatherViewState {
  query: string;
  searchStatus: AsyncStatus;
  searchResults: City[];
  searchError: string | null;
  selectedCity: City | null;
  weatherStatus: 'idle' | 'loading' | 'success' | 'error';
  weather: WeatherData | null;
  weatherError: string | null;
  unit: TemperatureUnit;
}
```

- A unidade inicial é Celsius. A mudança é aplicada imediatamente tanto aos valores carregados quanto aos que chegarem enquanto a consulta estiver em andamento.
- Erros de busca e de previsão têm estados separados para que uma falha não bloqueie o outro fluxo.
- Selecionar uma nova cidade limpa a previsão da cidade anterior. Uma nova tentativa para a cidade já selecionada mantém a seleção.
- Expor ações explícitas para buscar, selecionar cidade, trocar unidade e repetir a consulta; evitar atualização implícita de estado por efeitos colaterais.

## 8. Error Handling Strategy

- **Busca vazia:** não requisitar; orientar a informar um nome.
- **Sem correspondências:** estado vazio que permite outra busca.
- **Carregamento:** mostrar imediatamente após envio, sem apresentar dados novos antes da resposta.
- **Falha de rede, HTTP ou provedor:** mensagem compreensível e ação de retry; manter cidade selecionada em falhas de previsão.
- **Timeout:** limitar busca e previsão a 10 segundos com `AbortController`; encerrar loading, informar timeout e permitir nova tentativa (RNF3).
- **Dados parciais:** representar cada campo indisponível como “—”; manter os demais campos e dias visíveis. Se não houver previsão diária, informar indisponibilidade sem inventar entradas ou valores.
- **Respostas fora de ordem:** cancelar requisições substituídas ou descartar respostas obsoletas.
- Mensagens de loading e resultados devem ser anunciáveis por tecnologia assistiva; erros devem usar semântica de alerta, com foco e navegação por teclado preservados (RNF2).

### Hardening da versão inicial

- Validação vazia devolve foco ao campo; seleção e retry meteorológico direcionam
  foco ao conteúdo persistente, sem tomar o foco novamente quando a resposta chega.
  Retry da busca mantém o foco no campo. Ações de retry identificam seu contexto.
- Editar uma busca pendente cancela a operação obsoleta e libera novo envio; não
  cancela a previsão nem apaga a cidade selecionada.
- JSON malformado é erro de resposta, não de conexão. Datas civis impossíveis,
  duplicadas e métricas incompatíveis com suas unidades não viram dados válidos:
  percentuais fora de 0–100 e volumes/velocidades negativos viram `null`; mínima
  maior que máxima invalida o par, sem apagar os demais campos.
- Reutilizar formatadores `Intl`, manter foco visível, controles com limites
  contrastantes e respeitar movimento reduzido. Verificar contraste e tempo até
  controles utilizáveis por testes de navegador, sem confundir medição local
  com certificação de desempenho em conexão típica.
- Hospedar Inter variável (subset latin) junto ao bundle com `font-display: swap`,
  removendo a folha de estilo externa bloqueante do Google Fonts e mantendo
  fallback de sistema enquanto a fonte carrega.

## 9. Testing Strategy

### Unitários — Vitest e Testing Library

- `temperature.ts`: conversões C↔F, precisão antes do arredondamento e unidade/rotulagem consistente (RF4).
- `weatherCodes.ts` e `format.ts`: códigos conhecidos/desconhecidos e datas inequívocas em pt-BR, sem deslocamento de dia.
- `weatherService`: mock de `fetch` para query codificada, mapeamento de cidade, arrays diários, campos ausentes, respostas vazias, erros HTTP e timeout.
- Componentes e hook: validação de busca vazia, loading, resultados, seleção, estado vazio, falha/retry, cidade preservada, dados parciais e alternância de unidade.
- Acessibilidade de componentes: rótulos, roles, foco e estados de loading/erro anunciáveis.

### E2E — Playwright

- Fluxo completo buscar → distinguir e selecionar cidade → consultar clima e cinco dias → alternar Celsius/Fahrenheit.
- Busca sem resultados, falha de rede/timeout e retry sem perder a cidade selecionada.
- Viewport móvel de 320 px ou mais e viewport desktop; confirmar ausência de rolagem horizontal e controles utilizáveis por teclado (RF5, RNF1, RNF2).
- Interceptar a API com `page.route` para respostas determinísticas, incluindo dados parciais e falhas; executar em Chromium e projeto mobile já configurados.
- Compatibilidade declarada com Chrome, Edge, Firefox e Safari deve ser verificada no processo de validação do produto; os projetos E2E atuais cobrem Chromium e mobile.

## 10. Risks & Trade-offs

| Risco ou decisão | Impacto | Mitigação / trade-off |
| --- | --- | --- |
| Indisponibilidade, latência ou mudanças na Open-Meteo | Dados atuais ou previsão podem falhar ou vir parciais. | Timeout, erros explícitos, normalização tolerante a campos ausentes e retry; manter a cidade selecionada. |
| Cidades homônimas ou geocoding impreciso | Consulta do local errado. | Mostrar região e país disponíveis antes da seleção (RF1). |
| Arrays paralelos ou valores ausentes na resposta diária | Campos podem ser associados incorretamente ou a previsão ficar incompleta. | Normalizar por data/índice, validar a estrutura e representar ausências como `null`; não fabricar dias (RF3). |
| Conversão de unidade ou rótulo incorreto | Usuário interpreta a temperatura incorretamente. | Guardar temperatura em Celsius, converter na apresentação e testar ambos os sentidos com arredondamento (RF4). |
| Sem cache nem persistência | Reconsultas podem repetir requisições; estado é perdido ao sair. | Manter a solução simples: cache, histórico e persistência não pertencem ao escopo inicial. |
| Sem biblioteca global de estado | O hook central concentra o fluxo atual. | Adequado a uma cidade por vez e à interface sem conta; reconsiderar somente se o escopo crescer. |
| Navegadores e larguras diferentes | Conteúdo pode sobrepor ou ficar inacessível. | Layout responsivo, verificações a partir de 320 px e cobertura dos fluxos móveis; validar a matriz de navegadores definida na spec. |
| Formatação de datas no fuso local do dispositivo | Datas retornadas como `YYYY-MM-DD` podem aparecer no dia anterior/seguinte. | Tratar as datas diárias como datas civis, sem conversão implícita do fuso do dispositivo. |
