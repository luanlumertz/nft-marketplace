# Arquitetura

## Escopo atual

O início implementa a composição desktop/mobile das referências, com destaque selecionável, catálogo, busca, coleções, redes, faixa de preço, abas, ordenação, paginação, banners, seções editoriais e rodapé. Há 36 NFTs determinísticos, nove por página. O detalhe inclui galeria, ampliação, edições, quantidade, informações, avaliações e relacionados. Login, cadastro, sessão, logout, favoritos, carrinho, cotação, perfil, avatar, senha, carteiras, pagamento e pedidos são funcionais com MSW. O fechamento inclui auditoria de início/detalhe e baselines visuais das quatro telas exigidas; os resultados estão em `reports/lighthouse/final/`.

## Organização

```text
src/
  components/       layout, feedback e componentes shadcn/ui
  features/nfts/    contratos, queries, subscription e apresentação dos NFTs
  features/auth/    autenticação, sessão e formulários
  features/favorites/ favoritos por usuário, mutations e apresentação
  features/cart/    contratos, consultas, mutations e apresentação do carrinho
  features/account/ perfil, avatar, senha, carteiras e formulários compartilhados
  features/checkout/ conexão simulada, revisão, tentativa idempotente, eventos e recibo
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
| GET | `/api/cart` | `{ revision, items, quote }` do visitante ou usuário autenticado |
| POST | `/api/cart/items` | Recebe `{ nftId, editionId, quantity }`; soma à seleção existente e retorna carrinho (201) |
| PATCH | `/api/cart/items/:nftId/:editionId` | Recebe `{ quantity }`; substitui quantidade e retorna carrinho |
| DELETE | `/api/cart/items/:nftId/:editionId` | Remove a seleção e retorna carrinho; repetição não duplica efeitos |
| POST | `/api/cart/quote` | Recebe `{ code: string ou null }`; aplica/remove cupom e retorna carrinho com cotação |
| GET | `/api/profile` | Retorna o perfil do usuário autenticado; nunca retorna hash/salt |
| PATCH | `/api/profile` | Recebe dados do perfil, `avatarUrl` e `passwordChange` opcional; valida e salva atomicamente |
| GET | `/api/wallets` | `{ items: Wallet[] }` da conta autenticada, até uma por slot |
| PUT | `/api/wallets/:slot` | `primary` ou `secondary`; salva/edita campos ou espelha a principal com `{ sameAsPrimary: true }` |
| DELETE | `/api/wallets/secondary` | Remove a secundária e retorna `{ items: Wallet[] }`; excluir a principal retorna HTTP 405 |
| GET | `/api/checkout` | `{ connection: WalletConnection ou null }` da sessão atual |
| POST | `/api/wallet-connections` | `{ walletId, network, provider }`; conexão simulada da carteira cadastrada (201) |
| DELETE | `/api/wallet-connections/:id` | Desconecta a carteira da conta; HTTP 204 |
| POST | `/api/orders` | Header `Idempotency-Key` UUID e `{ quoteVersion, connectionId, collector }`; retorna `Order` (201) |
| GET | `/api/orders?attempt=UUID` | `{ order: Order ou null }` da tentativa da conta autenticada |
| GET | `/api/orders/:id` | Snapshot e estado do pedido; 404 para inexistente ou pertencente a outra conta |

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

O cenário de falha retorna HTTP 503 com `{ code: 'TRANSIENT_FAILURE', message: string }`; recursos ausentes retornam HTTP 404 com `NOT_FOUND`. Os controles rejeitam payloads inválidos com HTTP 422 e `VALIDATION_ERROR`. Contratos e códigos específicos estão documentados nas seções dos respectivos recursos.

`GET /api/nfts` aceita `q`, `collections` e `networks` (CSV), `minPrice`, `maxPrice`, `sort` (`recent`, `price-asc`, `price-desc`, `popular`), `tab` (`all`, `new`, `trending`) e `page`. Grupos de filtros são combinados por E; valores de um mesmo grupo, por OU. A busca ignora caixa e acentos. A ordenação é estável, com desempate pelo identificador. `facets` contém contagens globais e `featured` contém os destaques, separados dos resultados filtrados. `totalPages` é no mínimo 1; páginas excedentes são limitadas pela API.

Valores ETH são strings no transporte, schemas, cache e apresentação. A comparação para filtro e ordenação converte strings para unidades inteiras de 18 casas com `BigInt`, sem usar ponto flutuante. O parser de URL preserva os preços mesmo em links manuais sem aspas, evitando a conversão implícita de decimais pelo parser JSON do Router. `Number` só ajusta a posição visual dos sliders; inputs textuais, requisições e comparações mantêm até 18 casas. Na compra, valores finais dependem da cotação autoritativa da API.

## Cache e cancelamento

- Chaves atuais: `['nfts', 'list', searchNormalizado]` e `['nfts', 'detail', id]`.
- `staleTime`: 30 segundos; descarte de queries inativas após cinco minutos.
- Refetch ao recuperar conexão ou foco da janela, quando os dados estiverem obsoletos.
- Uma tentativa adicional para falhas transitórias HTTP 5xx/sem resposta; nenhuma para cancelamento, HTTP 4xx ou schema inválido.
- Mutations não possuem retry automático. Pedidos persistem uma chave de idempotência e seu conteúdo antes do envio; recuperação consulta a mesma tentativa antes de reenviar.
- O `AbortSignal` do Query chega ao Axios, permitindo cancelar requests de consultas que deixam de ser usadas.
- O cache não é persistido. O store do mock é persistido e a API é consultada após refresh.

O Router valida e normaliza todos os parâmetros. Arrays são deduplicados/ordenados e valores padrão são omitidos dos links. Busca/filtros/ordenação/aba reiniciam a página; só a API executa filtragem e paginação. Não há filtro de fixtures na interface. Novas consultas mostram skeleton; refetch da mesma consulta preserva o conteúdo e anuncia a atualização. Queries diferentes possuem chaves e sinais independentes, impedindo que uma resposta de uma busca anterior substitua a atual. As seleções e o rascunho de preço/busca são restaurados pelo histórico. O link do detalhe transporta a consulta para preservar o retorno.

Queries privadas incluem a identidade do usuário e são canceladas/removidas ao encerrar ou trocar a sessão. Capturam a credencial de origem; callbacks antigos não atualizam a sessão nova.

## Tempo real

O evento público do catálogo é:

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

A subscription pública é instalada no layout raiz e removida no cleanup, junto com a conexão. Ela acompanha os eventos do catálogo e invalida os carrinhos ativos para recalcular preços, disponibilidade e cotação pela REST autenticada. Na conexão/reconexão, catálogo e carrinho são reconciliados com a API. Pedidos usam uma conexão separada, autenticada e limitada à sessão, descrita abaixo.

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

Os controles de eventos mantêm REST coerente com a versão mais recente. Não importam setters, componentes ou QueryClient. Testes chamam esses endpoints de dentro da página para passar pelo MSW. Os controles específicos de pedidos estão documentados na seção de pagamento.

## Interface e assets

Layout, tipografia, cores, espaçamentos, estados e responsividade usam utilitários Tailwind nos componentes. `catalog.css` foi removido. Valores arbitrários preservam as medidas exatas da versão visual aprovada; as classes semânticas restantes servem como identificadores, sem regras CSS próprias. As variantes `mobile` (até 767 px), `tablet` (768–1199 px) e `tablet-compact` (768–1023 px) mantêm os intervalos anteriores. O CSS global concentra tema, fontes, estilos de base, shimmer e movimento reduzido.

O Tailwind procura classes somente em `src/`, por meio de `source(".")` em `src/styles.css`. Relatórios HTML de auditoria não participam da geração do CSS. A fonte base também é declarada explicitamente na raiz, e o teste visual verifica sua família e carregamento.

Os quatro PNGs originais enviados em `jungles.zip` estão em `public/nfts/`. Nenhuma imagem depende de host externo. Roboto Mono foi escolhida provisoriamente com base nas referências e é servida localmente via Fontsource; a família exata ainda precisa ser confirmada no Figma. Cores iniciais foram aproximadas pelas referências e o contraste do texto secundário foi reforçado.

Button e Skeleton foram gerados pelo CLI shadcn/ui 4.23.0, estilo `new-york`. Os imports de `cn` apontam para o utilitário local; Skeleton foi adaptado para shimmer com dimensões estáveis, e há respeito a `prefers-reduced-motion`. A CLI é usada sob demanda e não é dependência da aplicação.

Dialog e Slider em `src/components/ui/` foram adaptados dos registros oficiais shadcn/ui [dialog](https://ui.shadcn.com/r/styles/new-york-v4/dialog.json) e [slider](https://ui.shadcn.com/r/styles/new-york-v4/slider.json). Mantêm a fundação Radix, composição, atributos `data-slot`, props e `cn`, com classes Tailwind ajustadas para conservar o visual aprovado, sem os estilos ou animações padrão do registro. O catálogo consome esses componentes locais.

Existem link para pular ao conteúdo, landmarks, hierarquia de títulos, foco visível, alt nas imagens e mensagens acessíveis de carregamento/erro/atualização. Busca e painel de filtros usam Dialog do Radix (mesma fundação dos componentes shadcn/ui instalados), com portal, overlay, foco contido, Escape e retorno ao acionador. A faixa de preço usa Slider do Radix com dois controles na mesma barra, arraste, teclado e valores sincronizados nos inputs; a consulta só muda ao aplicar. Inputs de preço possuem labels e erro associado; abas suportam setas, Home e End. Skeletons conservam a geometria da grade e respeitam movimento reduzido.

O acesso direto ao Figma não foi liberado pela integração; foram usadas as imagens desktop/mobile fornecidas pelo usuário. O mobile usa destaque compacto, grade alinhada por linhas, navegação inferior e filtros em painel; tablet mantém a grade sem sidebar. A revisão solicitada pelo usuário remove a imagem secundária do destaque mobile, separa texto e arte em colunas, destaca o indicador ativo e arredonda/engrossa a moldura dos cards. Os ícones sociais vêm do Font Awesome 6 via React Icons, com espaçamento uniforme; as carteiras usam distribuição horizontal. Contagens, ordem dos itens e preços vêm da API e podem diferir dos números ilustrativos dos frames. Mantém-se a mesma ordenação nos diferentes viewports. Os campos exatos de preço e áreas de toque de 24 px nos indicadores são ajustes de acessibilidade. A família tipográfica permanece a aproximação local já documentada.

“Limpar filtros” aparece somente com busca, coleções, redes, faixa de preço ou aba restritiva ativos. Ordenação e paginação isoladas não ativam esse botão. O item Mercado do header aponta para `/#catalogo`; não existe uma rota própria para Mercado nesta etapa.

