# Backlog de Tarefas — Aplicativo de Previsão do Tempo

**Fonte:** [Plano técnico](../plans/weather-app-plan.md) e [especificação do produto](../specs/weather-app-spec.md).

As tarefas estão agrupadas por entrega e ordenadas pelas dependências. Prioridade **P0** indica o fluxo essencial da primeira versão; **P1** indica cobertura complementar e hardening. Tamanho relativo: **P** pequeno, **M** médio. Cada tarefa deve ser concluída com seus critérios de aceite verificados.

## Entrega 1 — Contratos e funções de domínio

### T-01 — Definir os tipos normalizados do domínio

- **Tipo:** Data | **Prioridade:** P0 | **Tamanho:** P
- **Descrição:** Criar os tipos `TemperatureUnit`, `City`, `CurrentWeather`, `ForecastDay` e `WeatherData` de acordo com o plano; campos meteorológicos indisponíveis devem admitir `null`.
- **Critérios de aceite:** os tipos compilam em TypeScript strict; temperaturas internas são representadas em Celsius; cidade, clima atual e previsão correspondem aos contratos do plano.
- **Dependências:** nenhuma.
- **Arquivos prováveis:** `src/types/weather.ts`

### T-02 — Implementar conversão e formatação de temperatura

- **Tipo:** Data | **Prioridade:** P0 | **Tamanho:** P
- **Descrição:** Implementar conversão de Celsius para Fahrenheit e formatação conforme a unidade escolhida, arredondando somente o valor exibido.
- **Critérios de aceite:** 0 °C resulta em 32 °F; 100 °C resulta em 212 °F; -40 °C resulta em -40 °F; valores indisponíveis não são convertidos como números.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/temperature.ts`

### T-03 — Testar conversão e formatação de temperatura

- **Tipo:** Test | **Prioridade:** P0 | **Tamanho:** P
- **Descrição:** Cobrir os casos de conversão, arredondamento e exibição da unidade.
- **Critérios de aceite:** testes Vitest cobrem os três valores de referência de T-02, conversão de valores decimais, arredondamento e valor indisponível; todos passam.
- **Dependências:** T-02.
- **Arquivos prováveis:** `tests/unit/lib/temperature.test.ts`

### T-04 — Mapear códigos meteorológicos

- **Tipo:** Data | **Prioridade:** P0 | **Tamanho:** P
- **Descrição:** Converter códigos WMO da Open-Meteo para rótulos em pt-BR e identificadores de ícone apropriados para a interface.
- **Critérios de aceite:** códigos meteorológicos suportados pela fonte têm mapeamento; código desconhecido retorna um rótulo de fallback sem lançar erro.
- **Dependências:** nenhuma.
- **Arquivos prováveis:** `src/lib/weatherCodes.ts`

### T-05 — Testar mapeamento dos códigos meteorológicos

- **Tipo:** Test | **Prioridade:** P0 | **Tamanho:** P
- **Descrição:** Verificar códigos conhecidos e o fallback para códigos não mapeados.
- **Critérios de aceite:** testes Vitest verificam os rótulos e identificadores esperados para códigos representativos e o fallback para código desconhecido.
- **Dependências:** T-04.
- **Arquivos prováveis:** `tests/unit/lib/weatherCodes.test.ts`

### T-06 — Implementar formatação de datas

- **Tipo:** Data | **Prioridade:** P0 | **Tamanho:** P
- **Descrição:** Criar formatação pt-BR para datas civis da previsão, sem deslocamento acidental causado pelo fuso local do dispositivo.
- **Critérios de aceite:** uma data ISO de dia é exibida no dia correto; a formatação não altera a data por conversão implícita de fuso.
- **Dependências:** nenhuma.
- **Arquivos prováveis:** `src/lib/format.ts`

### T-07 — Testar formatação de datas

- **Tipo:** Test | **Prioridade:** P0 | **Tamanho:** P
- **Descrição:** Verificar formatação de datas da previsão em pt-BR e tratamento como data civil.
- **Critérios de aceite:** testes cobrem datas consecutivas, rótulos localizados e datas próximas à mudança de dia em fusos distintos, sem deslocamento.
- **Dependências:** T-06.
- **Arquivos prováveis:** `tests/unit/lib/format.test.ts`

## Entrega 2 — Integração com Open-Meteo

### T-08 — Implementar busca de cidades (geocoding)

- **Tipo:** Data | **Prioridade:** P0 | **Tamanho:** M
- **Descrição:** Implementar `searchCities(name)` usando o endpoint de geocoding, codificando a consulta como parâmetro URL e normalizando resultados para `City`.
- **Critérios de aceite:** nome, país, código do país, região e coordenadas são mapeados quando disponíveis; resposta sem resultados retorna lista vazia; falhas HTTP e de rede são erros recuperáveis; busca vazia não faz requisição.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/services/weatherService.ts`

