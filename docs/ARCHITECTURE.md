# MetaForge — Arquitetura Completa

> Documento de referência do produto. Cobre a estratégia de dados externos,
> pipeline de sincronização, cache, schema de banco, estrutura de pastas,
> autenticação, escalabilidade e o roadmap de fases. O código da Fase 1
> (Fundação) que acompanha este documento já implementa as seções 1, 2 (auth)
> e 6 (estrutura/design system); as seções 3, 4 e 5 são o projeto para as
> próximas fases.

---

## 1. Visão geral

MetaForge unifica em um único produto: Team Builder, Damage Calculator,
Pokédex competitiva, Meta Analyzer, biblioteca de times, sistema social,
rankings e (opcionalmente) draft league — com uma identidade visual própria
("Tera Crystal": preto-arroxeado profundo, glassmorphism, hexágono facetado
como elemento de assinatura) e dados competitivos que se mantêm atualizados
automaticamente, sem depender de edição manual de código a cada nova geração
ou mudança de tier.

A decisão de arquitetura mais importante do produto é **de onde vêm os
dados** e **como eles chegam ao banco**. É o que a Seção 2 resolve.

---

## 2. Estratégia de dados externos

O briefing pede integração com PokéAPI, Pokémon Showdown e Smogon. Cada uma
tem uma natureza diferente e por isso é tratada de um jeito diferente —
tentar tratá-las como "três APIs REST equivalentes" é o erro mais comum
nesse tipo de projeto e gera retrabalho.

### 2.1 PokéAPI — dados de espécie

PokéAPI é uma REST/GraphQL API pública e gratuita com dados de espécie:
stats base, tipos, evoluções, sprites (inclusive os animados/Gen 5 e
oficiais), formas, altura/peso. Ótima para o que ela é: **dados estáveis de
jogo**, não dados competitivos.

Pontos de atenção em produção:
- **Rate limiting**: a instância pública tem limite de uso razoável para uso
  pessoal, mas não para centenas de milhares de usuários simultâneos. A
  recomendação oficial do projeto para esse volume é **hospedar a própria
  instância do PokéAPI** (eles distribuem uma imagem Docker/Graphql self-host)
  ou consumir uma vez e cachear permanentemente — dados de espécie mudam
  apenas quando há uma nova geração de jogos.
- Sprites: a PokéAPI aponta para o repositório `PokeAPI/sprites` no GitHub.
  Em produção, esses assets devem ser servidos por um CDN próprio (ver Seção
  5), não direto do GitHub raw, por custo e latência.

### 2.2 Pokémon Showdown — learnsets, validação, formatos

Showdown **não expõe uma API REST pública e documentada** para dex data —
e tentar fazer scraping do client é frágil e quebra a cada update. A forma
real e correta (usada pelo próprio time da Smogon) é consumir o ecossistema
de pacotes npm **`@pkmn`** (mantido por Guangcong "Zarel" Luo, o
desenvolvedor principal do Showdown, sob `pkmn.cc`):

| Pacote | Para que serve |
|---|---|
| `@pkmn/dex` | Dex unificado (species, moves, abilities, items, formats), atualizado a cada geração/patch |
| `@pkmn/data` | Camada de API mais ergonômica sobre o Dex, com `Generations` |
| `@pkmn/sets` | Parse/serialização do formato de set do Showdown (import/export) |
| `@pkmn/sim` | Motor de simulação e **validador de times/formato** (legalidade, bans, clauses) |
| `@smogon/calc` | **O motor oficial do damage calculator do Showdown**, distribuído como pacote consumível — usar isso em vez de reimplementar a fórmula de dano |
| `@pkmn/mods` | Suporte a formatos não-canônicos / gerações antigas |
| `@pkmn/img` | URLs corretas de sprites/ícones no estilo Showdown |

Essa é a mudança mais importante deste documento em relação ao briefing
original: **o Damage Calculator não deveria ser uma fórmula escrita à mão.**
Ele deve envolver `@smogon/calc` + `@pkmn/data`, garantindo paridade exata
com o calculador que a comunidade competitiva já confia, geração a geração,
incluindo Tera, abilities especiais e interações de campo.

A sincronização desses dados para o Postgres é, na prática, **um job que
reage a novas versões desses pacotes no npm** (não um scraper): quando uma
nova versão de `@pkmn/dex` é publicada (nova geração, novo evento, balanço de
move), o worker de sync atualiza o `package.json`, reprocessa o dex completo
e faz upsert nas tabelas `PokemonSpecies`, `Move`, `Ability`, `Item`,
`LearnsetEntry` e `Format`.

### 2.3 Smogon — tiers e usage stats

