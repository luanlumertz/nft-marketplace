# Kurio — NFT Marketplace

Solução para o [desafio frontend da Jungle](https://github.com/junglegaming/frontend-challenge).

## Etapa atual

Catálogo responsivo com destaques, busca, filtros combináveis, ordenação e paginação na URL, com 36 NFTs simulados. A interface segue as referências desktop/mobile fornecidas, com barra lateral no desktop, painel de filtros acessível no mobile e navegação para o detalhe. React + TypeScript + Vite, TanStack Router/Query, Axios, Tailwind CSS, shadcn/ui, MSW e Socket.IO participam dos fluxos.

O detalhe possui galeria com ampliação, edições, quantidade limitada pelo estoque, informações, avaliações e itens relacionados, com versões desktop/mobile. Login, cadastro, sessão, logout e favoritos por usuário estão integrados à API simulada. Carrinho, compra, perfil e carteiras continuam para as próximas etapas; suas ações permanecem indisponíveis.

A estilização usa classes Tailwind, incluindo estados e variantes responsivas. Button, Skeleton, Dialog, Slider, Input e Tabs são componentes shadcn/ui locais adaptados ao visual do projeto. O CSS global mantém o tema, fontes, estilos de base e animações.

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

`/favoritos` exige sessão. Conta e favoritos persistem após refresh; logout e troca de usuário removem o cache privado. A sessão dura 15 minutos e é revalidada pela API ao retomar a janela e a cada 15 segundos enquanto a aba está ativa. Senhas ficam no store simulado como hashes PBKDF2-SHA256 com salt individual, nunca em claro.

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

Cada teste recebe um contexto de navegador novo, com armazenamento isolado. Os testes usam o build otimizado, requisições REST interceptadas pelo MSW e o cliente Socket.IO real. As verificações cobrem filtros combinados, parâmetros da API, histórico, refresh, paginação, respostas obsoletas, precisão decimal, abertura do detalhe, 404, skeletons, falha e recuperação, resultado vazio, eventos novos/duplicados/antigos e recomposição da lista, persistência, teclado, foco dos diálogos e overflow em 390/768/1440 px.

Relatórios ficam em `playwright-report/`; screenshots e traces de falhas em `test-results/`. A CI publica essas pastas como artefato. As baselines de início desktop/mobile estão versionadas em `tests/e2e/__screenshots__/`, separadas por projeto e sistema (`win32` e `linux`), pois fontes e controles nativos podem alterar métricas e quebras de linha. As imagens Linux foram obtidas e conferidas a partir do artefato da CI. Para atualizar após uma alteração visual intencional, use `npm run test:e2e -- --grep composição --update-snapshots=all` no respectivo sistema e confira as imagens antes de versionar. A comparação mantém até 3.000 pixels divergentes dentro do mesmo sistema; relógio/dados/carrossel são estáveis e animações desativadas na captura. As outras telas e os fluxos restantes terão cobertura nas próximas etapas.

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

A auditoria do início desta etapa está versionada em [reports/lighthouse/catalog](./reports/lighthouse/catalog/README.md), com três execuções por perfil e relatórios HTML/JSON. Medianas: Performance **89 mobile / 100 desktop**; Accessibility, Best Practices e SEO **100** em ambos. A meta de performance mobile ainda não foi atingida; as causas observadas, a variabilidade e as otimizações aplicadas estão documentadas no relatório. A auditoria do detalhe completo permanece para a respectiva etapa.

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

**Status:** integração Vercel conectada e base validada na URL pública. O catálogo desta etapa deve ser conferido no preview do PR antes de atualizar a produção.

Veja [ARCHITECTURE.md](./ARCHITECTURE.md) para contratos, responsabilidades e limitações atuais.
