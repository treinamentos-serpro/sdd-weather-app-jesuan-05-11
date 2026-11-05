# Especificação de Produto — Aplicativo de Previsão do Tempo

## Overview

Aplicação web em português do Brasil para consultar o clima de uma cidade. O usuário pesquisa e seleciona uma cidade, vê condições atuais e a previsão diária de cinco dias (hoje e os quatro dias seguintes), e alterna entre Celsius e Fahrenheit. A interface atende dispositivos móveis e desktop. A versão inicial não exige conta e usa Open-Meteo como fonte de geocoding e dados meteorológicos, sem chave de API.

O objetivo principal é permitir que as pessoas tomem decisões cotidianas e planejem os próximos dias com informações meteorológicas claras, atualizadas e associadas à cidade correta.

## Functional Requirements

- **RF1 — Busca e seleção de cidade:** permitir busca por nome e seleção de um resultado. Cada resultado deve exibir nome da cidade e contexto geográfico disponível (estado/região e país) para desambiguar homônimos.
- **RF2 — Clima atual:** para a cidade selecionada, exibir temperatura, condição meteorológica, umidade, velocidade do vento, pressão atmosférica e precipitação atual quando fornecidos pela fonte.
- **RF3 — Previsão de cinco dias:** exibir exatamente cinco entradas diárias, incluindo hoje e os quatro dias seguintes. Cada entrada apresenta data, temperatura mínima e máxima, condição e precipitação prevista.
- **RF4 — Unidade de temperatura:** permitir alternar entre Celsius e Fahrenheit. A unidade escolhida deve ser aplicada à temperatura atual e a todas as temperaturas da previsão, sem misturar escalas na tela.
- **RF5 — Uso em dispositivos móveis:** permitir concluir busca, seleção, consulta e alternância de unidade em telas móveis, sem perda de conteúdo ou funcionalidade em relação à versão desktop.
- **RF6 — Estados e recuperação:** informar carregamento, resultados vazios e falhas de busca/consulta. Em falhas recuperáveis, oferecer uma ação para tentar novamente e preservar a cidade selecionada.

## User Stories

- **US1 — Busca:** Como pessoa viajando para outra cidade, quero buscar e identificar uma cidade pelos seus dados geográficos para consultar o local correto.
- **US2 — Condições atuais:** Como pessoa que decide o que vestir ou levar, quero ver o clima atual da cidade selecionada para me preparar para o dia.
- **US3 — Planejamento:** Como pessoa que organiza a semana, quero consultar a previsão de hoje e dos próximos quatro dias para planejar compromissos e atividades.
- **US4 — Unidade:** Como pessoa que prefere uma escala de temperatura específica, quero alternar entre Celsius e Fahrenheit para interpretar os valores com facilidade.
- **US5 — Uso móvel:** Como pessoa que consulta o tempo pelo celular, quero acessar os mesmos fluxos em uma tela pequena para tomar decisões em qualquer lugar.
- **US6 — Recuperação:** Como pessoa em uma rede instável, quero receber uma explicação e poder tentar novamente quando uma consulta falhar para saber como prosseguir.

## Acceptance Criteria

Os critérios abaixo são normativos e devem ser verificáveis manualmente ou por testes.

### RF1 — Busca e seleção de cidade (US1)

- **Dado** que o campo de busca está vazio, **quando** o usuário envia a busca, **então** nenhuma consulta é iniciada e a interface solicita um nome de cidade.
- **Dado** um nome de cidade não vazio, **quando** o usuário envia a busca, **então** a aplicação apresenta resultados correspondentes com nome e contexto geográfico disponível.
- **Dado** que há mais de uma cidade correspondente, **quando** os resultados são exibidos, **então** o usuário consegue distinguir e selecionar cada local pelo contexto geográfico.
- **Dado** um resultado exibido, **quando** o usuário o seleciona, **então** esse local passa a ser a cidade consultada para clima atual e previsão.

### RF2 — Clima atual (US2)

- **Dada** uma cidade selecionada e uma resposta atual completa, **quando** a consulta termina, **então** a interface exibe temperatura com unidade, condição, umidade, vento, pressão e precipitação.
- **Dada** uma cidade selecionada, **quando** a consulta de clima atual está em andamento, **então** a interface identifica que os dados estão carregando e não apresenta os dados como atualizados antes da resposta.

### RF3 — Previsão de cinco dias (US3)