A Smogon publica mensalmente, em `smogon.com/stats/<ano-mês>/`, os relatórios
de uso ("chaos reports", em JSON) gerados a partir de milhões de batalhas no
Showdown — é a fonte real por trás de toda tabela de tier que existe. O
pacote `@pkmn/stats` (também do ecossistema `@pkmn`) implementa exatamente a
lógica de parsing desses relatórios e de classificação de times.

Fluxo de sync mensal:
1. Worker verifica se o mês mais recente em `smogon.com/stats/` é mais novo
   que o `DataVersion` registrado para `SMOGON`.
2. Baixa o `chaos/<formato>-<rating>.json` de cada formato relevante (ex.:
   `gen9ou-1500.json`, `gen9vgc2026regx-1760.json`).
3. Faz parse com `@pkmn/stats`, grava cada entrada em `UsageStat`
   (`kind = SPECIES | MOVE | ITEM | ABILITY | TERA_TYPE | TEAMMATE`).
4. Recalcula `TierAssignment` por espécie/formato a partir do usage% (a regra
   de corte OU/UU/RU/... segue os thresholds públicos que a própria Smogon
   usa para mover Pokémon entre tiers).
5. Grava o resultado em `SyncLog` (sucesso/falha, registros processados).

### 2.4 Suporte a formas especiais

O schema já modela isso via `SpeciesFormKind` (`REGIONAL`, `MEGA`, `GMAX`,
`PARADOX`, `ULTRA_BEAST`, `PRIMAL`, `OTHER_FORM`) e a auto-relação
`baseSpecies` / `forms` em `PokemonSpecies`. Cada forma é uma linha própria
com `showdownId` único (ex.: `landorustherian`, `charizardmegax`,
`ironvaliant`), permitindo que stats, tipos e learnset distintos por forma
sejam representados sem hacks. Quando uma geração futura introduzir um novo
mecanismo de forma, o sync simplesmente preenche `formKind = OTHER_FORM` até
um valor mais específico ser adicionado ao enum — **sem precisar migrar
dados existentes**.

---

## 3. Pipeline de sincronização (ETL)

```
                 ┌─────────────┐   ┌──────────────┐   ┌─────────────┐
   cron/queue →  │ PokéAPI sync │   │ Showdown sync │   │ Smogon sync │
   (BullMQ)      │  (espécies)  │   │ (@pkmn/dex)   │   │ (usage/tier)│
                 └──────┬───────┘   └──────┬───────┘   └──────┬──────┘
                        │                  │                  │
                        ▼                  ▼                  ▼
                 ┌─────────────────────────────────────────────────┐
                 │     upsert idempotente no Postgres (Prisma)      │
                 │  PokemonSpecies · Move · Ability · Item ·        │
                 │  LearnsetEntry · Format · TierAssignment ·       │
                 │  UsageStat                                       │
                 └──────────────────────┬────────────────────────┘
                                         │ grava
                                         ▼
                              SyncLog + DataVersion
                                         │ invalida
                                         ▼
                              cache Redis relacionado
```

- **Orquestração**: BullMQ sobre o mesmo Redis usado para cache de leitura
  (fila separada por nome, ex.: `sync:pokeapi`, `sync:showdown`,
  `sync:smogon`).
- **Frequência**: PokéAPI/Showdown — verificação diária de nova versão
  (idempotente: se nada mudou, não faz upsert). Smogon — mensal, no dia em
  que o relatório do mês anterior é publicado, com retry automático.
- **Idempotência**: toda escrita é um `upsert` por chave natural
  (`showdownId`, `slug`), nunca um `INSERT` cego — reprocessar o mesmo mês ou
  a mesma versão do dex não duplica nem corrompe dados.
- **Sync incremental vs. full**: `DataVersion` guarda a última versão
  processada por fonte. Uma nova geração de jogos (mudança "grande") aciona
  full sync; um patch de balanceamento aciona sync incremental (só as
  entidades que mudaram).
- **Observabilidade**: cada execução grava uma linha em `SyncLog`
  (`RUNNING → SUCCESS | FAILED | PARTIAL`), exibida no painel Admin.
- **Extensibilidade automática**: como o sync lê a versão publicada do
  `@pkmn/dex` e os relatórios mais recentes da Smogon — em vez de uma lista
  de Pokémon "hardcoded" no código — uma nova geração ou Pokémon adicionado
  aparece no produto **sem deploy de código novo**, apenas pela próxima
  execução do worker.

---

## 4. Estratégia de cache

Duas camadas, com responsabilidades diferentes:

| Camada | Papel | TTL típico |
|---|---|---|
| **Postgres** | fonte de verdade do cache de dados externos (sobrevive a reinícios, consultável com SQL/Prisma, base para o Meta Analyzer) | — (atualizado pelo sync, não expira) |
| **Redis** | cache de leitura "quente": resultado de análises de time já computadas, listagens da Pokédex/Meta Analyzer, sessões de busca, rate limiting | 5 min (análises) a 24h (listagens estáveis) |

