# Arquitetura

## Escopo atual

O início implementa a composição desktop/mobile das referências, com destaque selecionável, catálogo, busca, coleções, redes, faixa de preço, abas, ordenação, paginação, banners, seções editoriais e rodapé. Há 36 NFTs determinísticos, nove por página. O detalhe inclui galeria, ampliação, edições, quantidade, informações, avaliações e relacionados. Login, cadastro, sessão, logout e favoritos são funcionais com MSW. Carrinho, compra, cotação, pedidos, perfil e carteiras pertencem às próximas etapas.

## Organização

```text
src/
  components/       layout, feedback e componentes shadcn/ui
  features/nfts/    contratos, queries, subscription e apresentação dos NFTs
  features/auth/    autenticação, sessão e formulários
  features/favorites/ favoritos por usuário, mutations e apresentação
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
| GET | `/api/nfts/:id` | `NftDetail` (estende `Nft`), ou HTTP 404 |
| GET | `/api/nfts/:id/related` | `{ items: Nft[] }`, ou HTTP 404 |
| GET | `/api/session` | `{ user, expiresAt }`; anônimo sem credencial; 401 se inválida/expirada |
| POST | `/api/session/login` | Recebe `{ email, password }`, retorna `{ user, expiresAt, token }` |
| POST | `/api/session/register` | Recebe `{ name, email, password, confirmPassword }`, retorna sessão (201) |
| POST | `/api/session/logout` | Revoga a credencial; HTTP 204 |
| GET | `/api/favorites` | `{ ids: string[] }`; exige sessão |
| PUT / DELETE | `/api/favorites/:id` | Inclusão/remoção idempotente; retorna `{ ids }`; exige sessão |

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

Layout, tipografia, cores, espaçamentos, estados e responsividade usam utilitários Tailwind nos componentes. `catalog.css` foi removido. Valores arbitrários preservam as medidas exatas da versão visual aprovada; as classes semânticas restantes servem como identificadores, sem regras CSS próprias. As variantes `mobile` (até 767 px), `tablet` (768–1199 px) e `tablet-compact` (768–1023 px) mantêm os intervalos anteriores. O CSS global concentra tema, fontes, estilos de base, shimmer e movimento reduzido.

O Tailwind procura classes somente em `src/`, por meio de `source(".")` em `src/styles.css`. Relatórios HTML de auditoria não participam da geração do CSS. A fonte base também é declarada explicitamente na raiz, e o teste visual verifica sua família e carregamento.

Os quatro PNGs originais enviados em `jungles.zip` estão em `public/nfts/`. Nenhuma imagem depende de host externo. Roboto Mono foi escolhida provisoriamente com base nas referências e é servida localmente via Fontsource; a família exata ainda precisa ser confirmada no Figma. Cores iniciais foram aproximadas pelas referências e o contraste do texto secundário foi reforçado.

Button e Skeleton foram gerados pelo CLI shadcn/ui 4.23.0, estilo `new-york`. Os imports de `cn` apontam para o utilitário local; Skeleton foi adaptado para shimmer com dimensões estáveis, e há respeito a `prefers-reduced-motion`. A CLI é usada sob demanda e não é dependência da aplicação.

Dialog e Slider em `src/components/ui/` foram adaptados dos registros oficiais shadcn/ui [dialog](https://ui.shadcn.com/r/styles/new-york-v4/dialog.json) e [slider](https://ui.shadcn.com/r/styles/new-york-v4/slider.json). Mantêm a fundação Radix, composição, atributos `data-slot`, props e `cn`, com classes Tailwind ajustadas para conservar o visual aprovado, sem os estilos ou animações padrão do registro. O catálogo consome esses componentes locais.

Existem link para pular ao conteúdo, landmarks, hierarquia de títulos, foco visível, alt nas imagens e mensagens acessíveis de carregamento/erro/atualização. Busca e painel de filtros usam Dialog do Radix (mesma fundação dos componentes shadcn/ui instalados), com portal, overlay, foco contido, Escape e retorno ao acionador. A faixa de preço usa Slider do Radix com dois controles na mesma barra, arraste, teclado e valores sincronizados nos inputs; a consulta só muda ao aplicar. Inputs de preço possuem labels e erro associado; abas suportam setas, Home e End. Skeletons conservam a geometria da grade e respeitam movimento reduzido.

O acesso direto ao Figma não foi liberado pela integração; foram usadas as imagens desktop/mobile fornecidas pelo usuário. O mobile usa destaque compacto, grade escalonada, navegação inferior e filtros em painel; tablet mantém a grade sem sidebar. A revisão solicitada pelo usuário remove a imagem secundária do destaque mobile, separa texto e arte em colunas, destaca o indicador ativo e arredonda/engrossa a moldura dos cards. Os ícones sociais vêm do Font Awesome 6 via React Icons, com espaçamento uniforme; as carteiras usam distribuição horizontal. Contagens, ordem dos itens e preços vêm da API e podem diferir dos números ilustrativos dos frames. Mantém-se a mesma ordenação nos diferentes viewports. Os campos exatos de preço e áreas de toque de 24 px nos indicadores são ajustes de acessibilidade. A família tipográfica permanece a aproximação local já documentada.

“Limpar filtros” aparece somente com busca, coleções, redes, faixa de preço ou aba restritiva ativos. Ordenação e paginação isoladas não ativam esse botão. O item Mercado do header aponta para `/#catalogo`; não existe uma rota própria para Mercado nesta etapa.

