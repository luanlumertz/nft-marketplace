import { useState } from 'react'
import { ArrowRight } from 'lucide-react'

const slides = [
  {
    image: 'green',
    alt: 'Emerald Ape com óculos e jaqueta verde',
    title: 'Seja dono do futuro da arte digital',
    mobile: 'Seja dono da cultura digital',
  },
  {
    image: 'violet',
    alt: 'Sage Nomad com chapéu e moletom violeta',
    title: 'Colecione histórias em cada edição',
    mobile: 'Arte rara, histórias únicas',
  },
  {
    image: 'gray',
    alt: 'Ivory Baron com blazer claro',
    title: 'Descubra sua próxima coleção',
    mobile: 'Encontre sua próxima coleção',
  },
] as const

export function CatalogHero() {
  const [active, setActive] = useState(0)
  const slide = slides[active]
  return (
    <section
      className="catalog-hero"
      aria-roledescription="carrossel"
      aria-label="Destaques da Kurio"
    >
      <div className="hero-copy">
        <p className="hero-eyebrow">Bem-vindo à Kurio</p>
        <h1>
          <span className="hero-desktop-title">
            {active === 0 ? (
              <>
                Seja dono do futuro
                <br />
                da arte digital
              </>
            ) : (
              slide.title
            )}
          </span>
          <span className="hero-mobile-title">{slide.mobile}</span>
        </h1>
        <p className="hero-description">
          <span className="hero-desktop-title">
            Descubra NFTs selecionados de criadores emergentes e consagrados.
            Colecione arte digital rara, apoie artistas e tenha uma parte da
            cultura da internet.
          </span>
          <span className="hero-mobile-title">
            Descubra NFTs selecionados de criadores de todo o mundo.
          </span>
        </p>
        <a href="#catalogo" className="hero-explore">
          Explorar <ArrowRight size={18} aria-hidden="true" />
        </a>
      </div>
      <img
        className="hero-image"
        src={`/nfts/jungle-${slide.image}.png`}
        alt={slide.alt}
        width={450}
        height={450}
        fetchPriority="high"
      />
      <div className="hero-dots" aria-label="Selecionar destaque">
        {slides.map((item, index) => (
          <button
            key={item.image}
            aria-label={`Destaque ${index + 1}`}
            aria-pressed={index === active}
            onClick={() => setActive(index)}
          >
            <span />
          </button>
        ))}
      </div>
    </section>
  )
}
