# Arquitetura

## Escopo da base

Esta etapa estabelece e verifica as integrações. As páginas de início e detalhe são simplificadas e ainda não representam a implementação completa do Figma. Busca, filtros, paginação, favoritos, conta, carrinho, cotação e pedidos permanecem para as próximas etapas.

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
| GET | `/api/nfts` | `{ items: Nft[] }` |
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
}
```

O cenário de falha retorna HTTP 503 com `{ code: 'TRANSIENT_FAILURE', message: string }`; recursos ausentes retornam HTTP 404 com `NOT_FOUND`. Os controles rejeitam payloads inválidos com HTTP 422 e `VALIDATION_ERROR`. Outros contratos e classes de erro do desafio serão definidos junto aos respectivos fluxos.

Valores ETH são strings no transporte, nos schemas, no cache e na apresentação. Não há cálculo monetário nesta etapa. Na compra, subtotal, desconto e taxas precisarão de aritmética decimal exata e cotação autoritativa da API.

## Cache e cancelamento

- Chaves atuais: `['nfts', 'list']` e `['nfts', 'detail', id]`.
- `staleTime`: 30 segundos; descarte de queries inativas após cinco minutos.
- Refetch ao recuperar conexão ou foco da janela, quando os dados estiverem obsoletos.
- Uma tentativa adicional para falhas transitórias HTTP 5xx/sem resposta; nenhuma para cancelamento, HTTP 4xx ou schema inválido.
- Mutations não possuem retry automático. Idempotência será implementada nos pedidos antes de qualquer reenvio.
- O `AbortSignal` do Query chega ao Axios, permitindo cancelar requests de consultas que deixam de ser usadas.
- O cache não é persistido. O store do mock é persistido e a API é consultada após refresh.

Com filtros, todos os parâmetros normalizados deverão integrar URL e query key. Com autenticação, queries privadas deverão incluir a identidade e ser removidas ao encerrar/trocar a sessão. Essa proteção ainda não existe porque não há recursos privados implementados.

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

A subscription é instalada no layout raiz e removida no cleanup, junto com a conexão. Atualmente ela acompanha apenas o catálogo público. Subscriptions privadas por sessão, carrinho, versões de cotações e `order.updated` serão acrescentados junto à autenticação e compra.

## Simulação

MSW **2.15** é usado com `@mswjs/socket.io-binding` **0.2**. Essa combinação é intencional: a versão publicada do binding usa `toSocketIo` e declara compatibilidade com MSW 2. A API `SocketIo` exibida no README mais recente do repositório do binding ainda não corresponde ao pacote 0.2 publicado. Não atualizar para MSW 3 sem revalidar o binding.

O binding fornece handshake e frames Socket.IO. O mock envia ping Engine.IO a cada 20 segundos e libera o timer ao desconectar. Não há polling HTTP, namespaces adicionais, rooms, autenticação Socket.IO, acknowledgements ou payloads binários nesta simulação. Uma implantação estática na Vercel não precisa de servidor WebSocket: o MSW intercepta a conexão no navegador. Isso verifica o cliente e o protocolo, mas não simula uma infraestrutura distribuída real.

O bootstrap aguarda `worker.start()` e só então importa `app.tsx`. Essa ordem importa: o cliente Socket.IO captura o construtor de WebSocket ao carregar o módulo. Importá-lo antes da ativação dos interceptors deixaria o REST simulado, mas tentaria uma conexão WebSocket real, inclusive no build.

MSW 2.15 normaliza a URL removendo o prefixo `/socket.io/` antes de comparar o handler. Por isso `ws.link` registra a origem sem esse prefixo; o cliente continua usando `/socket.io/` normalmente.

O store `kurio:mock:v1` em `localStorage` mantém o cenário e os NFTs entre refreshes. É local ao navegador/origem; sincronização entre abas não faz parte desta base. Dados inválidos são descartados para restaurar um estado conhecido.

Controles de demonstração/testes (somente quando MSW está ativo):

| Método | Endpoint | Uso |
| --- | --- | --- |
| POST | `/api/__mock/reset` | Restaura catálogo e cenário padrão |
| POST | `/api/__mock/scenario` | Body JSON: `"default"`, `"slow"`, `"catalog-error"`, `"empty"` |
| GET | `/api/__mock/state` | Informa cenário e quantidade de subscribers ativos |
| POST | `/api/__mock/nfts/:id` | Altera `priceEth` e/ou `available`, incrementa versão e publica evento |
| POST | `/api/__mock/events` | Injeta envelope `NftUpdated`, inclusive duplicatas/antigos |

Os controles de eventos mantêm REST coerente com a versão mais recente. Não importam setters, componentes ou QueryClient. Testes chamam esses endpoints de dentro da página para passar pelo MSW. Os cenários mais complexos do enunciado ainda não estão implementados.

## Interface e assets

Os quatro PNGs originais enviados em `jungles.zip` estão em `public/nfts/`. Nenhuma imagem depende de host externo. Roboto Mono foi escolhida provisoriamente com base nas referências e é servida localmente via Fontsource; a família exata ainda precisa ser confirmada no Figma. Cores iniciais foram aproximadas pelas referências e o contraste do texto secundário foi reforçado.

Button e Skeleton foram gerados pelo CLI shadcn/ui 4.23.0, estilo `new-york`. Os imports de `cn` apontam para o utilitário local; Skeleton foi adaptado para shimmer com dimensões estáveis, e há respeito a `prefers-reduced-motion`. A CLI é usada sob demanda e não é dependência da aplicação.

Existem link para pular ao conteúdo, landmarks, hierarquia de títulos, foco visível, alt nas imagens e mensagens acessíveis de carregamento/erro/atualização. Não são adicionadas ações de compra sem comportamento implementado. Modais, formulários e demais padrões serão implementados e testados nos próximos fluxos.

## Verificação e entrega

A CI verifica tipos, lint, build e E2E em Chromium desktop/mobile. Playwright testa o build otimizado com contextos novos e MSW ativo, registra relatório HTML e retém traces de falhas. A suíte atual verifica a infraestrutura e a seleção inicial; não representa a cobertura completa solicitada pelo desafio. Baselines visuais permanecem pendentes até os layouts completos estabilizarem.

`scripts/lighthouse.mjs` usa o Chromium do Playwright, serve o build e executa três rodadas por página/perfil por padrão. Gera relatórios completos e medianas de Performance, Accessibility, Best Practices e SEO, além de LCP/CLS/TBT e ambiente. As metas devem ser verificadas novamente com todas as funcionalidades e layouts implementados.

`vercel.json` prepara deploy estático com suporte a acesso direto às rotas. A conexão do repositório com a conta Vercel e a verificação do endereço publicado são etapas externas à configuração local. A integração Git da Vercel publica previews e produção; GitHub Actions verifica o código. Aprovar/mesclar o PR após a CI permite manter a branch de produção validada.
