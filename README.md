# Kurio — NFT Marketplace

Solução para o [desafio frontend da Jungle](https://github.com/junglegaming/frontend-challenge).

## Etapa atual

Base técnica: React + TypeScript + Vite, TanStack Router e Query, Axios, Tailwind CSS, componentes shadcn/ui, MSW e Socket.IO. Uma seleção inicial de quatro NFTs e um detalhe simplificado validam a integração. O layout completo e os fluxos de conta, carrinho e compra ainda serão implementados.

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

Variáveis `VITE_*` são públicas e incorporadas ao build. Nunca coloque segredos nelas. Não há credenciais de demonstração nesta etapa: autenticação ainda não foi implementada.

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

Os cenários atuais são `default`, `slow` (1,8 s), `catalog-error` (HTTP 503) e `empty`. Eles e os dados do catálogo são persistidos na chave `kurio:mock:v1` do `localStorage`. O cache do Query é apenas em memória; após refresh, a interface consulta novamente a API simulada.

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

Cada teste recebe um contexto de navegador novo, com armazenamento isolado. Os testes usam o build otimizado, requisições REST interceptadas pelo MSW e o cliente Socket.IO real. As verificações atuais cobrem abertura, navegação, refresh do detalhe, 404, skeletons, falha e recuperação, resultado vazio, eventos novos/duplicados/antigos, persistência do catálogo, teclado e overflow em 390/768/1440 px.

Relatórios ficam em `playwright-report/`; screenshots e traces de falhas em `test-results/`. A CI publica essas pastas como artefato. Os fluxos completos do enunciado e os baselines de regressão visual ainda serão acrescentados.

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

**Status:** configuração de deploy preparada; nenhuma URL pública é declarada como validada nesta etapa.

Veja [ARCHITECTURE.md](./ARCHITECTURE.md) para contratos, responsabilidades e limitações atuais.
