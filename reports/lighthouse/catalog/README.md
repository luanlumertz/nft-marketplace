# Lighthouse — início do catálogo

Medições de 25/11/2026, código funcional do commit `12052e0`. Build otimizado, cenário padrão MSW, imagens/fontes locais e funcionalidades habilitadas. São três execuções sequenciais por perfil, com as configurações padrão mobile e desktop do Lighthouse. Ambiente, ferramentas e todas as execuções estão em [summary.json](./summary.json); os relatórios HTML e JSON individuais estão nesta pasta.

| Perfil | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mobile | 89 | 100 | 100 | 100 | 3,221 s | 0,000079 | 246 ms |
| Desktop | 100 | 100 | 100 | 100 | 0,802 s | 0,000022 | 0 ms |

Todos os valores são medianas. No mobile, a primeira execução apresentou TBT de 365 ms e as demais, 232/246 ms; as pontuações foram 83, 89 e 89. Essa variação está preservada nos relatórios, sem descartar a execução inicial.

## Meta ainda não atingida

Performance mobile está abaixo de 90. O LCP de aproximadamente 3,2 s e o trabalho de JavaScript no início do carregamento são os principais limitadores observados. A aplicação precisa inicializar o MSW antes de importar o cliente Socket.IO; os chunks de mocks, validação, roteamento e renderização participam desse caminho. Os relatórios mostram custo de avaliação de scripts e tarefas longas; não se atribui todo o atraso a uma biblioteca isoladamente.

Foram antecipadas as fontes, separado o carregamento do React DOM e carregados os diálogos sob demanda, preservando o controle de foco e todos os mocks. Um preload adicional da arte não foi mantido porque a medição indicou competição com o JavaScript e piora no LCP. A oportunidade restante é reduzir mais o trabalho inicial sem remover os recursos da demonstração. O custo e a variabilidade da primeira carga precisam ser reavaliados com os demais fluxos prontos.

Esta auditoria cobre somente o início. A auditoria final também precisa incluir o detalhe completo, com três medições por perfil. Estes resultados não representam a conclusão dos requisitos de performance de todo o desafio.

## Reproduzir

```sh
npm ci
npx playwright install chromium
npm run audit:lighthouse -- --page=home
```

Deixe a porta 4173 livre. Os novos resultados serão gravados em `artifacts/lighthouse/`. Abra os arquivos HTML localmente para explorar os detalhes de cada execução.