Conteúdo editorial e newsletter são somente apresentação; links de coleções e banners navegam para consultas reais. Conta e favoritos estão ativos. Carrinho/compra, login social e recuperação de senha permanecem indisponíveis, sem mensagens fictícias de sucesso.

## Detalhe, conta e favoritos

`NftDetail` acrescenta galeria (`url`, `alt`), edições (`id`, `label`, `available`, `priceEth`), edição padrão, metadados, descrição completa e avaliações. Os quatro itens da galeria reutilizam a arte original do NFT, como nas miniaturas das referências fornecidas. Nenhuma imagem alternativa foi inventada. Relacionados vêm de um endpoint público. Avaliações são somente leitura, com dados determinísticos.

Edição e quantidade ficam na URL; trocar edição reinicia a quantidade. O estoque retornado pela API limita os controles, incluindo edição esgotada. Atualizações `nft.updated` preservam os campos adicionais no cache até a reconciliação REST. O total é calculado com `BigInt` e convertido para string decimal, sem `Number`. `PurchaseSelection` define o contrato de NFT/edição/quantidade para integrar o carrinho na próxima etapa; não cria pedidos.

Login/cadastro usam rotas públicas, modal desktop e tela mobile. Os schemas Zod são compartilhados com os handlers MSW. E-mail é normalizado; nome, senha e confirmação são validados. Erros 422 possuem `fieldErrors`; conflitos de e-mail retornam 409, credenciais incorretas retornam 400 e falhas transitórias retornam 503. Input e Tabs vêm dos registros oficiais shadcn/ui `new-york-v4`, com classes Tailwind adaptadas à interface.

O cliente envia a credencial opaca em `Authorization: Bearer`. O store MSW mantém sessões com expiração de 15 minutos, contas e favoritos em `kurio:accounts:v1`; o cliente guarda somente a credencial em `kurio:session-token`. Os hashes são PBKDF2-SHA256 com 100.000 iterações, salt individual e 256 bits. As respostas públicas de usuário contêm apenas `id`, `name` e `email`. É autenticação simulada no navegador, sem servidor privado externo.

A sessão é consultada por REST após refresh, reconexão/foco e a cada 15 segundos com aba ativa; um timer também respeita `expiresAt`. Em 401 da credencial atual, o cliente limpa a sessão, cancela/remove queries privadas e abre `/login?redirect=...&reason=expired`. A URL de retorno aceita somente caminhos internos e conserva filtros, edição e quantidade. Favoritar como visitante transporta o identificador e retoma um PUT após autenticar. Uma falha nessa retomada é informada sem afirmar que o favorito foi salvo.

