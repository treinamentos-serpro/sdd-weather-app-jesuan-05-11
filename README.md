<div align="center">

# SDD Weather App

### Treinamento hands-on de **Spec-Driven Development** com **GitHub Copilot**

**Brief → Spec → Plan → Tasks → Code → Test → Review → Ship**

</div>

---

Este repositório é um **laboratório de treinamento de 8 horas** que ensina a
construir software guiado por especificação (**Spec-Driven Development**) usando
o **GitHub Copilot** em todas as etapas. O projeto final é um **Weather App** em
React + TypeScript que consome a API Open-Meteo.

> ## Princípio central
> **NÃO COMECE PELO CÓDIGO.** Sempre: **Spec → Plan → Tasks → Code.**

---

## O workshop

Comece pelo **[Guia do Workshop](workshop/GUIDE.md)** e siga os módulos em ordem.

| # | Módulo | Fase | Duração |
| --- | --- | --- | --- |
| 01 | [Setup](workshop/module-01-setup/README.md) | Preparação | 30 min |
| 02 | [Understanding the Problem](workshop/module-02-discovery/README.md) | Discovery | 45 min |
| 03 | [Writing the Specification](workshop/module-03-spec/README.md) | Spec | 50 min |
| 04 | [Creating the Technical Plan](workshop/module-04-plan/README.md) | Plan | 45 min |
| 05 | [Breaking Down Tasks](workshop/module-05-tasks/README.md) | Tasks | 40 min |
| 06 | [Building the UI](workshop/module-06-ui/README.md) | Code | 60 min |
| 07 | [Integrating APIs](workshop/module-07-api/README.md) | Code | 60 min |
| 08 | [Testing](workshop/module-08-testing/README.md) | Test | 55 min |
| 09 | [Hardening](workshop/module-09-hardening/README.md) | Test | 50 min |
| 10 | [Pull Request Review](workshop/module-10-review/README.md) | Review | 45 min |
| 11 | [Delivery (GitHub Pages)](workshop/module-11-delivery/README.md) | Ship | 30 min |

Cada módulo tem **README.md**, **challenge.md**, **prompts.md** e
**solution.md**.

---

## Começando

### Pré-requisitos

- **Node.js**
- **pnpm** (único gerenciador de pacotes suportado — habilite com `corepack enable`)
- **GitHub Copilot** habilitado no VS Code
- Git e uma conta no GitHub (para PR e deploy)

> O repositório inclui um **DevContainer** com tudo pré-configurado. Abra em um
> Codespace ou em "Reopen in Container" e pule a instalação manual.

### Instalação

```bash
pnpm install
pnpm exec playwright install   # navegadores para os testes E2E
```

### Scripts

```bash
pnpm dev             # servidor de desenvolvimento (Vite)
pnpm build           # build de produção
pnpm preview         # serve o build localmente
pnpm lint            # Biome (lint)
pnpm format          # Biome (formatação)
pnpm check           # Biome (lint + formatação)
pnpm test            # testes unitários (Vitest)
pnpm test:coverage   # cobertura
pnpm test:e2e        # testes E2E (Playwright)
```

### Cobertura dos critérios de aceite

A suíte deriva da [spec](specs/weather-app-spec.md) e das
[tarefas](tasks/weather-app-tasks.md). Os unitários usam mocks de service ou
`fetch`; o setup bloqueia chamadas de rede não configuradas. Os E2E interceptam
Open-Meteo com `page.route`, bloqueiam endpoints sem mock e fixam o relógio em
05/11/2026, alinhado às cinco datas consecutivas das fixtures.

| Critérios / tarefas | Verificação automatizada |
| --- | --- |
| RF1; T-10, T-24 | [Service](tests/unit/services/weatherService.test.ts), [busca](tests/unit/components/SearchBar.test.tsx) e [resultados](tests/unit/components/CityResults.test.tsx): espaços, acentos/caracteres especiais, contexto geográfico, homônimos e coordenadas selecionadas. |
| RF2–RF3; T-05, T-07, T-25 | [Códigos WMO](tests/unit/lib/weatherCodes.test.ts), [datas civis em fusos distintos](tests/unit/lib/format.test.ts) e [componentes meteorológicos](tests/unit/components/WeatherComponents.test.tsx): campos/unidades, dados parciais e fallback. |
| RF4; T-03, T-25 | [Temperaturas](tests/unit/lib/temperature.test.ts), [controle de unidade](tests/unit/components/UnitToggle.test.tsx) e [App](tests/unit/App.test.tsx): valores de referência, mínima/máxima nas duas escalas, teclado e troca sem nova requisição. |
| RF6; T-12, T-14 | [Service](tests/unit/services/weatherService.test.ts) e [hook](tests/unit/hooks/useWeather.test.ts): timeout no limite de 10 segundos, HTTP/rede, retry, cancelamento e respostas fora de ordem. |
| RF1–RF6; T-27, T-28 | [E2E](tests/e2e/weather-app.spec.ts): fluxo completo, vazio/erro/retry, homônimos, dados ausentes, mudança de unidade durante loading, teclado e resize sem perda de estado. |

