# Arquitetura

## Escopo atual

O início implementa a composição desktop/mobile das referências, com destaque selecionável, catálogo, busca, coleções, redes, faixa de preço, abas, ordenação, paginação, banners, seções editoriais e rodapé. Há 36 NFTs determinísticos, nove por página. O detalhe permanece básico; galeria, quantidade, favoritos, conta, carrinho, cotação e pedidos pertencem às próximas etapas.

## Organização

```text
src/
  components/       layout, feedback e componentes shadcn/ui
  features/nfts/    contratos, queries, subscription e apresentação dos NFTs
  lib/              configuração, Axios, QueryClient e utilitários
  mocks/            fixtures, persistência, handlers REST e Socket.IO
  routes/           rotas por arquivo do TanStack Router
  routeTree.gen.ts  arquivo gerado pelo plugin, versionado
tests/e2e/          cenários Playwright executados no build
scripts/            auditoria Lighthouse
```

Fluxo REST: componente → TanStack Query → Axios → rede interceptada pelo MSW → store de mocks. Nenhum componente ou hook importa fixtures ou o store simulado. Zod valida as respostas na fronteira HTTP.

O plugin do Router roda antes do plugin React, gera a árvore de rotas e separa o código por rota. `routeTree.gen.ts` não deve ser editado manualmente. Ao criar rotas, inicie `npm run dev` para regenerá-lo antes de checar tipos.

## Contratos REST atuais

| Método | Endpoint | Resposta |
| --- | --- | --- |
| GET | `/api/nfts` | `{ items, total, page, pageSize, totalPages, facets, featured }` |
| GET | `/api/nfts/:id` | `Nft`, ou HTTP 404 |

```ts
type Nft = {
  id: string
  name: string
  description: string
  imageUrl: string
  priceEth: string // decimal positivo ou zero, até 18 casas
  available: number // inteiro não negativo
  edition: string
  network: 'ethereum' | 'polygon' | 'solana'
  version: number // inteiro positivo e crescente por recurso
  collection: string // uma das nove categorias documentadas no catálogo
  listedAt: string // ISO UTC fixo na fixture
  popularity: number
  isNew: boolean
  isTrending: boolean
  rare: boolean
  previousPriceEth?: string
}
```

O cenário de falha retorna HTTP 503 com `{ code: 'TRANSIENT_FAILURE', message: string }`; recursos ausentes retornam HTTP 404 com `NOT_FOUND`. Os controles rejeitam payloads inválidos com HTTP 422 e `VALIDATION_ERROR`. Outros contratos e classes de erro do desafio serão definidos junto aos respectivos fluxos.

`GET /api/nfts` aceita `q`, `collections` e `networks` (CSV), `minPrice`, `maxPrice`, `sort` (`recent`, `price-asc`, `price-desc`, `popular`), `tab` (`all`, `new`, `trending`) e `page`. Grupos de filtros são combinados por E; valores de um mesmo grupo, por OU. A busca ignora caixa e acentos. A ordenação é estável, com desempate pelo identificador. `facets` contém contagens globais e `featured` contém os destaques, separados dos resultados filtrados. `totalPages` é no mínimo 1; páginas excedentes são limitadas pela API.

Valores ETH são strings no transporte, schemas, cache e apresentação. A comparação para filtro e ordenação converte strings para unidades inteiras de 18 casas com `BigInt`, sem usar ponto flutuante. O parser de URL preserva os preços mesmo em links manuais sem aspas, evitando a conversão implícita de decimais pelo parser JSON do Router. `Number` só ajusta a posição visual dos sliders; inputs textuais, requisições e comparações mantêm até 18 casas. Na compra, valores finais dependerão da cotação autoritativa da API.

## Cache e cancelamento

- Chaves atuais: `['nfts', 'list', searchNormalizado]` e `['nfts', 'detail', id]`.
- `staleTime`: 30 segundos; descarte de queries inativas após cinco minutos.
- Refetch ao recuperar conexão ou foco da janela, quando os dados estiverem obsoletos.
- Uma tentativa adicional para falhas transitórias HTTP 5xx/sem resposta; nenhuma para cancelamento, HTTP 4xx ou schema inválido.
- Mutations não possuem retry automático. Idempotência será implementada nos pedidos antes de qualquer reenvio.
- O `AbortSignal` do Query chega ao Axios, permitindo cancelar requests de consultas que deixam de ser usadas.
- O cache não é persistido. O store do mock é persistido e a API é consultada após refresh.