- **Dada** uma cidade selecionada com previsão disponível, **quando** a consulta termina, **então** a interface apresenta exatamente cinco datas consecutivas, começando por hoje.
- **Dada** cada data da previsão, **quando** os dados são exibidos, **então** são apresentados mínima, máxima, condição e precipitação prevista, com unidades identificáveis.
- **Dada** uma data sem algum valor opcional da previsão, **quando** a previsão é exibida, **então** o valor ausente é indicado como indisponível e os demais dias continuam visíveis.

### RF4 — Unidade de temperatura (US4)

- **Dada** a aplicação exibindo temperaturas em Celsius, **quando** o usuário seleciona Fahrenheit, **então** as temperaturas atual e previstas passam a ser exibidas em Fahrenheit e identificadas como tal.
- **Dada** a aplicação exibindo temperaturas em Fahrenheit, **quando** o usuário seleciona Celsius, **então** as temperaturas atual e previstas passam a ser exibidas em Celsius e identificadas como tal.
- **Dada** uma unidade selecionada, **quando** a unidade é alterada, **então** nenhuma temperatura visível permanece rotulada ou apresentada na escala anterior.

### RF5 — Uso em dispositivos móveis (US5)

- **Dado** um viewport de 320 px de largura ou maior, **quando** o usuário busca, escolhe uma cidade, consulta os dados e alterna a unidade, **então** os controles permanecem acessíveis e o conteúdo não exige rolagem horizontal da página.
- **Dado** que o viewport muda entre móvel e desktop, **quando** a interface se adapta, **então** a cidade selecionada e os dados exibidos permanecem disponíveis.

### RF6 — Estados e recuperação (US6)

- **Dada** uma consulta em andamento, **quando** ainda não há resposta, **então** a interface exibe um estado de carregamento.
- **Dada** uma busca concluída sem correspondências, **quando** os resultados são apresentados, **então** a interface informa que nenhuma cidade foi encontrada e permite iniciar outra busca.
- **Dada** uma falha de rede ou do provedor, **quando** a consulta termina sem sucesso, **então** a interface exibe uma mensagem compreensível e uma ação de nova tentativa.
- **Dada** uma consulta que falhou para uma cidade selecionada, **quando** o erro é exibido, **então** a cidade permanece selecionada até o usuário escolher outra.

## Non-Functional Requirements

- **RNF1 — Responsividade:** os fluxos principais devem funcionar a partir de 320 px de largura até telas desktop, sem conteúdo ou controles sobrepostos e sem rolagem horizontal da página.
- **RNF2 — Acessibilidade:** os fluxos devem ser operáveis por teclado, ter rótulos e estados anunciáveis por tecnologia assistiva, foco visível e contraste conforme WCAG 2.1 nível AA.
- **RNF3 — Desempenho percebido:** em conexão típica, a interface inicial deve ficar utilizável em até 2 segundos. A busca e a consulta de dados devem mostrar estado de carregamento imediatamente após o envio; uma resposta que não chegue em até 10 segundos deve ser tratada como timeout recuperável.
- **RNF4 — Resiliência:** uma falha de geocoding ou previsão não deve travar a interface nem apagar a cidade selecionada; deve ser comunicada e permitir nova tentativa.
- **RNF5 — Consistência e legibilidade:** cada temperatura deve aparecer junto da unidade correspondente; datas devem ser apresentadas no idioma pt-BR e de forma inequívoca. Vento será apresentado em km/h, precipitação em mm e pressão em hPa.
- **RNF6 — Compatibilidade:** suportar versões estáveis atuais dos navegadores Chrome, Edge, Firefox e Safari em desktop e dispositivos móveis.
- **RNF7 — Privacidade e acesso:** não exigir conta, não solicitar geolocalização e não armazenar dados pessoais no servidor na versão inicial.

## Edge Cases

| Caso | Comportamento esperado |
| --- | --- |
| Campo de busca vazio ou contendo apenas espaços | Não enviar consulta; orientar o usuário a informar uma cidade. |
| Cidade inexistente ou sem correspondências | Exibir estado vazio informativo e permitir nova busca. |
| Nome com acentos, espaços ou caracteres especiais válidos | Enviar o texto sem quebrar a interface e exibir correspondências retornadas pela fonte. |
| Cidades homônimas | Mostrar o contexto geográfico disponível em cada resultado para permitir seleção consciente. |
| Falha no serviço de geocoding | Informar que a busca falhou, manter a busca disponível e oferecer nova tentativa. |
| Falha no serviço de previsão após selecionar cidade | Preservar a cidade e exibir erro com ação para repetir a consulta. |
| Requisição excede 10 segundos | Encerrar o estado de espera como timeout, informar a falha e permitir nova tentativa. |
| Resposta de clima ou previsão sem um campo | Mostrar “—” para o campo indisponível; manter os demais dados e dias visíveis. |
| Nenhuma previsão diária disponível | Exibir indisponibilidade da previsão sem apresentar dias ou valores inventados; manter a consulta de clima atual independente, se disponível. |
| Alternância de unidade durante consulta em andamento | Aplicar a unidade selecionada aos dados quando forem exibidos, sem misturar °C e °F. |
| Rede desconectada | Informar que não foi possível atualizar os dados e permitir nova tentativa após a conexão voltar; não prometer funcionamento offline. |

