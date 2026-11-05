# Discovery — Aplicativo de Previsão do Tempo

## Contexto

O briefing solicita uma aplicação de previsão do tempo que permita buscar cidades, consultar o clima atual e a previsão para cinco dias, alternar entre Celsius e Fahrenheit e usar o produto em dispositivos móveis. O público, a fonte dos dados, os detalhes das previsões e os critérios de qualidade ainda não foram especificados.

## Requisitos Funcionais

- **RF1 — Buscar cidades:** permitir que o usuário pesquise uma cidade e selecione o local desejado. A forma de distinguir cidades homônimas ainda precisa ser definida.
- **RF2 — Consultar clima atual:** exibir as condições atuais para a cidade selecionada. Quais variáveis devem aparecer além da temperatura ainda está em aberto.
- **RF3 — Consultar previsão de cinco dias:** exibir a previsão para cinco dias da cidade selecionada. A inclusão do dia atual e o nível de detalhe diário ou horário ainda precisam ser definidos.
- **RF4 — Alternar unidades:** permitir alternar entre Celsius e Fahrenheit e refletir a unidade escolhida nos valores exibidos.
- **RF5 — Usar em dispositivos móveis:** oferecer as funções principais em dispositivos móveis. O layout e os critérios de compatibilidade devem ser detalhados na especificação.
- **RF6 — Comunicar estados da aplicação:** informar ao usuário quando os dados estão carregando, quando não há resultados e quando ocorre uma falha de busca ou consulta. *(Necessidade derivada para viabilizar os fluxos; validar na especificação.)*

## Requisitos Não-Funcionais

- **RNF1 — Responsividade:** a interface deve permanecer utilizável em telas móveis e adaptar-se a telas maiores. Breakpoints e dispositivos suportados precisam ser definidos.
- **RNF2 — Acessibilidade:** busca, seleção de cidade e alternância de unidade devem ser operáveis por teclado e possuir nomes/estados acessíveis. O nível de conformidade a adotar precisa ser definido.
- **RNF3 — Desempenho percebido:** buscas e consultas devem fornecer retorno em tempo adequado, com indicação de carregamento quando necessário. Metas mensuráveis de latência ainda não foram informadas.
- **RNF4 — Resiliência:** falhas de rede ou do serviço de dados não devem deixar a interface sem resposta; o usuário deve receber uma mensagem compreensível e uma forma de tentar novamente. *(Proposta a validar.)*
- **RNF5 — Clareza dos dados:** valores, unidades e datas devem ser apresentados de forma consistente, evitando ambiguidade entre escalas de temperatura e dias da previsão.
- **RNF6 — Compatibilidade:** navegadores e versões mínimas suportados ainda precisam ser definidos.

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Indisponibilidade, lentidão ou limite de uso do provedor de dados | Média | Alto: clima e previsão podem não ser exibidos | Selecionar provedor com limites e disponibilidade adequados; tratar falhas, permitir nova tentativa e avaliar cache. |
| Busca retorna cidades homônimas ou localização incorreta | Alta | Alto: informações meteorológicas de outro local podem induzir decisões erradas | Apresentar contexto de localização, como estado/região e país, antes da seleção. |
| A definição de “cinco dias” ou dos campos da previsão muda durante o desenvolvimento | Média | Médio: pode exigir mudanças na interface e na integração | Resolver o escopo e os exemplos de datas/campos antes de detalhar a especificação. |
| Conversão ou rotulagem incorreta entre Celsius e Fahrenheit | Baixa | Alto: o usuário pode interpretar incorretamente a temperatura | Preferir valores fornecidos na unidade solicitada pela fonte ou usar conversão testada; manter unidade visível junto ao valor. |
| Layout ou controles não funcionam em determinados dispositivos móveis | Média | Médio: compromete o uso de uma necessidade explicitamente citada | Definir larguras-alvo e validar os fluxos principais em viewport móvel e desktop. |
| Conexão instável impede a consulta | Média | Médio: usuário fica sem informação atualizada | Exibir estado de erro claro, preservar a cidade selecionada e oferecer nova tentativa; decidir se haverá suporte offline/cache. |

## Perguntas em Aberto (Open Questions)

1. **Qual provedor de dados será usado e quais são seus limites, custos e requisitos de chave?** Impacto: define arquitetura de integração, operação e risco de indisponibilidade.
2. **A previsão de cinco dias inclui hoje ou começa amanhã?** Impacto: altera datas exibidas, interpretação do requisito e organização da interface.
3. **A previsão será diária, horária ou ambas? Quais variáveis serão exibidas no clima atual e na previsão?** Impacto: determina o contrato de dados e a complexidade da apresentação.
4. **Como o usuário deve desambiguar cidades com o mesmo nome?** Impacto: afeta a busca e reduz o risco de mostrar o clima do local errado.
5. **Qual unidade deve ser selecionada inicialmente e a preferência deve persistir entre visitas?** Impacto: define o comportamento da primeira consulta e se é necessária persistência local.
6. **Quais idiomas e formatos de data/hora devem ser suportados?** Impacto: afeta localização de textos, nomes de condições, datas e unidades.
7. **É necessário detectar a localização do usuário automaticamente?** Impacto: afeta permissões, privacidade e o fluxo inicial; o briefing só garante busca manual de cidades.
8. **A aplicação deve funcionar offline ou mostrar dados armazenados em cache?** Impacto: pode exigir armazenamento local, regras de validade e indicadores de atualização.
9. **É necessário salvar cidades favoritas ou histórico de buscas?** Impacto: define requisitos de persistência e possíveis controles de privacidade.
10. **Quais navegadores, tamanhos de tela e metas de acessibilidade/desempenho são obrigatórios?** Impacto: transforma expectativas gerais de uso móvel em critérios verificáveis de qualidade.

## Suposições (Assumptions)

- O usuário seleciona manualmente uma cidade; geolocalização automática não é necessária para atender ao briefing mínimo.
- O produto é uma aplicação web e deve funcionar sem exigir instalação em dispositivo móvel.
- O usuário precisa consultar dados atuais pela internet; comportamento offline não está garantido pelo briefing.
- Uma única cidade selecionada por vez é suficiente para a primeira versão, até que favoritos ou comparação sejam confirmados.
- A aplicação não precisa de autenticação para atender aos fluxos descritos.

## Decisões para a Próxima Fase

Para o escopo deste treinamento, adotar as seguintes decisões como baseline da especificação:

- **Fonte de dados:** Open-Meteo (geocoding e previsão), sem chave de API.
- **Período da previsão:** cinco dias, contando hoje e os quatro dias seguintes.
- **Unidade inicial:** Celsius; o usuário pode alternar para Fahrenheit.
- **Autenticação e persistência de servidor:** não necessárias na primeira versão.
- **Idioma da interface:** pt-BR.
- **Geolocalização automática:** fora do escopo da primeira versão.

Essas decisões fecham parte das perguntas abertas para avançar no treinamento; não implicam favoritos, suporte offline ou persistência da preferência de unidade.

## Personas

- **Pessoa que organiza a semana:** consulta a previsão dos próximos dias para planejar compromissos e atividades.
- **Pessoa que decide o que vestir ou levar:** consulta rapidamente o clima atual, principalmente pelo celular, para se preparar para o dia.
- **Pessoa viajando para outra cidade:** busca um destino pelo nome e precisa confirmar que selecionou a localização correta antes de consultar a previsão.