O Router valida e normaliza todos os parâmetros. Arrays são deduplicados/ordenados e valores padrão são omitidos dos links. Busca/filtros/ordenação/aba reiniciam a página; só a API executa filtragem e paginação. Não há filtro de fixtures na interface. Novas consultas mostram skeleton; refetch da mesma consulta preserva o conteúdo e anuncia a atualização. Queries diferentes possuem chaves e sinais independentes, impedindo que uma resposta de uma busca anterior substitua a atual. As seleções e o rascunho de preço/busca são restaurados pelo histórico. O link do detalhe transporta a consulta para preservar o retorno.

Com autenticação, queries privadas deverão incluir a identidade e ser removidas ao encerrar/trocar a sessão. Essa proteção ainda não existe porque não há recursos privados implementados.

## Tempo real

O evento implementado nesta base é:

```ts
type NftUpdated = {
  eventId: string // UUID
  resourceId: string
  version: number
  data: Nft // snapshot completo com o mesmo id e versão do envelope
}
```

O cliente usa `socket.io-client`, transporte `websocket`, namespace padrão e path `/socket.io/`. Ao conectar, emite `catalog.subscribe` e invalida as queries de NFT para reconciliar com REST, inclusive após reconexão. `nft.updated` só substitui um recurso em cache se sua versão for maior, evitando reaplicar duplicatas ou regredir com eventos antigos. Payloads inválidos são ignorados. As alterações são anunciadas em uma região `aria-live`.

Eventos são processados em sequência. Antes de aplicar um snapshot mais recente, consultas de NFT em andamento são canceladas; depois o cache é atualizado e REST é reconsultado. Isso impede uma resposta anterior ao evento de restaurar o preço antigo e recompõe filtros, ordenação, totais e paginação. Mesmo NFTs fora da página atual invalidam as listas, pois podem passar a pertencer à consulta.

A subscription é instalada no layout raiz e removida no cleanup, junto com a conexão. Atualmente ela acompanha apenas o catálogo público. Subscriptions privadas por sessão, carrinho, versões de cotações e `order.updated` serão acrescentados junto à autenticação e compra.

## Simulação

MSW **2.15** é usado com `@mswjs/socket.io-binding` **0.2**. Essa combinação é intencional: a versão publicada do binding usa `toSocketIo` e declara compatibilidade com MSW 2. A API `SocketIo` exibida no README mais recente do repositório do binding ainda não corresponde ao pacote 0.2 publicado. Não atualizar para MSW 3 sem revalidar o binding.

O binding fornece handshake e frames Socket.IO. O mock envia ping Engine.IO a cada 20 segundos e libera o timer ao desconectar. Não há polling HTTP, namespaces adicionais, rooms, autenticação Socket.IO, acknowledgements ou payloads binários nesta simulação. Uma implantação estática na Vercel não precisa de servidor WebSocket: o MSW intercepta a conexão no navegador. Isso verifica o cliente e o protocolo, mas não simula uma infraestrutura distribuída real.

O bootstrap aguarda `worker.start()` e só então importa `app.tsx`. Essa ordem importa: o cliente Socket.IO captura o construtor de WebSocket ao carregar o módulo. Importá-lo antes da ativação dos interceptors deixaria o REST simulado, mas tentaria uma conexão WebSocket real, inclusive no build.

MSW 2.15 normaliza a URL removendo o prefixo `/socket.io/` antes de comparar o handler. Por isso `ws.link` registra a origem sem esse prefixo; o cliente continua usando `/socket.io/` normalmente.

O store `kurio:mock:v2` em `localStorage` mantém o cenário e os NFTs entre refreshes. A alteração de schema reinicia a versão anterior da simulação. É local ao navegador/origem; sincronização entre abas não faz parte desta etapa. Dados inválidos são descartados para restaurar um estado conhecido.

Controles de demonstração/testes (somente quando MSW está ativo):

| Método | Endpoint | Uso |
| --- | --- | --- |
| POST | `/api/__mock/reset` | Restaura catálogo e cenário padrão |
| POST | `/api/__mock/scenario` | Body JSON: `"default"`, `"slow"`, `"out-of-order"`, `"network-error"`, `"catalog-error"`, `"empty"` |
| GET | `/api/__mock/state` | Informa cenário e quantidade de subscribers ativos |
| POST | `/api/__mock/nfts/:id` | Altera `priceEth` e/ou `available`, incrementa versão e publica evento |
| POST | `/api/__mock/events` | Injeta envelope `NftUpdated`, inclusive duplicatas/antigos |