Conteúdo editorial e newsletter são somente apresentação; links de coleções e banners navegam para consultas reais. Conta, favoritos, carrinho, pagamento e pedidos estão ativos. Login social e recuperação de senha permanecem indisponíveis, sem mensagens fictícias de sucesso.

O catálogo mobile também apresenta os banners de coleções e o Diário da Cunhagem após a paginação. Os banners usam imagem e texto lado a lado; os cards editoriais usam duas colunas com título e metadados, omitindo o parágrafo de descrição para reduzir texto. O mesmo `SiteFooter` oferece no início mobile uma versão compacta com atalhos funcionais, coleções em disclosure nativo acessível, carteiras compatíveis e copyright. Blocos de benefícios, newsletter, contatos ilustrativos e links auxiliares ficam na versão desktop. O rodapé compacto reserva espaço para a navegação fixa. Estas extensões mobile foram autorizadas além do trecho disponível no frame original.

## Detalhe, conta e favoritos

`NftDetail` acrescenta galeria (`url`, `alt`), edições (`id`, `label`, `available`, `priceEth`), edição padrão, metadados, descrição completa e avaliações. Os quatro itens da galeria reutilizam a arte original do NFT, como nas miniaturas das referências fornecidas. Nenhuma imagem alternativa foi inventada. Relacionados vêm de um endpoint público. Avaliações são somente leitura, com dados determinísticos.