Queries privadas usam `['private', userId, 'favorites']`. Logout e autenticação de outra conta cancelam/remove queries desse prefixo. Requisições privadas capturam a credencial de origem; callbacks verificam se ela ainda é atual antes de alterar o cache. Respostas 401 antigas não encerram uma sessão nova. Eventos `storage` reconciliam troca de sessão entre abas. O socket atual transporta somente catálogo público; não existem subscriptions privadas nesta etapa, e seus listeners continuam com cleanup de ciclo de vida.

A mutation de favorito cancela a consulta, captura o snapshot e atualiza otimisticamente o conjunto de identificadores. Em falha, restaura o snapshot; em sucesso, usa a resposta da API e invalida a consulta. PUT/DELETE operam com um conjunto no store e não duplicam favoritos. Não há retry automático de mutations nem de queries privadas/sessão. Após logout, a navegação substitui a rota atual pelo catálogo inicial, inclusive quando a saída parte de favoritos.

`session-expired`, `favorite-error`, `registration-conflict` e `auth-error` exercitam os fluxos privados. `POST /api/__mock/session/expire` invalida as sessões existentes; a próxima operação protegida/revalidação detecta isso. O reset integral restaura contas, favoritos iniciais, catálogo e cenário e remove a credencial do cliente; recarregue para renovar o cache em memória.

Foram adicionados cenários E2E para seleção/galeria, retorno após login, persistência, rollback, expiração, troca de usuário e cadastro/conflito. Nesta revisão, foram feitas conferências dirigidas no Vite e verificação de tipos; build, lint, suíte completa e Lighthouse não foram reexecutados. Baselines do detalhe e a auditoria final de início/detalhe continuam pendentes.

## Verificação e entrega

A CI verifica tipos, lint e build com npm 11 e 12, além de E2E em Chromium desktop/mobile. Playwright testa o build otimizado com contextos novos e MSW ativo, registra relatório HTML e retém traces de falhas. A suíte cobre catálogo, histórico, precisão, erros, eventos e foco, além das verificações da base; não representa os fluxos privados ainda pendentes. Baselines de início desktop/mobile estão versionadas por projeto e sistema (`win32`/`linux`), com dados/seleção de destaque estáveis e animações desativadas na captura. A tolerância de 3.000 pixels é mantida dentro do mesmo sistema, sem mascarar diferenças de métricas de fontes/controles entre plataformas. As capturas Linux foram extraídas do artefato da CI e conferidas visualmente antes de entrar como referência. Detalhes, carrinho e pagamento terão baselines quando seus layouts forem concluídos.

`scripts/lighthouse.mjs` usa o Chromium do Playwright, serve o build e executa três rodadas por página/perfil por padrão. Gera relatórios completos e medianas de Performance, Accessibility, Best Practices e SEO, além de LCP/CLS/TBT e ambiente. As metas devem ser verificadas novamente com todas as funcionalidades e layouts implementados.

Os diálogos são importados sob demanda; o foco retorna explicitamente ao acionador após fechar o módulo carregado. React DOM é importado após a ativação dos mocks, com chunk inicial pequeno, e as fontes principais são antecipadas no HTML. As otimizações valem para a aplicação publicada, sem modos especiais de auditoria.

A auditoria de início está em `reports/lighthouse/catalog/`, com três execuções por perfil. Performance mobile teve mediana 89, abaixo da meta 90, com LCP de 3,221 s e TBT de 246 ms. O caminho de inicialização dos mocks seguido da aplicação e o trabalho de JavaScript permanecem como oportunidades de otimização. A primeira execução apresentou TBT de 365 ms e está preservada nos relatórios. Desktop teve Performance 100; Accessibility, Best Practices e SEO foram 100 em ambos. O detalhe completo e os demais fluxos ainda precisam da auditoria final.

`vercel.json` configura deploy estático com acesso direto às rotas. A integração Git da Vercel está conectada e publica previews e produção; GitHub Actions verifica o código. A base foi validada publicamente em https://nft-marketplace-chi-five.vercel.app/. Novas etapas devem ser conferidas no preview e mescladas após a CI antes de atualizar essa produção.