### T-09 — Implementar consulta de clima atual e previsão

- **Tipo:** Data | **Prioridade:** P0 | **Tamanho:** M
- **Descrição:** Implementar `getWeather(latitude, longitude)` com os parâmetros de unidade, variáveis, cinco dias e fuso automático definidos no plano; normalizar a resposta para `WeatherData`.
- **Critérios de aceite:** clima atual e previsão diária são mapeados para os tipos normalizados; arrays diários são alinhados por data/índice; previsão contém até cinco dias disponíveis; campos ausentes tornam-se `null`; ausência de uma seção não invalida a outra.
- **Detalhe da integração:** consultar também `precipitation_probability_max` e apresentar a probabilidade em %, separada do volume diário `precipitation_sum` em mm.
- **Dependências:** T-01, T-08.
- **Arquivos prováveis:** `src/services/weatherService.ts`

### T-10 — Testar os serviços com respostas determinísticas

- **Tipo:** Test | **Prioridade:** P0 | **Tamanho:** M
- **Descrição:** Testar geocoding e previsão com `fetch` simulado, cobrindo normalização e respostas incompletas.
- **Critérios de aceite:** testes cobrem consulta codificada, cidade sem região, busca sem resultados, clima atual, cinco entradas diárias, arrays parciais, campo ausente, erro HTTP e erro de rede; nenhum teste depende de acesso real à internet.
- **Dependências:** T-08, T-09.
- **Arquivos prováveis:** `tests/unit/services/weatherService.test.ts`

### T-11 — Adicionar timeout às requisições do serviço

- **Tipo:** Data | **Prioridade:** P0 | **Tamanho:** P
- **Descrição:** Limitar as consultas de geocoding e previsão a 10 segundos com `AbortController` e converter o cancelamento por timeout em erro recuperável identificável.
- **Critérios de aceite:** busca e previsão que excedem o limite encerram a espera; a camada consumidora recebe erro tratável; cancelamento não é confundido com resultado vazio.
- **Dependências:** T-08, T-09.
- **Arquivos prováveis:** `src/services/weatherService.ts`

### T-12 — Testar timeout e falhas do serviço

- **Tipo:** Test | **Prioridade:** P0 | **Tamanho:** P
- **Descrição:** Cobrir timeout e cancelamento nas operações de geocoding e previsão.
- **Critérios de aceite:** testes com relógio/fetch simulado confirmam que timeout aborta a requisição e rejeita com erro tratável; cancelamento não produz resultado de sucesso.
- **Dependências:** T-11.
- **Arquivos prováveis:** `tests/unit/services/weatherService.test.ts`

## Entrega 3 — Orquestração do fluxo

### T-13 — Implementar o hook `useWeather`

- **Tipo:** Data | **Prioridade:** P0 | **Tamanho:** M
- **Descrição:** Centralizar estado de busca, resultados, cidade selecionada, dados meteorológicos, unidade, loading, estados vazios, erros e ação de nova tentativa.
- **Critérios de aceite:** o hook expõe ações explícitas de buscar, selecionar cidade, alterar unidade e tentar novamente; estados de busca e previsão são independentes; nova seleção limpa dados da cidade anterior; retry preserva a cidade; unidade inicia em Celsius e não é persistida.
- **Dependências:** T-02, T-08, T-09, T-11.
- **Arquivos prováveis:** `src/hooks/useWeather.ts`

### T-14 — Testar estados e concorrência do hook

- **Tipo:** Test | **Prioridade:** P0 | **Tamanho:** M
- **Descrição:** Testar transições do hook e garantir que respostas de operações antigas não substituam resultados mais recentes.
- **Critérios de aceite:** testes cobrem busca, seleção, loading, vazio, sucesso, erros independentes, retry, unidade alterada durante consulta e resposta fora de ordem; a cidade selecionada permanece após falha de previsão.
- **Dependências:** T-13.
- **Arquivos prováveis:** `tests/unit/hooks/useWeather.test.ts`

## Entrega 4 — Componentes de apresentação

### T-15 — Criar o componente de busca

- **Tipo:** UI | **Prioridade:** P0 | **Tamanho:** P
- **Descrição:** Criar campo de busca acessível que recebe valor e ações por props, permite enviar a consulta e bloqueia texto vazio ou composto apenas por espaços.
- **Critérios de aceite:** campo possui rótulo acessível; envio por teclado funciona; valor vazio não dispara busca; estado de carregamento impede envios duplicados.
- **Dependências:** T-13.
- **Arquivos prováveis:** `src/components/SearchBar.tsx`

### T-16 — Criar a lista de resultados de cidades