Edição e quantidade ficam na URL; trocar edição reinicia a quantidade. O estoque retornado pela API limita os controles, incluindo edição esgotada. Atualizações `nft.updated` preservam os campos adicionais no cache até a reconciliação REST. O total é calculado com `BigInt` e convertido para string decimal, sem `Number`. `PurchaseSelection` define o contrato de NFT/edição/quantidade enviado ao carrinho. Comprar adiciona essa seleção e abre o carrinho; o ícone de adicionar no mobile mantém o detalhe aberto. Nenhuma dessas ações cria pedidos.

Login/cadastro usam rotas públicas, modal desktop e tela mobile. Os schemas Zod são compartilhados com os handlers MSW. E-mail é normalizado; nome, senha e confirmação são validados. Erros 422 possuem `fieldErrors`; conflitos de e-mail retornam 409, credenciais incorretas retornam 400 e falhas transitórias retornam 503. Input e Tabs vêm dos registros oficiais shadcn/ui `new-york-v4`, com classes Tailwind adaptadas à interface.

O cliente envia a credencial opaca em `Authorization: Bearer`. O store MSW mantém sessões com expiração de 24 horas para novas sessões, contas e favoritos em `kurio:accounts:v1`; o cliente guarda somente a credencial em `kurio:session-token`. Os hashes são PBKDF2-SHA256 com 100.000 iterações, salt individual e 256 bits. As respostas públicas de usuário contêm apenas `id`, `name` e `email`. É autenticação simulada no navegador, sem servidor privado externo.