Os controles de eventos mantêm REST coerente com a versão mais recente. Não importam setters, componentes ou QueryClient. Testes chamam esses endpoints de dentro da página para passar pelo MSW. Os cenários mais complexos do enunciado ainda não estão implementados.

## Interface e assets

Os quatro PNGs originais enviados em `jungles.zip` estão em `public/nfts/`. Nenhuma imagem depende de host externo. Roboto Mono foi escolhida provisoriamente com base nas referências e é servida localmente via Fontsource; a família exata ainda precisa ser confirmada no Figma. Cores iniciais foram aproximadas pelas referências e o contraste do texto secundário foi reforçado.

Button e Skeleton foram gerados pelo CLI shadcn/ui 4.23.0, estilo `new-york`. Os imports de `cn` apontam para o utilitário local; Skeleton foi adaptado para shimmer com dimensões estáveis, e há respeito a `prefers-reduced-motion`. A CLI é usada sob demanda e não é dependência da aplicação.

Existem link para pular ao conteúdo, landmarks, hierarquia de títulos, foco visível, alt nas imagens e mensagens acessíveis de carregamento/erro/atualização. Busca e painel de filtros usam Dialog do Radix (mesma fundação dos componentes shadcn/ui instalados), com portal, overlay, foco contido, Escape e retorno ao acionador. Inputs de preço possuem labels e erro associado; abas suportam setas, Home e End. Skeletons conservam a geometria da grade e respeitam movimento reduzido.

O acesso direto ao Figma não foi liberado pela integração; foram usadas as imagens desktop/mobile fornecidas pelo usuário. O mobile usa destaque compacto, grade escalonada, navegação inferior e filtros em painel; tablet mantém a grade sem sidebar. Contagens, ordem dos itens e preços vêm da API e podem diferir dos números ilustrativos dos frames. Mantém-se a mesma ordenação nos diferentes viewports. Os campos exatos de preço e áreas de toque de 24 px nos indicadores são ajustes de acessibilidade. Os símbolos sociais do rodapé são glifos provisórios, pois esses SVGs não vieram nos assets; a família tipográfica permanece a aproximação local já documentada.

Conteúdo editorial e newsletter são somente apresentação; links de coleções e banners navegam para consultas reais. Ações de conta, favoritos e carrinho permanecem desabilitadas até os respectivos fluxos serem implementados, sem mensagens fictícias de sucesso.

## Verificação e entrega

A CI verifica tipos, lint e build com npm 11 e 12, além de E2E em Chromium desktop/mobile. Playwright testa o build otimizado com contextos novos e MSW ativo, registra relatório HTML e retém traces de falhas. A suíte cobre catálogo, histórico, precisão, erros, eventos e foco, além das verificações da base; não representa os fluxos privados ainda pendentes. Baselines de início desktop/mobile estão versionadas, com dados/seleção de destaque estáveis e animações desativadas na captura. A tolerância de 3.000 pixels cobre pequenas diferenças de renderização entre plataformas; detalhes, carrinho e pagamento terão baselines quando seus layouts forem concluídos.

`scripts/lighthouse.mjs` usa o Chromium do Playwright, serve o build e executa três rodadas por página/perfil por padrão. Gera relatórios completos e medianas de Performance, Accessibility, Best Practices e SEO, além de LCP/CLS/TBT e ambiente. As metas devem ser verificadas novamente com todas as funcionalidades e layouts implementados.

Os diálogos são importados sob demanda; o foco retorna explicitamente ao acionador após fechar o módulo carregado. React DOM é importado após a ativação dos mocks, com chunk inicial pequeno, e as fontes principais são antecipadas no HTML. As otimizações valem para a aplicação publicada, sem modos especiais de auditoria.

A auditoria de início está em `reports/lighthouse/catalog/`, com três execuções por perfil. Performance mobile teve mediana 88, abaixo da meta 90, com LCP de 3,233 s e TBT de 250 ms. O caminho de inicialização dos mocks seguido da aplicação e o trabalho de JavaScript permanecem como oportunidades de otimização. A primeira execução variou significativamente (TBT 649 ms) e está preservada nos relatórios. Desktop teve Performance 100; Accessibility, Best Practices e SEO foram 100 em ambos. O detalhe completo e os demais fluxos ainda precisam da auditoria final.

`vercel.json` configura deploy estático com acesso direto às rotas. A integração Git da Vercel está conectada e publica previews e produção; GitHub Actions verifica o código. A base foi validada publicamente em https://nft-marketplace-chi-five.vercel.app/. Novas etapas devem ser conferidas no preview e mescladas após a CI antes de atualizar essa produção.