- **Tipo:** UI | **Prioridade:** P0 | **Tamanho:** P
- **Descrição:** Exibir resultados de geocoding e permitir seleção de cidade, incluindo contexto geográfico disponível.
- **Critérios de aceite:** cada opção mostra nome e região/país disponíveis; opções são operáveis por teclado; selecionar uma opção chama a ação recebida por props.
- **Dependências:** T-01, T-13.
- **Arquivos prováveis:** `src/components/CityResults.tsx`

### T-17 — Criar o estado visual de carregamento

- **Tipo:** UI | **Prioridade:** P0 | **Tamanho:** P
- **Descrição:** Criar componente para comunicar operações em andamento sem apresentar dados novos como atualizados.
- **Critérios de aceite:** mensagem/indicador tem semântica de status acessível e não altera indevidamente o layout ao aparecer.
- **Dependências:** nenhuma.
- **Arquivos prováveis:** `src/components/states/LoadingState.tsx`

### T-18 — Criar o estado visual vazio

- **Tipo:** UI | **Prioridade:** P0 | **Tamanho:** P
- **Descrição:** Criar componente para busca sem correspondências ou ausência de dados, com texto claro para o contexto.
- **Critérios de aceite:** informa que não houve resultados/dados disponíveis; mantém a possibilidade de iniciar outra busca; possui texto acessível.
- **Dependências:** nenhuma.
- **Arquivos prováveis:** `src/components/states/EmptyState.tsx`

### T-19 — Criar o estado visual de erro e retry

- **Tipo:** UI | **Prioridade:** P0 | **Tamanho:** P
- **Descrição:** Criar componente que apresenta falha de modo compreensível e expõe ação explícita de nova tentativa.
- **Critérios de aceite:** mensagem é anunciada como alerta; botão de retry possui nome acessível e chama a ação recebida por props; foco continua operável por teclado.
- **Dependências:** nenhuma.
- **Arquivos prováveis:** `src/components/states/ErrorState.tsx`

### T-20 — Criar o painel de clima atual

- **Tipo:** UI | **Prioridade:** P0 | **Tamanho:** P
- **Descrição:** Apresentar condições atuais usando tipos de domínio, conversão de temperatura e mapeamento de códigos meteorológicos.
- **Critérios de aceite:** exibe temperatura e unidade, condição, umidade, vento em km/h, pressão em hPa e precipitação em mm; campo `null` aparece como “—”; código desconhecido não quebra a apresentação.
- **Dependências:** T-01, T-02, T-04.
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`

### T-21 — Criar o cartão de um dia da previsão

- **Tipo:** UI | **Prioridade:** P0 | **Tamanho:** P
- **Descrição:** Apresentar uma data, mínima/máxima, condição e precipitação para um único dia.
- **Critérios de aceite:** valores mostram unidade; campos indisponíveis aparecem como “—”; data usa o formatador de data e condição usa o mapeamento de códigos.
- **Dependências:** T-01, T-02, T-04, T-06.
- **Arquivos prováveis:** `src/components/ForecastDayCard.tsx`

### T-22 — Criar a lista de previsão

- **Tipo:** UI | **Prioridade:** P0 | **Tamanho:** P
- **Descrição:** Renderizar os dias retornados em uma composição responsiva, delegando a apresentação diária ao cartão.
- **Critérios de aceite:** renderiza os dias recebidos em ordem; quando há cinco dias disponíveis, mostra os cinco; layout não exige rolagem horizontal da página a partir de 320 px.
- **Dependências:** T-21.
- **Arquivos prováveis:** `src/components/ForecastList.tsx`

### T-23 — Criar o controle de unidade

- **Tipo:** UI | **Prioridade:** P0 | **Tamanho:** P
- **Descrição:** Criar controle acessível para alternar Celsius/Fahrenheit e comunicar a opção selecionada.
- **Critérios de aceite:** ambas as opções são alcançáveis e selecionáveis por teclado; estado atual é anunciado; a ação de mudança é emitida uma vez por seleção.
- **Dependências:** T-02.
- **Arquivos prováveis:** `src/components/UnitToggle.tsx`

### T-24 — Testar busca, resultados e estados visuais

- **Tipo:** Test | **Prioridade:** P0 | **Tamanho:** M
- **Descrição:** Testar interação de busca e seleção, além das mensagens de loading, vazio, erro e retry.
- **Critérios de aceite:** testes de componentes cobrem envio por teclado, busca vazia, resultado com contexto geográfico, seleção, estado vazio, loading e acionamento de retry; verificam rótulos/roles relevantes.
- **Dependências:** T-15, T-16, T-17, T-18, T-19.
- **Arquivos prováveis:** `tests/unit/components/SearchBar.test.tsx`, `tests/unit/components/CityResults.test.tsx`, `tests/unit/components/States.test.tsx`

### T-25 — Testar componentes meteorológicos e unidade

- **Tipo:** Test | **Prioridade:** P0 | **Tamanho:** M
- **Descrição:** Testar apresentação de clima atual, previsão diária, valores ausentes e controle de unidade.
- **Critérios de aceite:** testes verificam todos os campos, unidades, fallback “—”, código desconhecido e seleção de Celsius/Fahrenheit por teclado.
- **Dependências:** T-20, T-21, T-22, T-23.
- **Arquivos prováveis:** `tests/unit/components/CurrentWeather.test.tsx`, `tests/unit/components/Forecast.test.tsx`, `tests/unit/components/UnitToggle.test.tsx`

## Entrega 5 — Composição da aplicação

### T-26 — Integrar o fluxo e o layout no `App`

- **Tipo:** UI | **Prioridade:** P0 | **Tamanho:** M
- **Descrição:** Conectar `useWeather` aos componentes, compor o layout responsivo e apresentar busca, cidade, clima, previsão, unidade e os estados adequados.
- **Critérios de aceite:** a interface permite buscar e selecionar uma cidade, consultar dados, alternar unidade e recuperar falhas; erros de busca não apagam a cidade selecionada; estados e conteúdo seguem a especificação e o tema definido pelo projeto.
- **Dependências:** T-13, T-15, T-16, T-17, T-18, T-19, T-20, T-22, T-23.
- **Arquivos prováveis:** `src/App.tsx`

## Entrega 6 — Testes de ponta a ponta e validação

### T-27 — Testar o fluxo principal com Playwright

- **Tipo:** Test | **Prioridade:** P0 | **Tamanho:** M
- **Descrição:** Criar teste E2E determinístico para busca, seleção, exibição de clima e previsão e alternância de unidade.
- **Critérios de aceite:** teste intercepta Open-Meteo com respostas controladas; verifica cidade, clima atual, cinco dias e temperaturas nas duas unidades; não depende de API externa real.
- **Dependências:** T-26.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`