A sessão é consultada por REST após refresh, reconexão/foco e a cada 15 segundos com aba ativa; um timer também respeita `expiresAt`. Em 401 da credencial atual, o cliente limpa a sessão, cancela/remove queries privadas e abre `/login?redirect=...&reason=expired`. A URL de retorno aceita somente caminhos internos e conserva filtros, edição e quantidade. Favoritar como visitante transporta o identificador e retoma um PUT após autenticar. Uma falha nessa retomada é informada sem afirmar que o favorito foi salvo.

Queries de favoritos usam `['private', userId, 'favorites']`. Logout e autenticação de outra conta cancelam/remove queries do prefixo privado do usuário. Requisições privadas capturam a credencial de origem; callbacks verificam se ela ainda é atual antes de alterar o cache. Respostas 401 antigas não encerram uma sessão nova. Eventos `storage` reconciliam troca de sessão entre abas. O canal público do catálogo e o canal autenticado de pedidos têm cleanup independente de listeners e conexões.

A mutation de favorito cancela a consulta, captura o snapshot e atualiza otimisticamente o conjunto de identificadores. Em falha, restaura o snapshot; em sucesso, usa a resposta da API e invalida a consulta. PUT/DELETE operam com um conjunto no store e não duplicam favoritos. Não há retry automático de mutations nem de queries privadas/sessão. Após logout, rotas marcadas com `staticData.requiresAuth`, como Favoritos, são substituídas pelo catálogo inicial; páginas públicas mantêm a URL e a seleção atual. No desktop, o fundo do modal de autenticação reproduz a página de retorno. O catálogo recebe os filtros por contexto e não normaliza a URL de paginação enquanto serve de fundo.

`session-expired`, `favorite-error`, `registration-conflict` e `auth-error` exercitam os fluxos privados. `POST /api/__mock/session/expire` invalida as sessões existentes; a próxima operação protegida/revalidação detecta isso. O reset integral restaura contas, favoritos iniciais, catálogo e cenário e remove a credencial do cliente; recarregue para renovar o cache em memória.

Os cenários E2E de conta cobrem seleção/galeria, retorno após login, persistência, rollback, expiração, troca de usuário e cadastro/conflito. O teste de expiração controla o relógio do Playwright para disparar a revalidação periódica, sem disputar cliques com o redirecionamento. Baselines do detalhe e a auditoria final de início/detalhe continuam pendentes.

## Carrinho e cotação

`GET /cart` retorna os itens e o resumo autoritativo juntos. Cada item contém `nftId`, `editionId`, `quantity`, nome, imagem, token, rótulo da edição, `unitPriceEth`, `totalEth`, `available`, `nftVersion` e `issue` (`sold-out`, `insufficient` ou null). A identidade da linha é NFT + edição. POST soma quantidades, PATCH substitui e DELETE remove; inclusões/alterações validam inteiros de 1 a 999 e consultam a disponibilidade atual. Erros de seleção retornam 422, recurso inexistente 404 e estoque insuficiente 409, sem aplicar a alteração.

O store MSW persiste seleções, cupom e revisão em `kurio:commerce:v1`, junto aos pedidos, conexões e baixas de estoque. Carrinhos antigos de `kurio:carts:v1` são migrados automaticamente ao reidratar. Os campos derivados vêm do mesmo catálogo e das mesmas edições do detalhe. `quote` contém `version`, `subtotalEth`, `discountEth`, `networkFeeEth`, `totalEth`, cupom/validade e `canCheckout`. A versão combina a revisão do carrinho, versões dos NFTs e validade do cupom; o handler de pedidos revalida esse snapshot antes de aceitar uma compra.

Todo valor monetário permanece string decimal. O handler converte para unidades inteiras de 18 casas com `BigInt`, soma os totais das linhas, aplica KURIO10 (10%, truncado na menor unidade) e soma a taxa simulada de `0.016 ETH` para carrinho não vazio. EXPIRADO retorna 422/COUPON_EXPIRED; outros códigos retornam 422/COUPON_INVALID. POST `/cart/quote` com `code: null` remove o cupom. Código inválido/expirado não substitui o cupom salvo. GET recalcula os valores e indica se um cupom previamente aplicado deixou de ser válido.