Chaves de exemplo: `team:analysis:<teamId>:<formatId>`,
`pokedex:species:<slug>:<gen>`, `meta:usage:<formatId>:<month>`,
`search:global:<query-hash>`. Toda escrita que invalida um desses caches
(ex.: sync da Smogon terminou) dispara um `DEL` por prefixo.

CDN (Seção 5) cobre uma terceira camada, só para assets estáticos (sprites,
ícones de item).

---

## 5. Schema Prisma

O schema completo está em [`prisma/schema.prisma`](../prisma/schema.prisma)
no pacote de código. Ele está organizado em 6 camadas (Auth, Dados externos,
Produto, Social, Competitivo, Operacional) — o comentário no topo do próprio
arquivo documenta cada uma. Decisões que vale destacar:

- **`showdownId` como chave natural** em `PokemonSpecies`, `Move`, `Ability`
  e `Item`: é o identificador estável entre `@pkmn/dex`, o formato de
  import/export do Showdown e o restante do produto — evita remapear IDs a
  cada sync.
- **Sets de time são duplamente representados**: `Team.showdownExport`
  (texto, fonte de verdade portátil — o que o usuário cola/exporta) **e**
  `TeamSlot`/`TeamSlotMove` (estrutura relacional, consultável, usada por
  toda a UI). O Team Builder grava os dois a cada edição.
- **Contadores desnormalizados** (`teamsCount`, `likesReceived`,
  `followersCount`...) em `User` e `Team`: leitura O(1) no perfil/ranking,
  atualizados em transação no evento de origem (like, follow, publish).
  Trade-off consciente: mais uma escrita por ação social, mas evita `COUNT()`
  custoso em páginas de alto tráfego.
- **`TierAssignment` e `UsageStat` são tabelas calculadas**, nunca editadas
  por usuário — só pelo worker de sync ou (em emergência) pelo Admin.

---

## 6. Estrutura de pastas e autenticação

Implementadas no pacote de código desta entrega. Resumo:

```
src/app/
  (auth)/signin/            # login (Discord)
  (app)/                    # shell autenticado: Sidebar + Topbar
    dashboard/  profile/[username]/  settings/
    team-builder/ damage-calculator/ pokedex/ meta-analyzer/
    library/ rankings/ draft-league/ admin/    ← stubs "em breve" nesta fase
  api/auth/[...nextauth]/
src/components/{ui,layout,providers}/
src/lib/{auth,prisma,redis,utils}.ts
src/middleware.ts           # protege rotas autenticadas (runtime Node.js)
```

**Autenticação**: Auth.js v5 + `@auth/prisma-adapter`, provider único
(Discord), sessão em banco (`strategy: 'database'`). O `profile()` do
provider mapeia o perfil do Discord direto para os campos do nosso `User`
(`username`, `displayName`, `avatarUrl`, `discordId`).

O middleware roda em **runtime Node.js** (estável desde o Next.js 15.5) —
não Edge — porque `auth()` carrega o Prisma Client e o `jose`
(JWT/criptografia), que dependem de APIs Node indisponíveis no Edge Runtime.

---

## 7. Escalabilidade

Para a meta de "centenas de milhares de usuários":

- **Banco**: Postgres com réplicas de leitura para consultas pesadas
  (Pokédex, Meta Analyzer, busca global) separadas da réplica primária de
  escrita (times, social). Connection pooling via PgBouncer.
- **Cache**: Redis cobre o tráfego de leitura repetitivo (Seção 4); sem ele,
  toda visita à Pokédex recalcularia stats/learnset que não mudam entre
  syncs.
- **Busca global**: para volume alto, Postgres full-text search é o ponto de
  partida; se a latência da busca (Pokémon + times + usuários + moves +
  itens simultaneamente) virar gargalo, migrar para Meilisearch ou Typesense
  — ambos open-source e fáceis de hospedar ao lado do Postgres.
- **Fila de sincronização**: BullMQ desacopla os workers de sync da
  aplicação web — um pico de tráfego no site nunca compete por recursos com
  um sync da Smogon em andamento.
- **CDN**: sprites e ícones (PokéAPI/Showdown) são espelhados para um bucket
  próprio + CDN na primeira vez que são referenciados, em vez de servidos
  direto da fonte original a cada request.
- **SSR seletivo**: páginas de conteúdo público e estável (Pokédex, perfil
  público, biblioteca de times) usam ISR (revalidação periódica); páginas
  autenticadas e mutáveis (dashboard, Team Builder) usam SSR dinâmico.

---

## 8. Limitações conhecidas do ambiente usado para montar este pacote