### T-28 — Testar falhas, teclado e viewport móvel com Playwright

- **Tipo:** Test | **Prioridade:** P1 | **Tamanho:** M
- **Descrição:** Cobrir caminhos alternativos e critérios responsivos/acessíveis no fluxo integrado.
- **Critérios de aceite:** testes verificam busca sem resultados, falha/timeout e retry mantendo a cidade; fluxo principal funciona a partir de 320 px sem rolagem horizontal; controles essenciais podem ser usados por teclado.
- **Dependências:** T-26, T-27.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`

#### Hardening associado a T-17, T-18, T-19 e T-28

- [x] Foco preservado após validação, seleção e retry; nomes contextualizados
  distinguem ações de busca e previsão em erros simultâneos.
- [x] Edição durante busca pendente cancela resposta obsoleta sem apagar a cidade.
- [x] JSON malformado, datas impossíveis/duplicadas e métricas fora de faixa
  tratados explicitamente, preservando campos válidos e estados de indisponibilidade.
- [x] Contraste dos controles/textos e redução de movimento verificados; medição
  local dos controles utilizáveis em até 2 segundos documentada com suas limitações.
- [x] Formatadores reutilizados e regressões verificadas com lint, build,
  unitários e E2E desktop/mobile.

## Rastreabilidade requisito → tarefa

| Requisito | Tarefas relacionadas |
| --- | --- |
| **RF1 — Busca e seleção de cidade** | T-08, T-13, T-15, T-16, T-24, T-26, T-27 |
| **RF2 — Clima atual** | T-09, T-20, T-25, T-26, T-27 |
| **RF3 — Previsão de cinco dias** | T-06, T-09, T-21, T-22, T-25, T-26, T-27 |
| **RF4 — Unidade de temperatura** | T-02, T-03, T-13, T-23, T-25, T-26, T-27 |
| **RF5 — Uso em dispositivos móveis** | T-15, T-16, T-20, T-22, T-23, T-26, T-28 |
| **RF6 — Estados e recuperação** | T-08, T-09, T-11, T-12, T-13, T-14, T-17, T-18, T-19, T-24, T-26, T-28 |

## Sequência sugerida de entrega

1. **Base validada:** T-01 a T-14, incluindo testes de domínio, serviços, timeout e hook.
2. **Componentes de apresentação:** T-15 a T-23, implementando busca, estados, clima atual, previsão e unidade.
3. **Integração validada:** T-24 e T-25 verificam componentes; T-26 compõe a aplicação; T-27 verifica o fluxo principal.
4. **Hardening:** T-28 cobre falhas, retry, teclado e viewport móvel; corrigir qualquer desvio encontrado nos critérios de aceite.