Visitantes usam um UUID opaco em `X-Cart-Guest`, guardado em `kurio:cart-guest`. O servidor simulado resolve o proprietário pela sessão quando há Bearer; uma credencial inválida retorna 401, sem consultar o carrinho anônimo como fallback. Login/cadastro mesclam o carrinho desse visitante no carrinho da conta, somam linhas iguais e apagam a origem na mesma operação síncrona antes de responder. Estoque insuficiente após a mesclagem aparece como conflito na cotação; itens não são descartados silenciosamente. Logout preserva o carrinho privado persistido e apresenta um carrinho anônimo vazio.

Queries usam `['cart-guest', guestId]` para visitantes e `['private', userId, 'cart']` para contas. A credencial e a chave são capturadas por operação; respostas de uma sessão anterior não atualizam o cache atual. Login/logout e troca de conta cancelam/removem cache privado e anônimo para evitar mostrar seleções anteriores à transferência. Mutations não têm retry automático: cancelam consultas anteriores, aplicam o snapshot retornado pela REST e invalidam a mesma chave. Falhas não removem seleções. Novas consultas exibem skeletons; refetch preserva os valores, informa atualização por `aria-busy` e mantém a continuação desabilitada até obter dados válidos.

`nft.updated` aceito pelo controle de versões invalida a cotação pela REST; a reconexão também reconcilia o carrinho. Quantidades acima do estoque são mantidas com aviso e ação de ajuste; estoque zero exige remoção. A versão da cotação muda com o catálogo. O resumo não é recalculado em componentes nem por setters acionados pelos mocks. `cart-error`, `coupon-invalid` e `coupon-expired` completam os cenários determinísticos; o reset integral limpa todos os carrinhos.

Desktop usa tabela visual e resumo lateral; mobile usa cards e resumo abaixo, adaptados às imagens fornecidas, com Tailwind e componentes shadcn/ui. Rótulos de edição e remoção explícita complementam a referência para distinguir linhas e permitir remover qualquer item. Os totais seguem as respostas da API, inclusive quando diferem dos números ilustrativos do Figma. “Conectar e finalizar” abre o login do visitante e preserva o carrinho ao retornar; após autenticar, abre o pagamento quando a cotação está válida.

## Perfil e carteiras

As rotas `/perfil` e `/carteiras` usam `requiresAuth` e o guard REST compartilhado `requireSession`. O menu da conta abre as duas telas; logout usa o mesmo hook no menu e na navegação lateral. O modal de login preserva essas páginas como fundo sem consultar dados privados anônimos. Desktop segue os frames fornecidos, incluindo sidebar, duas colunas, avatar e senha; mobile usa abas e formulários de uma coluna. O footer é omitido nessas telas conforme os frames. Campos e erros usam `AccountField` sobre o Input shadcn/ui; ações usam Button shadcn/ui e classes Tailwind.

Queries de perfil e carteiras usam `['private', userId, 'profile']` e `['private', userId, 'wallets']`, com `retry: false`, cancelamento via Axios e credencial capturada. Mutations capturam credencial/proprietário; respostas antigas não preenchem o cache de outra sessão. Salvar perfil cancela snapshots de sessão anteriores, atualiza nome/e-mail na sessão e invalida o perfil. Carteiras atualizam e invalidam a chave da conta, com bloqueio de mutations simultâneas no formulário. Os formulários mantêm o rascunho local separado do snapshot do Query durante edição. Senhas ficam apenas em memória e nunca integram o DTO persistido.

O store `kurio:accounts:v1` ganhou mapas de perfis/carteiras com defaults compatíveis com dados anteriores. O perfil contém id, nome, username, e-mail, ENS, apelido da carteira e avatar. PATCH aceita esses campos e `passwordChange: { currentPassword, newPassword, confirmPassword }` opcional. Validações de campos são compartilhadas com MSW; e-mail e username duplicados retornam 409 com `fieldErrors`. Senha atual incorreta retorna 422. A derivação PBKDF2 usa salt novo e é seguida de nova checagem da sessão, hash anterior e unicidade antes do commit. Nome/e-mail da conta, perfil e senha são confirmados juntos. Outras sessões dessa conta são revogadas quando a senha muda. Gravações novas substituem o estado em memória somente depois de confirmar a persistência; falta de espaço retorna 503.

