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
    <div className="catalog-stories mt-24 mobile:mt-16">
      <section
        className="promo-banners grid grid-cols-[1fr_1fr] gap-7 mobile:grid-cols-1 mobile:gap-4"
        aria-label="Explore coleções"
      >
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
          <div
            className="promo-banner grid grid-cols-[49%_minmax(0,1fr)] rounded-md overflow-hidden bg-card min-h-62.5 [&_>_img]:h-62.5 [&_>_img]:w-full [&_>_img]:object-cover [&_>_img]:rounded-[20px] [&_>_div]:p-[36px_22px_20px] [&_>_div]:text-right [&_h2]:text-[18px] [&_h2]:font-semibold [&_h2]:leading-6 [&_p]:text-[13px] [&_p]:leading-6 [&_p]:text-muted-foreground [&_p]:mt-3 [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1.5 [&_a]:bg-primary [&_a]:text-background [&_a]:p-[10px_18px] [&_a]:rounded-sm [&_a]:text-[14px] [&_a]:font-semibold tablet:min-h-60 tablet:[&_>_div]:p-[20px_14px] tablet:[&_h2]:text-[15px] tablet:[&_p]:text-[11px] tablet:[&_p]:leading-4.75 mobile:grid-cols-[38%_minmax(0,1fr)] mobile:min-h-52 mobile:rounded-2xl mobile:[&_>_img]:h-full mobile:[&_>_img]:min-h-52 mobile:[&_>_img]:rounded-2xl mobile:[&_>_div]:p-4 mobile:[&_>_div]:text-left mobile:[&_h2]:text-[15px] mobile:[&_h2]:leading-5.5 mobile:[&_p]:mt-2 mobile:[&_p]:text-[12px] mobile:[&_p]:leading-5 mobile:[&_a]:mt-3 mobile:[&_a]:px-3 mobile:[&_a]:py-2 mobile:[&_a]:text-[12px]"
            key={color}
          >
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
      <section
        className="editorial mt-32 [&_>_h2]:text-center [&_>_h2]:text-[28px] [&_>_h2]:font-bold [&_>_p]:text-center [&_>_p]:text-[14px] [&_>_p]:text-muted-foreground [&_>_p]:m-[12px_0_38px] [&_article]:bg-card [&_article]:rounded-md [&_article]:overflow-hidden [&_article_>_img]:w-full [&_article_>_img]:h-49 [&_article_>_img]:object-cover [&_article_>_div]:p-[12px_16px_16px] [&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:leading-5.5 [&_h3+p]:text-[12px] [&_h3+p]:text-muted-foreground [&_h3+p]:mt-2 [&_h3+p]:leading-4.25 [&_article_span]:inline-block [&_article_span]:mt-1.5 [&_article_span]:text-[12px] [&_article_span]:text-primary mobile:mt-12 mobile:[&_>_h2]:text-[22px] mobile:[&_>_p]:text-[13px] mobile:[&_>_p]:leading-5 mobile:[&_>_p]:mb-6 mobile:[&_article]:rounded-2xl mobile:[&_article_>_img]:h-34 mobile:[&_article_>_div]:p-3 mobile:[&_h3]:text-[13px] mobile:[&_h3]:leading-5 mobile:[&_h3+p]:hidden mobile:[&_article_span]:text-[11px]"
        aria-labelledby="diario-titulo"
      >
        <h2 id="diario-titulo">Diário da Cunhagem</h2>
        <p>
          Histórias, guias e insights para colecionadores sobre o universo da
          propriedade digital.
        </p>
        <div className="editorial-grid grid grid-cols-4 gap-6 tablet-compact:grid-cols-[1fr_1fr] mobile:grid-cols-2 mobile:gap-3">
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
                <p className="editorial-date text-muted-foreground text-[11px] mb-2 mobile:text-[10px] mobile:leading-4">
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