Playwright executa os casos em Chromium desktop e WebKit com emulação de iPhone
13; o fluxo responsivo verifica 320, 768 e 1440 px, incluindo ausência de rolagem
horizontal. Para instalar navegadores e bibliotecas do sistema em Linux:

```bash
pnpm exec playwright install --with-deps chromium webkit
pnpm test:e2e --workers=1   # útil em ambientes com pouca memória
```

Os testes incluem limites de contraste AA (4,5:1 para os textos verificados e
3:1 para limites de controles), foco, redução de movimento e interface
utilizável em até 2 segundos mesmo com a fonte pendente. Não substituem uma
auditoria WCAG completa com leitores de tela, medição sob conexão típica,
nem a validação em Edge, Firefox e dispositivos físicos.

### Hardening para produção

- **Teclado e foco:** busca vazia devolve foco ao campo; seleção/retry do tempo
  focam o conteúdo persistente; respostas não roubam o foco. Retry da busca
  retorna ao campo, e ações de busca/previsão têm nomes distintos.
- **Estados e resiliência:** status/alertas anunciam a mensagem completa;
  timeout de 10 segundos e retry preservam a cidade. Editar busca pendente
  cancela a resposta antiga e libera novo envio sem cancelar a previsão.
- **Dados inconsistentes:** JSON malformado é erro de resposta, inclusive no
  WebKit. Datas impossíveis/duplicadas não produzem cartões enganosos;
  percentuais fora de 0–100, métricas negativas e extremos invertidos aparecem
  como “—”, mantendo os demais campos válidos.
- **Performance e UX:** `Intl` reutilizado, fundo sem attachment fixo no mobile,
  fonte Inter variável latin servida localmente com `font-display: swap`
  (48,25 kB no build), sem folha bloqueante do Google Fonts. Controles de
  unidade têm alvo de toque de pelo menos 44 × 44 px; nomes geográficos longos
  não provocam rolagem horizontal em 320 px.

Validação local do hardening: **161 unitários**, **48 E2E** (Chromium e
WebKit/mobile), **100% de linhas** e **96,99% de branches**. `pnpm lint`,
`pnpm build`, `pnpm test` e `pnpm test:coverage` aprovados; E2E completo
aprovado com `pnpm test:e2e --reporter=list,json`. No teste com a fonte
deliberadamente pendente, controles iniciais disponíveis em **435 ms** no
Chromium e **475 ms** no WebKit/mobile, medidos contra o servidor local Vite;
esses valores não representam desempenho em rede real.

---

## Arquitetura do app

```text
src/
├── components/      # apresentação (um componente por arquivo)
│   └── states/      # loading, erro, vazio
├── hooks/           # orquestração (useWeather)
├── services/        # acesso a dados (Open-Meteo) isolado
├── lib/             # funções puras (conversão, formatação, códigos WMO)
├── types/           # contratos compartilhados
├── styles/          # Tailwind + estilos globais
├── App.tsx          # composição da tela
└── main.tsx         # bootstrap React
```

Decisões-chave:

- **Temperaturas em Celsius** internamente; conversão só na apresentação (o
  toggle °C/°F **não** faz nova requisição).
- **Rede isolada** em `services/` — componentes e hooks não conhecem URLs.
- Sempre tratar **loading**, **erro** e **vazio**.

---

## Stack

- **TypeScript** (strict) · **React** · **Vite**
- **Tailwind CSS** (tema dark glassmorphism)
- **Vitest** + **Testing Library** (unit) · **Playwright** (E2E)
- **Biome** (lint + formatação)
- **pnpm** (gerenciador de pacotes)
- **Open-Meteo** (geocoding + forecast, sem API key)

---

## Copilot no fluxo SDD

A pasta `.github/` traz a inteligência do laboratório:

- **`agents/`** — personas especializadas: Spec, Plan, Task, Code, Test, Review.
- **`prompts/`** — prompts de produção para cada etapa.
- **`instructions/`** — convenções (React, Tailwind, Testing) aplicadas
  automaticamente.
- **`workflows/`** — CI (lint/build/test/e2e), deploy no Pages e validações que
  **impõem a ordem Spec → Plan → Tasks**.

Veja [AGENTS.md](AGENTS.md) para a descrição de cada agente.

---

## Idioma

- Narrativa, comentários e documentação: **pt-BR**.
- Identificadores de código, nomes de arquivos e termos técnicos: **en-US**.

---

<div align="center">

Construído com ❤️ para capacitar times em **Spec-Driven Development** usando o poder do GitHub Copilot.

</div>