Avatar é um data URL de PNG/JPEG/WebP com até 512 KB decodificados. O cliente verifica MIME, tamanho e decodificação da imagem; o schema verifica tamanho e assinatura do formato. A prévia e a remoção só são persistidas ao salvar o perfil. Não são aceitos SVGs, URLs externas nem senhas em campos extras: o schema projeta apenas os atributos permitidos. Não há upload para serviço externo.

Wallet contém id estável, slot, nome de exibição, apelido, rede, nome do perfil, endereço, endereço alternativo, tipo, código de indicação, e-mail, ENS e `sameAsPrimary`. Todos os recursos são resolvidos pela sessão; não há userId selecionável no endpoint. PUT mantém o id ao editar e salva uma carteira por slot. Endereços são validados por formato da rede (EVM hexadecimal não zero ou Solana Base58/32 bytes). ENS é validado como texto `.eth`, sem resolução onchain. Campos de referência seguem o layout e não fazem integração externa. A secundária espelhada é uma cópia persistida da principal e acompanha alterações posteriores desta no mesmo commit. Desmarcar abre edição independente; a alteração é aplicada em Salvar carteira.

As operações usam a conta da sessão: credenciais inválidas retornam 401, slots inexistentes 404, validações 422 e conflitos determinísticos 409. `profile-error`, `wallets-error`, `profile-conflict` e `wallet-conflict` completam os cenários. O reset integral também restaura perfis e carteiras. Os novos E2E cobrem acesso privado, validações, conflito, persistência, avatar, senha atômica, credenciais novas/antigas, carteiras por rede, espelhamento, edição independente, recuperação de falhas, isolamento por conta e expiração com retorno.

## Pagamento e pedidos

`/pagamento` e `/pedidos/:orderId` usam o mesmo guard REST e `requiresAuth` das páginas da conta. Checkout reutiliza perfil, carteiras, `AccountField`, Button e Dialog shadcn/ui e a query do carrinho. Desktop usa formulário e resumo em duas colunas; **Usar outra carteira?**, entre os campos e a observação, revela o seletor ao lado. Mobile mostra carteiras, **Trocar carteira** (próxima da lista), três provedores, total e um único botão no rodapé. Não há seções extras de dados/resumo nem etapa visual de conexão. A escolha começa vazia e bloqueia a confirmação; a conexão ocorre automaticamente ao confirmar, antes da revisão em Dialog. Recibo ocupa uma página isolada: separadores verticais dos metadados só no desktop, labels de taxa/total na coluna central, sem linha entre eles nem identificação redundante ao final. Mobile mantém metadados em duas colunas e quantidades legíveis. O ícone de carta usa `MailOpen` do Lucide: não foi fornecido um asset separado do envelope “Thank you”. Imagens dos NFTs e demais componentes são locais e reaproveitados.

Conexões recebem `{ walletId, network, provider }`. O handler resolve a carteira pelo usuário autenticado, exige a rede cadastrada e retorna `{ id, walletId, network, provider, address, expiresAt }`. A conexão fica vinculada à credencial atual, por 30 minutos, e é revalidada ao criar pedido; conexão ausente, expirada, de outra sessão ou carteira alterada retorna 409. Recusa simulada retorna 422. A escolha de provedor é simulada; não acessa extensões nem resolve ENS. Desconexão usa DELETE e novas conexões substituem a conexão anterior da mesma sessão.

O cliente valida nome, username, nome do perfil, e-mail, ENS, código de indicação, endereço secundário e limite da observação. O endereço principal vem da carteira cadastrada. No mobile, os campos removidos da interface usam os dados válidos atuais de perfil/carteira, sem bloquear a compra por um rascunho antigo oculto. Rascunhos ficam em `kurio:checkout:<userId>` e a tentativa em `kurio:attempt:<userId>`, sem credenciais/senhas. `providerSelected` distingue uma escolha explícita dos defaults da versão anterior; um provedor pré-selecionado automaticamente no código antigo não habilita o botão novo. O rascunho não altera o perfil automaticamente. Antes do POST, a tentativa é persistida como `{ key, input }`; falha nessa persistência impede envio. O conteúdo inclui somente `quoteVersion`, `connectionId` e `collector`: valores e itens são reconstruídos pela API, nunca aceitos do cliente.