Documentado também no `README.md` do código, mas vale repetir aqui por ser
relevante à arquitetura: o ambiente de desenvolvimento usado para gerar e
validar este pacote tem acesso de rede restrito a registries de pacote
(`npm`, `pip`, `github`) e **não** a `smogon.com` ou `binaries.prisma.sh`.
Por isso, nesta entrega:

- O build foi validado de ponta a ponta (`npm run build`, `tsc --noEmit`,
  `eslint`) — tudo passa limpo.
- `npx prisma generate` **não pôde ser executado aqui** (precisa baixar o
  engine binário do Prisma) — funciona normalmente em qualquer ambiente com
  acesso padrão à internet. Os tipos do client real (nomes de campo, enums)
  não puderam ser verificados pelo compilador neste ambiente; rode
  `npm run typecheck` no seu ambiente, com o client gerado, antes de
  confiar 100% nos tipos.
- **`@pkmn/dex` é um pacote npm com os dados embutidos — funciona 100%
  offline.** Por isso o worker `scripts/sync/showdown.ts` pôde ser testado de
  ponta a ponta de verdade (extração real: 1292 espécies, 881 moves, 310
  abilities, 532 items, 356 mil+ entradas de learnset, validadas
  manualmente contra casos conhecidos). Só a escrita final no Postgres não
  pôde ser exercitada (mesma limitação do Prisma acima).
- O worker `scripts/sync/smogon.ts` **depende de rede real** para buscar os
  relatórios em `smogon.com/stats/`, indisponível aqui. A lógica de parsing
  foi validada contra um fixture sintético (`scripts/sync/__fixtures__/`);
  confirme contra um download real no seu ambiente antes de agendar em cron.
- O Team Builder (UI, server actions, validação, import/export Showdown via
  `@pkmn/sets`) foi testado quanto a tipos/lint/build; o fluxo de import/
  export especificamente foi validado com dados reais indiretamente, pois
  `@pkmn/sets` também roda 100% offline.

---

## 9. Roadmap de fases

| Fase | Entrega | Status |
|---|---|---|
| **1. Fundação** | Auth Discord, Postgres/Prisma, design system, navegação, perfil, estrutura de times no banco | ✅ |
| **2. Integração de dados + Team Builder** | Sync real com `@pkmn/dex` (Showdown) + Smogon; Team Builder funcional (sets, validação de tier, import/export Showdown) | ✅ Nesta entrega |
| **3. Biblioteca de Times** | Publicação, curtidas, comentários, avaliações, seções de destaque | Próxima |
| **4. Damage Calculator + Pokédex** | `@smogon/calc` integrado (já instalado), busca/filtros da Pokédex, learnsets, parceiros/counters, evoluções (`prevo`/`evos` já disponíveis via `@pkmn/dex` — ver secao 8) | — |
| **5. Meta Analyzer + Assistente de IA** | Dashboards de uso do meta (já alimentados por `UsageStat`), sugestões de set via IA (Claude API) | — |
| **6. Sistema social + Rankings** | Follow/friends/likes/comments, feed de atividade, rankings | — |
| **7. Draft League + Administração** | Ligas com pick/ban, painel admin de moderação e saúde do sync | — |

> Nota sobre a Fase 2: a sincronização com a **PokéAPI** ficou de fora desta
> entrega — `@pkmn/dex` já cobre species/stats/types/sprites/abilities/moves/
> tiers/learnsets, que era o essencial para o Team Builder. A PokéAPI volta a
> ser relevante na Fase 4 (Pokédex) só para metadados que `@pkmn/dex` não tem
> (flavor text das Pokédex entries, egg groups, cadeia de captura) — e talvez
> nem para evoluções, que `@pkmn/dex` também já expõe (secao 8).

---

## 10. Decisões da Fase 2 (registradas para referência)

1. **Hospedagem de sprites**: resolvido — `@pkmn/img` gera URLs oficiais
   hospedadas em `play.pokemonshowdown.com` (estático e animado, normal e
   shiny). Nenhuma decisão de self-host necessária por agora; reavaliar só se
   o tráfego de imagens virar custo relevante.
2. **Granularidade do sync da Smogon**: resolvido — lista priorizada
   (`TRACKED_FORMATS` em `scripts/sync/smogon.ts`): Ubers/OU/UU/RU/NU/PU,
   Monotype, National Dex, Doubles OU, Doubles UU. VGC ficou de fora (ver
   secao 8 — o id do metagame muda com a regulação).
3. **Tiers**: resolvido, e melhor do que o plano original — em vez de
   derivar tiers a partir do usage% da Smogon, usamos o campo `tier`/
   `doublesTier` que o próprio `@pkmn/dex` já expõe (a mesma fonte que o
   Showdown usa). O usage% da Smogon enriquece `TierAssignment.usagePercent`
   como dado complementar, não como base do cálculo do tier.

