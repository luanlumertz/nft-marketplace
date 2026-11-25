import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { catalogDefaults } from '../catalog-search'

const stories = [
  [
    'gray',
    '12 de setembro',
    '6',
    'Como funciona a propriedade de NFTs',
    'Aprenda a colecionar, negociar e verificar ativos digitais.',
  ],
  [
    'green',
    '13 de setembro',
    '2',
    '10 artistas digitais para acompanhar',
    'Conheça criadores que moldam a cultura digital.',
  ],
  [
    'violet',
    '15 de setembro',
    '3',
    'Raridade, atributos e procedência',
    'Entenda raridade, procedência, direitos autorais e utilidade.',
  ],
  [
    'orange',
    '15 de setembro',
    '2',
    'Como proteger sua carteira',
    'Proteja sua carteira, seus ativos e sua identidade.',
  ],
]
export function CatalogStories() {
  return (
    <div className="catalog-stories">
      <section className="promo-banners" aria-label="Explore coleções">
        {[
          [
            'green',
            'Lançamentos gênesis de edição limitada',
            'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
            'new',
          ],
          [
            'gray',
            'Arte digital selecionada e muito mais',
            'Explore novos artistas, coleções verificadas e obras que definem a cultura digital.',
            'all',
          ],
        ].map(([color, title, text, tab]) => (
          <div className="promo-banner" key={color}>
            <img
              src={`/nfts/jungle-${color}.png`}
              alt=""
              width={288}
              height={250}
              loading="lazy"
            />
            <div>
              <h2>{title}</h2>
              <p>{text}</p>
              <Link
                to="/"
                search={{
                  ...catalogDefaults,
                  tab: tab === 'new' ? 'new' : 'all',
                }}
                hash="catalogo"
              >
                Explorar <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        ))}
      </section>
      <section className="editorial" aria-labelledby="diario-titulo">
        <h2 id="diario-titulo">Diário da Cunhagem</h2>
        <p>
          Histórias, guias e insights para colecionadores sobre o universo da
          propriedade digital.
        </p>
        <div className="editorial-grid">
          {stories.map(([image, date, minutes, title, text]) => (
            <article key={title}>
              <img
                src={`/nfts/jungle-${image}.png`}
                alt=""
                width={268}
                height={196}
                loading="lazy"
              />
              <div>
                <p className="editorial-date">
                  {date} | Leitura de {minutes} min
                </p>
                <h3>{title}</h3>
                <p>{text}</p>
                <span
                  aria-disabled="true"
                  title="Conteúdo editorial indisponível nesta demonstração"
                >
                  Ler mais →
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