POST `/orders` exige `Idempotency-Key` UUID. A mesma chave/conteúdo, no escopo do usuário, devolve o mesmo pedido inclusive após conclusão; conteúdo diferente retorna 409 `IDEMPOTENCY_CONFLICT`. A identidade de um pedido não depende de consulta ao carrinho depois de criado. Antes da criação, a API verifica a sessão novamente, conexão, endereço secundário, cupom, disponibilidade, reservas pendentes e a versão da cotação. Mudança retorna 409 `QUOTE_CHANGED`/`CART_CONFLICT`; o cliente descarta a tentativa não aceita, atualiza a cotação e exige nova revisão. O botão bloqueia envios simultâneos também por uma referência síncrona, antes do próximo render.

`Order` contém id, dono, chave, versão, estado, datas, motivo, referência de transação e snapshots do colecionador/carteira/carrinho. O pedido começa `pending`; cenário e instante de conclusão são persistidos. O padrão confirma após 1,8 s e `payment-declined` recusa; `order-pending` exige controle explícito. Timers aceleram o feedback, mas GET reconcilia prazos persistidos após refresh e não depende do timer anterior. Confirmado e recusado são terminais. Somente `confirmed` apresenta recibo; `pending` e `declined` têm telas próprias e ações de recuperação.

`commerce.change` clona e grava um único estado antes de substituir a memória. A conclusão confirma o pedido, gera a referência, baixa estoque por NFT/edição e subtrai apenas as quantidades compradas do carrinho no mesmo commit. Itens novos, outras edições e quantidades extras permanecem. O catálogo compartilha um estoque total por NFT e limites por edição; reservas são derivadas dos pedidos pendentes e recusas liberam essas quantidades. As baixas persistidas acrescentam versões monotônicas aos NFTs; eventos `nft.updated` sincronizam catálogo, detalhe e demais carrinhos. O recibo lê o snapshot persistido, sem recotar nem consultar preços atuais.

Queries usam `['private', userId, 'checkout']` e `['private', userId, 'orders', 'detail'|'attempt', id]`, sem retry automático. Headers e callbacks capturam a credencial de origem. POST do pedido tem timeout de 4,5 s; `order-timeout` cria e atrasa sua resposta 6,5 s. Não se afirma recusa num erro de transporte: Recuperar pedido consulta GET por chave e só reenvia, com chave e conteúdo originais, se a API não encontrar pedido. Refresh e retorno após autenticar consultam a tentativa persistida. Uma resposta antiga não navega nem atualiza outra sessão.

`useOrderEvents` usa `socket.io-client` e o binding MSW no mesmo transporte público já documentado. `orders.subscribe` envia a credencial opaca; o servidor verifica a sessão e só publica `order.updated` ao dono. O evento contém `{ eventId, resourceId, userId, version, status }`. O cliente valida o contrato, dono e versão, ignora versões repetidas/antigas e invalida queries; o snapshot autorizado e terminal vem da REST. Reconexão invalida pedidos e carrinho. Cleanup encerra conexão e listeners na saída ou troca da sessão. A conexão pública do catálogo permanece independente. O transporte usa eventos Engine.IO/Socket.IO reais interceptados pelo MSW, sem setters diretos na UI.

Os controles `__mock/orders/:id/settle`, `__mock/order-events` e `__mock/orders-online` permitem finalizar pedidos, reenviar eventos antigos/duplicados e interromper apenas o canal privado. `__mock/state` informa `orderSubscribers`. Reset limpa timers e todo o estado de comércio. Os mocks vivem no navegador, sem servidor compartilhado entre dispositivos; reidratação após reload usa o estado local persistido. Não há processamento financeiro, RPC, explorer externo nem garantias de um backend real.

## Verificação e entrega

A CI verifica tipos, lint e build com npm 11 e 12, além de E2E em Chromium desktop/mobile. Playwright testa o build otimizado com contextos novos e MSW ativo, registra relatório HTML e retém traces de falhas. A suíte cobre catálogo, histórico, precisão, erros, eventos, foco, autenticação, favoritos, carrinho, perfil, avatar, senha, carteiras e compra. Os cenários de pagamento cobrem recibo imutável e baixa de estoque, conexão/recusa/desconexão, revisão de cotação alterada, edição esgotada via Socket.IO, pagamento recusado, clique repetido, conflito de idempotência, timeout/503 com recuperação, reconexão de pedido pendente, eventos antigos/duplicados, quantidades adicionadas depois da compra, expiração, isolamento entre contas, skeleton e falha recuperável.

