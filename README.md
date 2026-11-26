# Kurio — NFT Marketplace

Solução para o [desafio frontend da Jungle](https://github.com/junglegaming/frontend-challenge).

## Visão geral

Catálogo responsivo com destaques, busca, filtros combináveis, ordenação e paginação na URL, com 36 NFTs simulados. A interface segue as referências desktop/mobile fornecidas, com barra lateral no desktop, painel de filtros acessível no mobile e navegação para o detalhe. React + TypeScript + Vite, TanStack Router/Query, Axios, Tailwind CSS, shadcn/ui, MSW e Socket.IO participam dos fluxos.

O detalhe possui galeria com ampliação, edições, quantidade limitada pelo estoque, informações, avaliações e itens relacionados, com versões desktop/mobile. Login, cadastro, sessão, logout e favoritos por usuário estão integrados à API simulada. O carrinho permite adicionar a seleção do detalhe, editar quantidades, remover itens, aplicar cupom e consultar valores atualizados pela API e pelo Socket.IO. Perfil, avatar, alteração de senha e carteiras principal/secundária também persistem pela API simulada. Pagamento e pedidos incluem conexão simulada da carteira, revisão, criação idempotente, estados pendente/confirmado/recusado, recuperação de falhas e recibo persistido.

A estilização usa classes Tailwind, incluindo estados e variantes responsivas. Button, Skeleton, Dialog, Slider, Input, Select e Tabs são componentes shadcn/ui locais adaptados ao visual do projeto. Os seletores compartilham menu escuro, destaque laranja, navegação por teclado e setas com espaço reservado. O CSS global mantém o tema, fontes, estilos de base e animações.

Aplicação de produção: [nft-marketplace-chi-five.vercel.app](https://nft-marketplace-chi-five.vercel.app/). A produção acompanha `main`; alterações em PR ficam no preview da Vercel até o merge.

## Explorar o catálogo

A URL guarda `q`, `collections`, `networks`, `minPrice`, `maxPrice`, `sort`, `tab` e `page`. Busca é enviada ao confirmar o formulário. Coleções e redes aceitam múltiplas escolhas (OU dentro do grupo, E entre os grupos). Preços são inclusivos; mudar um filtro, busca, aba ou ordenação reinicia a página. As contagens da barra lateral representam o catálogo completo.

Exemplo: `/?networks=ethereum&sort=price-asc&page=2`. Os parâmetros normalizados são enviados ao Axios e integram a chave do Query. Refresh, voltar/avançar e retorno do detalhe preservam a consulta. A API corrige páginas acima do limite e a URL é ajustada sem criar outra entrada no histórico.

## Executar localmente

Requisitos: Node.js **24.x** (versão de referência em `.node-version`) e npm.

```sh
npm ci
npm run dev:mocks
```

Abra <http://127.0.0.1:5173>. Os mocks são habilitados por padrão em desenvolvimento **e no build**, sem backend externo.

Não é necessário criar `.env` para iniciar. Para personalizar, copie `.env.example` para `.env.local`:

| Variável | Padrão | Uso |
| --- | --- | --- |
| `VITE_MOCKS_ENABLED` | `true` | Ativa a simulação; `false` exige uma API e servidor Socket.IO compatíveis |
| `VITE_API_URL` | `/api` | Base das chamadas REST |
| `VITE_SOCKET_URL` | origem da aplicação | Origem do Socket.IO, por exemplo `https://api.example.com` |

Variáveis `VITE_*` são públicas e incorporadas ao build. Nunca coloque segredos nelas.

## Contas de demonstração

| E-mail fictício | Senha | Favorito inicial |
| --- | --- | --- |
| `ana@kurio.demo` | `Kurio123!` | Sage Nomad |
| `bruno@kurio.demo` | `Kurio123!` | Golden Beat |

Também é possível criar uma conta em `/cadastro`. No desktop, login/cadastro abrem em modal sobre a página de retorno, preservando os filtros do catálogo ou a edição/quantidade do NFT; no mobile, ocupam a tela. Ao cancelar ou concluir, o retorno preserva a URL anterior. Favoritar sem sessão abre o login e retoma a inclusão após autenticar. O logout mantém a página pública atual e redireciona ao catálogo apenas ao sair de uma página privada, como Favoritos.

Cadastros novos ficam no navegador e na origem onde foram criados, em `localStorage`, e não têm expiração automática. Limpar os dados do site ou executar o reset remove essas contas; janelas anônimas descartam os dados ao encerrar. Outro navegador/dispositivo possui sua própria simulação. A validade de 24 horas se aplica à sessão de login.

`/favoritos` exige sessão. Conta e favoritos persistem após refresh; logout e troca de usuário removem o cache privado. Novas sessões duram 24 horas e são revalidadas pela API ao retomar a janela e a cada 15 segundos enquanto a aba está ativa. Sessões abertas antes dessa alteração conservam a validade original; saia e entre novamente para obter o novo prazo. Senhas ficam no store simulado como hashes PBKDF2-SHA256 com salt individual, nunca em claro.

## Explorar o carrinho

Para avaliar a compra completa, entre com uma conta de demonstração (ou crie a sua), salve uma carteira em `/carteiras` usando os exemplos abaixo e abra um NFT. Selecione edição/quantidade, adicione ao carrinho, experimente **KURIO10**, siga para o pagamento, escolha um provedor e confirme a revisão. A confirmação gera uma rota `/pedidos/:id` que pode ser recarregada. Os cenários de falha e os controles Socket.IO estão descritos nas seções seguintes.

No detalhe, selecione edição e quantidade e clique em **COMPRAR** (desktop) ou **Comprar NFT** (mobile) para adicionar e abrir `/carrinho`. No mobile, o botão com ícone de carrinho adiciona sem sair do detalhe. O ícone do header/navegação abre o carrinho e exibe a soma das quantidades.

O carrinho funciona para visitantes, persiste após refresh e é transferido para a conta ao entrar ou cadastrar. Itens da mesma edição são somados aos já salvos na conta; se a soma superar o estoque, o carrinho solicita ajuste sem descartar itens. Logout abre um carrinho anônimo vazio, mantendo o carrinho privado salvo para o próximo login. Outra conta não recebe os itens da conta anterior.

Use **KURIO10** para desconto de 10%, **EXPIRADO** para um cupom expirado ou outro código para erro de cupom inválido. O desconto é truncado na menor unidade de ETH (18 casas). A taxa simulada é `0.016 ETH` para carrinhos com itens e zero para carrinho vazio. Subtotal, desconto, taxa e total vêm da API; os exemplos do Figma usam dados diferentes, e o resumo acompanha os itens reais da simulação.

Eventos `nft.updated` reconsultam o carrinho e a cotação. Preço novo aparece no resumo; estoque insuficiente preserva a seleção e oferece **Ajustar quantidade**. Edições esgotadas precisam ser removidas. Quantidades válidas são rechecadas pelo handler nas inclusões/alterações, com HTTP 409 para conflito.

**Conectar e finalizar** abre o login do visitante com retorno ao carrinho. Após autenticar, o botão abre `/pagamento`, desde que os itens e a cotação estejam válidos.

Os cenários `cart-error`, `coupon-invalid` e `coupon-expired` exercitam falha transitória do carrinho e erros de cupom. Carrinhos, pedidos, conexões e baixas de estoque ficam em `kurio:commerce:v1`; carrinhos antigos de `kurio:carts:v1` são migrados automaticamente. O identificador anônimo continua em `kurio:cart-guest`. O reset integral limpa os carrinhos de visitantes e contas junto aos demais dados.

## Perfil e carteiras

O botão da conta abre diretamente `/perfil`; de lá, acesse **Carteiras** ou as demais seções disponíveis. `/perfil` e `/carteiras` exigem login e preservam a rota de retorno após autenticar. A navegação lateral do desktop vira uma faixa horizontal no mobile, com todas as opções e setas quando houver conteúdo fora da tela. O logout também tem o rótulo **Sair** no mobile. Seções ainda indisponíveis permanecem identificadas e sem ação.

No perfil, edite nome de exibição, nome de usuário, e-mail, nome ENS e apelido da carteira. **Alterar** seleciona um avatar PNG, JPEG ou WebP de até **512 KB**; **Remover** limpa a prévia. Clique em **Salvar** para confirmar dados/avatar. Para trocar a senha, preencha os três campos de senha antes de salvar. Se qualquer validação falhar, inclusive senha atual incorreta ou e-mail/nome de usuário em uso, a alteração inteira é recusada. A nova senha substitui a credencial de login e revoga outras sessões da conta; a sessão atual permanece aberta. Senhas nunca são persistidas em claro.

Em Carteiras, complete os campos do frame e clique em **Salvar carteira**. Após salvar, **Editar** reabre o formulário. A carteira secundária pode ser cadastrada separadamente ou usar **Igual à carteira principal**; nesse modo, alterações confirmadas na principal também atualizam a secundária. Desmarcar abre a edição independente, confirmada ao salvar.

Ao editar uma secundária existente, **Excluir carteira** remove seu cadastro pela API simulada (`DELETE /wallets/secondary`). A principal é preservada e não permite exclusão. Conexões da carteira removida deixam de ser válidas para novas compras; pedidos já enviados conservam seu snapshot. Se a exclusão falhar, os dados permanecem e é possível tentar novamente.

Ethereum/Polygon aceitam endereços `0x` com 40 dígitos hexadecimais, exceto o endereço zero. Solana exige Base58 que represente 32 bytes. Nome ENS usa um nome ASCII de 3 a 63 caracteres seguido de `.eth`; não existe resolução ENS ou conexão real com blockchain. No campo alternativo, ENS é aceito na Ethereum. Código de indicação é textual e obrigatório conforme o frame, sem integração externa.

Exemplos fictícios para demonstrar o formulário: rede Ethereum, endereço `0x1111111111111111111111111111111111111111`, tipo MetaMask, ENS `ana.eth` e código de indicação `KURIO`. Carteiras começam vazias e ficam separadas por conta. Dados de perfil/carteiras são adicionados ao store `kurio:accounts:v1`, mantendo compatibilidade com contas anteriores; o reset integral restaura tudo.

Use `profile-error` e `wallets-error` para falhas 503; `profile-conflict` força conflito de e-mail e `wallet-conflict` força conflito ao vincular carteira. `slow` e `session-expired` também se aplicam. Essas telas apenas cadastram dados que serão usados no pagamento; não simulam conexão ou compra concluída.

## Pagamento e pedidos

1. Adicione um NFT ao carrinho, entre na conta e cadastre pelo menos uma carteira em **Carteiras**. Os exemplos fictícios da seção anterior permitem preencher o cadastro.
2. No carrinho, clique em **Conectar e finalizar**. Em `/pagamento`, confira a carteira e escolha WalletConnect, MetaMask ou Coinbase Wallet. Sem uma escolha de provedor, **Confirmar compra** fica desabilitado.
3. No desktop, confira os dados do colecionador e a rede. **Usar outra carteira?** revela o seletor abaixo do formulário. No mobile, **Trocar carteira** alterna para a próxima carteira cadastrada; dados do colecionador vêm do perfil e da carteira, e o total aparece abaixo das três opções.
4. Clique em **Confirmar compra**: a conexão simulada é feita automaticamente antes da revisão, vinculada à sessão atual e válida por 30 minutos. Mudar de carteira/provedor encerra a conexão anterior. **Confirmar e enviar pedido** revalida a cotação no servidor simulado. Se preço, disponibilidade ou cupom mudar, revise e confirme novamente.
5. A rota `/pedidos/:id` acompanha o pedido. O cenário padrão confirma após aproximadamente 1,8 s; o recibo só aparece após confirmação da API. O recibo conserva os valores originais após alterações no catálogo. O explorador mostra a referência local simulada.

O rascunho e a identificação da tentativa são guardados por usuário. Depois de timeout ou falha transitória, **Recuperar pedido** consulta a tentativa e reaproveita a mesma chave caso seja necessário reenviar. Refresh e retorno após login recuperam o contexto. Pedidos de outra conta retornam 404. Uma recusa mantém os itens e permite iniciar outra tentativa; confirmar remove somente as quantidades compradas, preservando inclusões posteriores, baixa o estoque e publica `nft.updated`.

Não há integração com extensões, blockchain ou pagamentos reais. Os campos do colecionador usados no pagamento pertencem ao pedido e não alteram o perfil automaticamente. O mock compartilha disponibilidade entre as edições do mesmo NFT e também respeita os limites de cada edição; pedidos pendentes reservam as quantidades até seu resultado.

| Cenário MSW | Como reproduzir |
| --- | --- |
| `wallet-rejected` | Antes de clicar em Confirmar compra: a carteira recusa a conexão automática |
| `wallet-disconnected` | Depois de abrir a revisão, antes de enviar: o servidor exige nova conexão; volte a `default` e confirme novamente |
| `price-changed` / `edition-sold-out` | Depois de abrir a revisão: o envio altera preço/estoque e exige revisar o carrinho |
| `payment-declined` | Antes de enviar: o pedido termina recusado e preserva o carrinho |
| `order-timeout` | Antes de enviar: cria o pedido, mas atrasa a resposta além do timeout; use Recuperar pedido ou refresh |
| `order-error` | Antes de enviar: HTTP 503 sem criar pedido; volte a `default` e recupere a mesma tentativa |
| `order-pending` | Mantém pendente até um controle de conclusão explícito |
| `checkout-error` | Recarregue o pagamento para exibir falha 503; volte a `default` e tente novamente |

Para concluir um pedido mantido pendente, use seu id da URL: `await fetch('/api/__mock/orders/ID/settle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify('confirmed') })`. Troque por `declined` para recusa. Estados terminais não são alterados por repetições.

Para testar interrupção durante um pedido pendente, execute `await fetch('/api/__mock/orders-online', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(false) })`. Conclua o pedido pelo controle acima e envie `true` ao mesmo endpoint para reconectar: Socket.IO reconcilia o pedido pela REST, sem nova compra. Refresh também recupera o estado persistido.

## Comandos

| Comando | Resultado |
| --- | --- |
| `npm run dev` | Desenvolvimento (mocks ativos por padrão) |
| `npm run dev:mocks` | Desenvolvimento no modo de demonstração |
| `npm run typecheck` | Verifica os tipos da aplicação, configurações e testes |
| `npm run lint` | ESLint, sem warnings permitidos |
| `npm run build` | Verifica tipos e gera `dist/` |
| `npm run preview` | Serve o build em <http://127.0.0.1:4173> |
| `npm run test:e2e` | Gera o build e executa Playwright em Chromium desktop e mobile |
| `npm run test:e2e:ui` | Abre a interface do Playwright |
| `npm run test:e2e:production` | Confere os fluxos principais na URL pública, com dados isolados por navegador |
| `npm run test:e2e:report` | Abre o relatório HTML mais recente |
| `npm run audit:lighthouse` | Gera build e audita início e detalhe, mobile e desktop, três vezes por combinação |

## Cenários e reset

Os cenários atuais são `default`, `slow` (1,8 s), `out-of-order` (buscas com até três caracteres demoram 1,4 s; as demais, 80 ms, além da latência padrão), `network-error` (falha de conexão), `catalog-error` (HTTP 503) e `empty`. Eles e os dados do catálogo são persistidos na chave `kurio:mock:v2` do `localStorage`. A versão anterior do catálogo não é reutilizada após a mudança de schema. O cache do Query é apenas em memória; após refresh, a interface consulta novamente a API simulada.

Conta/favoritos acrescentam `favorite-error` (HTTP 503 com rollback), `registration-conflict` (HTTP 409), `auth-error` (HTTP 503) e `session-expired` (invalida a sessão na próxima consulta protegida). Contas, sessões e favoritos ficam em `kurio:accounts:v1`; a credencial opaca do cliente fica em `kurio:session-token`. O reset abaixo restaura também as duas contas, seus favoritos iniciais e o estado anônimo.

Para expirar as sessões existentes sem alterar outros dados, execute `await fetch('/api/__mock/session/expire', { method: 'POST' })`. A próxima operação protegida ou revalidação abre o login com o contexto anterior preservado.

Com a aplicação aberta, use o console do navegador para selecionar um cenário:

```js
await fetch('/api/__mock/scenario', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify('slow'),
})
location.reload()
```

Troque `slow` por qualquer cenário listado. Para restaurar fixtures e cenário padrão:

```js
await fetch('/api/__mock/reset', { method: 'POST' })
location.reload()
```

Esses controles pertencem aos handlers MSW. Não são endpoints de um backend real. `curl`, o contexto de requests do Playwright e chamadas feitas fora da página não passam pelo Service Worker do navegador.

Para atualizar preço e estoque via **Socket.IO** enquanto o detalhe estiver aberto:

```js
await fetch('/api/__mock/nfts/emerald-ape-042', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ priceEth: '2.15', available: 0 }),
})
```

O handler persiste os dados e publica `nft.updated` pelo binding Socket.IO. O cliente recebe o evento, atualiza o cache e anuncia a alteração para tecnologias assistivas. Não há chamadas diretas dos controles aos componentes ou ao Query.

## Testes

Instale o Chromium uma vez:

```sh
npx playwright install chromium
npm run test:e2e
```

No Linux/CI, use `npx playwright install --with-deps chromium`.

Cada teste recebe um contexto de navegador novo, com armazenamento isolado. Os testes usam o build otimizado, requisições REST interceptadas pelo MSW e o cliente Socket.IO real. As verificações cobrem filtros combinados, parâmetros da API, histórico, refresh, paginação, respostas obsoletas, precisão decimal, abertura do detalhe, 404, skeletons, falha e recuperação, resultado vazio, eventos novos/duplicados/antigos e recomposição da lista, persistência, teclado, foco dos diálogos, autenticação e favoritos. O carrinho acrescenta quantidades, remoção, edições separadas, conflitos de estoque, cupom inválido/expirado, transferência no login, isolamento de contas, atualização de preço/estoque e precisão de 18 casas. Os fluxos automatizados usam 390 e 1440 px; a conferência de layout inclui 320 e 768 px. A largura mínima suportada é 320 pixels CSS (`min-w-80`).

Os testes de pagamento cobrem compra até o recibo, baixa do estoque, snapshot imutável, validação, conexão/recusa/desconexão, cotação alterada, edição esgotada por Socket.IO, pagamento recusado, duplicação e conflito de idempotência, timeout/503 com recuperação, pedido pendente após reconexão/refresh, eventos antigos/duplicados, preservação de itens adicionados depois, expiração, isolamento entre contas e skeleton/falha recuperável.

Relatórios ficam em `playwright-report/`; screenshots e traces de falhas em `test-results/`. A CI publica essas pastas como artefato. As baselines de início, detalhe, avaliações, carrinho e pagamento desktop/mobile estão versionadas em `tests/e2e/__screenshots__/`, separadas por projeto e sistema (`win32` e `linux`), pois fontes e controles nativos podem alterar métricas e quebras de linha. As imagens Linux atuais foram capturadas no Chromium do Ubuntu/WSL com o build otimizado e conferidas visualmente. Para atualizar após uma alteração visual intencional, use `npm run test:e2e -- --grep composição --update-snapshots=all` no respectivo sistema e confira as imagens antes de versionar. A comparação mantém até 3.000 pixels divergentes dentro do mesmo sistema; dados/carrossel são estáveis e animações desativadas na captura. O detalhe possui captura da página completa e do painel de avaliações, com fontes e imagens carregadas antes da comparação.

A [conferência final](./reports/validation/README.md) registra **98/98 testes da suíte completa no Ubuntu/WSL** após a revisão de organização, além de **18/18 testes selecionados no Windows**, sem retries, incluindo todas as baselines. As imagens de referência e os cenários foram preservados. A regressão de carregamento/redimensionamento dos filtros faz parte desses 98 casos. Os 20 testes dos fluxos publicados permanecem registrados como evidência da `main` anterior ao merge deste PR.

## Lighthouse

```sh
npm run audit:lighthouse
```

O script inicia e encerra seu próprio preview na porta 4173; deixe essa porta livre. Ele gera relatórios HTML/JSON e um `summary.json` com medianas por categoria, LCP, CLS, TBT, versões e ambiente em `artifacts/lighthouse/`. O navegador é o Chromium instalado pelo Playwright. As fontes e imagens locais e os mocks são mantidos durante a medição.

Para verificar o comando com uma medição rápida:

```sh
npm run audit:lighthouse -- --runs=1 --profile=desktop --page=home
```

Uma medição rápida valida a infraestrutura, mas não substitui as três medições de cada página/perfil exigidas na entrega final.

A última auditoria completa está em [reports/lighthouse/final](./reports/lighthouse/final/README.md), com 12 medições e seus relatórios HTML/JSON, três por página/perfil, medianas, LCP/CLS/TBT, ferramentas e ambiente. O código funcional auditado é `e0805fe`, anterior à revisão final de organização dos componentes. Essa revisão não repete a auditoria nem declara novas pontuações.

| Página | Performance mobile | Performance desktop | Accessibility | Best Practices | SEO |
| --- | ---: | ---: | ---: | ---: | ---: |
| Início | 81 | 98 | 100 | 100 | 100 |
| Detalhe | 77 | 98 | 100 | 100 | 100 |

Accessibility, Best Practices e SEO tiveram 100 em ambos os perfis. **A meta de performance mobile (≥90) não foi atingida**: LCP próximo de quatro segundos e trabalho inicial de JavaScript/mocks são os limitadores observados. As causas, a variação entre execuções, os ajustes aplicados e as oportunidades restantes estão documentados no relatório, sem desativar funcionalidades, imagens ou fontes. A auditoria anterior somente do catálogo continua em [reports/lighthouse/catalog](./reports/lighthouse/catalog/README.md) como registro histórico.

A separação dos filtros reduziu o JavaScript inicial mobile em cerca de 103 kB no catálogo e 67 kB no detalhe, antes da compressão. A nota mobile permaneceu em 81 no início e variou de 79 para 77 no detalhe: essa rodada não demonstra ganho de pontuação. A comparação e o resumo anterior estão preservados no relatório.

## CI e deploy

GitHub Actions executa instalação pelo lockfile, tipos, lint, build e Playwright em PRs para `main` e pushes em `main`.

A instalação, os tipos, o lint e o build são verificados em Node 24.13.0/npm 11.6.2 e Node 24.15.0/npm 12.2.3. Essa matriz detecta diferenças na resolução de dependências opcionais entre versões do npm, incluindo os fallbacks WebAssembly do bundler. Após alterar dependências, mantenha o lockfile completo e confira as duas verificações antes de mesclar o PR.

Para publicar na Vercel:

1. Importe o repositório GitHub na sua conta Vercel.
2. Use o preset **Vite**, Node **24.x**, instalação `npm ci`, build `npm run build` e saída `dist`.
3. Mantenha `VITE_MOCKS_ENABLED=true` (também é o padrão).
4. Configure `main` como branch de produção; outras branches recebem previews.
5. Valide `/`, `/nfts/emerald-ape-042`, refresh do detalhe e um evento de preço na URL publicada.

`vercel.json` configura o fallback das rotas para `index.html` e evita cache persistente do script do Service Worker. O deploy ocorre pela integração Git da Vercel; a CI executa as verificações. O merge deve ocorrer após CI e preview validados.

**Status:** a integração Git publica `main` na URL pública e cada PR em um preview. `npm run test:e2e:production` valida os fluxos principais no deploy, com relatório em `artifacts/production-report/`. Para apontar para um preview, configure `PLAYWRIGHT_BASE_URL` com sua URL. Os mocks atuam no navegador e cada teste recebe armazenamento isolado. O merge desta revisão publica os últimos ajustes de acessibilidade e carregamento; repita esse comando após o deploy para conferir a correspondência final.

Veja [ARCHITECTURE.md](./ARCHITECTURE.md) para contratos, responsabilidades e limitações atuais.