## Assumptions

- A aplicação é web e não requer instalação; a consulta meteorológica requer conexão com a internet.
- Open-Meteo é a fonte de geocoding e previsão e não exige chave de API para o escopo definido.
- A previsão é diária e inclui hoje mais quatro dias consecutivos.
- Os campos de clima atual são temperatura, condição, umidade, vento, pressão e precipitação; a previsão diária inclui mínima, máxima, condição e precipitação.
- Celsius é a unidade inicial em cada nova sessão. A escolha de unidade não precisa persistir entre visitas.
- Temperaturas são apresentadas arredondadas ao grau inteiro mais próximo; conversões usam a precisão disponível antes do arredondamento.
- A versão inicial consulta uma cidade por vez e não oferece conta, favoritos, histórico persistente ou geolocalização automática.
- A interface da versão inicial está somente em pt-BR.
- O limite de timeout de 10 segundos, a meta de 2 segundos para a interface inicial e as metas de acessibilidade/compatibilidade acima são os valores de referência desta especificação.

## Risks

| Risco | Impacto | Mitigação prevista |
| --- | --- | --- |
| Indisponibilidade, latência ou limite de uso do Open-Meteo | Clima ou previsão podem ficar temporariamente indisponíveis | Tratar timeout e erros, manter a cidade selecionada e oferecer nova tentativa. |
| Geocoding retorna homônimos ou resultado impreciso | O usuário pode consultar a previsão de outro local | Exibir estado/região e país disponíveis antes da seleção. |
| Resposta parcial ou alteração dos dados do provedor | Alguns campos podem faltar ou deixar de ser compatíveis | Tratar campos ausentes individualmente e não impedir a exibição dos demais dados. |
| Conversão ou rótulo incorreto de Celsius/Fahrenheit | Interpretação errada das temperaturas | Aplicar a conversão de forma consistente a clima atual e previsão; verificar os valores e rótulos em ambos os modos. |
| Diferenças de viewport e navegador | Controles podem ficar inacessíveis em alguns dispositivos | Cobrir largura mínima de 320 px, navegadores declarados e fluxos móveis nos testes. |
| Conexão instável | Dados recentes podem não ser carregados | Comunicar falha e timeout sem bloquear a interface; não indicar que os dados estão atualizados quando a consulta falhar. |

## Out of Scope

- Autenticação, contas de usuário e dados associados a perfil.
- Persistência de cidade, preferências, favoritos ou histórico entre visitas.
- Geolocalização automática.
- Múltiplas cidades simultâneas ou comparação entre cidades.
- Funcionamento offline, cache de previsões ou indicação de dados meteorológicos armazenados.
- Idiomas além de pt-BR.
- Previsão horária, mapas meteorológicos, alertas, notificações push e dados históricos.
- Administração de conteúdo ou configuração de provedor pela interface.

## Open Questions

Não há perguntas bloqueantes para a versão descrita. As escolhas de provedor, período, unidade inicial, idioma, campos, timeout, compatibilidade e limites de qualidade foram fixadas como baseline desta especificação; mudanças nesses valores exigem revisão dos requisitos e critérios de aceite.

## Rastreabilidade

| História | Requisitos | Critérios de aceite |
| --- | --- | --- |
| US1 — Busca | RF1 | Busca vazia, resultados, desambiguação e seleção |
| US2 — Condições atuais | RF2, RF6 | Campos atuais, carregamento e recuperação |
| US3 — Planejamento | RF3, RF6 | Cinco dias, campos diários e dados ausentes |
| US4 — Unidade | RF4 | Alternância completa entre Celsius e Fahrenheit |
| US5 — Uso móvel | RF5 | Fluxos completos em viewport móvel e adaptação |
| US6 — Recuperação | RF6 | Carregamento, vazio, falha, nova tentativa e cidade preservada |