Baselines de início, detalhe, avaliações, carrinho e pagamento desktop/mobile são separadas por projeto e sistema (`win32`/`linux`), com dados estáveis e animações desativadas na captura. A tolerância de 3.000 pixels é mantida dentro do mesmo sistema, sem mascarar diferenças de métricas de fontes/controles entre plataformas. As capturas Linux atuais usam Chromium no Ubuntu/WSL com o build otimizado. O detalhe também captura o painel de avaliações. Fontes e imagens são aguardadas antes das capturas.

No fechamento, passaram 96 testes da suite completa no Ubuntu/WSL e 16 testes visuais/de navegação no Windows, em Chromium desktop/mobile, sem retries. Os 20 testes dos fluxos principais na Vercel também passaram. Tipos, lint e build passaram. Evidências, escopo e comandos reproduzíveis estão em [reports/validation](./reports/validation/README.md).

`scripts/lighthouse.mjs` usa o Chromium do Playwright, serve o build e executa três rodadas por página/perfil por padrão. Gera relatórios completos e medianas de Performance, Accessibility, Best Practices e SEO, além de LCP/CLS/TBT e ambiente. Os resultados finais usam todas as funcionalidades e os layouts implementados e ficam registrados abaixo.

Os diálogos são importados sob demanda; o foco retorna explicitamente ao acionador após fechar o módulo carregado. React DOM é importado após a ativação dos mocks, com chunk inicial pequeno, e as fontes principais são antecipadas no HTML. As otimizações valem para a aplicação publicada, sem modos especiais de auditoria.

A auditoria de início está em `reports/lighthouse/catalog/`, com três execuções por perfil. Performance mobile teve mediana 89, abaixo da meta 90, com LCP de 3,221 s e TBT de 246 ms. O caminho de inicialização dos mocks seguido da aplicação e o trabalho de JavaScript permanecem como oportunidades de otimização. A primeira execução apresentou TBT de 365 ms e está preservada nos relatórios. Desktop teve Performance 100; Accessibility, Best Practices e SEO foram 100 em ambos. Os relatórios de início/detalhe da entrega completa estão em `reports/lighthouse/final/`.

`vercel.json` configura deploy estático com acesso direto às rotas. A integração Git da Vercel está conectada e publica previews e produção; GitHub Actions verifica o código. A base foi validada publicamente em https://nft-marketplace-chi-five.vercel.app/. Novas etapas devem ser conferidas no preview e mescladas após a CI antes de atualizar essa produção.

## Ajustes finais de interface e carregamento

A grade mobile foi alinhada por linhas a pedido do usuário, e os indicadores compartilhados usam círculo preenchido maior no ativo e contorno nos demais. A navegação mobile usa um recorte SVG menor com junções curvas; o círculo central conserva o desenho aprovado. São ajustes autorizados em relação às referências.

O botão da conta abre diretamente /perfil; as seções ficam no AccountShell, com Sair identificado no mobile. SelectControl compartilha tema, setas e interação Radix nos formulários, catálogo e pagamento. Excluir a secundária preserva a principal e os snapshots de pedidos; GET /checkout deixa de retornar conexões cuja carteira não existe ou mudou de endereço/rede. A mutation invalida carteiras e checkout da conta.

O skeleton do detalhe reserva a altura aproximada dos blocos de informações e recomendações do desktop, mantendo o rodapé fora da região inicial durante a consulta. As fontes 400/500/600/700 são antecipadas e os quatro primeiros cards carregam as artes sem lazy loading; os demais continuam sob demanda. Links sociais indisponíveis possuem papel semântico válido, e os controles de compartilhar têm área de toque mínima de 24 px.

## Auditoria final

Os 12 relatórios HTML/JSON de início/detalhe, com três execuções por perfil e ambiente completo, estão em [reports/lighthouse/final](./reports/lighthouse/final/README.md). Performance desktop teve mediana 98 nas duas páginas; mobile ficou em 81 no início e 79 no detalhe. Accessibility, Best Practices e SEO tiveram 100 em todas as combinações. CLS foi zero no detalhe e no início mobile, e ~0,000003 no início desktop.

A meta de performance mobile ≥90 permanece não atingida. LCP ~4 s, tarefas longas e trabalho de bootstrap/contratos/renderização limitam as medições. O MSW instala os interceptors antes do cliente Socket.IO; preservar essa ordem mantém os eventos simulados funcionais. Preloads adicionais de imagens e módulos foram testados e retirados por competição de banda. Os relatórios mantêm todas as medições e justificam os valores abaixo da meta, conforme solicitado pelo desafio.
