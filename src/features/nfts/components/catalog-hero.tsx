import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { CarouselDots } from '@/components/carousel-dots'

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
      className="catalog-hero relative grid grid-cols-[minmax(0,1fr)_450px] items-center gap-20 min-h-112.5 mb-24 [&_h1]:text-[44px] [&_h1]:font-bold [&_h1]:leading-[1.6] [&_h1]:uppercase [&_h1]:tracking-[-0.9px] tablet:grid-cols-[minmax(0,1fr)_38%] tablet:gap-7 tablet:min-h-80 tablet:mb-16 tablet:[&_h1]:text-[30px] mobile:grid-cols-[minmax(0,1fr)_38%] mobile:gap-3 mobile:items-start mobile:p-[12px_16px_34px] mobile:min-h-47.5 mobile:mb-3.5 mobile:[background:radial-gradient(ellipse_at_15%_20%,#865b35_0%,#57391f_42%,#281b12_80%)] mobile:rounded-[28px] mobile:overflow-hidden mobile:[&_h1]:text-[clamp(15px,4.5vw,18px)] mobile:[&_h1]:leading-normal mobile:[&_h1]:tracking-[-0.4px]"
      aria-roledescription="carrossel"
      aria-label="Destaques da Kurio"
    >
      <div className="hero-copy pl-10 pb-11 tablet:pl-4 mobile:p-0 mobile:min-w-0">
        <p className="hero-eyebrow text-[14px] tracking-[1.5px] mb-3.5 mobile:text-[11px] mobile:tracking-normal mobile:mb-1">
          Bem-vindo à Kurio
        </p>
        <h1>
          <span className="hero-desktop-title mobile:hidden">
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
          <span className="hero-mobile-title hidden mobile:inline">
            {slide.mobile}
          </span>
        </h1>
        <p className="hero-description max-w-145 mt-2 text-muted-foreground text-[14px] leading-6 mobile:max-w-none mobile:mt-1.75 mobile:text-[clamp(11px,2.9vw,12px)] mobile:leading-4.5">
          <span className="hero-desktop-title mobile:hidden">
            Descubra NFTs selecionados de criadores emergentes e consagrados.
            Colecione arte digital rara, apoie artistas e tenha uma parte da
            cultura da internet.
          </span>
          <span className="hero-mobile-title hidden mobile:inline">
            Descubra NFTs selecionados de criadores de todo o mundo.
          </span>
        </p>
        <a
          href="#catalogo"
          className="hero-explore inline-flex items-center justify-center gap-1.25 min-h-10 min-w-35 mt-8 p-[10px_24px] rounded-sm bg-primary text-background uppercase text-[14px] font-bold [&_svg]:hidden mobile:min-h-6 mobile:min-w-0 mobile:mt-0 mobile:p-0 mobile:[background:none] mobile:text-primary mobile:text-[12px] mobile:[&_svg]:block"
        >
          Explorar <ArrowRight size={18} aria-hidden="true" />
        </a>
      </div>
      <img
        className="hero-image w-112.5 h-112.5 rounded-3xl object-cover tablet:w-full tablet:h-auto tablet:aspect-[1] mobile:w-full mobile:h-auto mobile:aspect-[1] mobile:rounded-[18px]"
        src={`/nfts/jungle-${slide.image}.png`}
        alt={slide.alt}
        width={450}
        height={450}
        fetchPriority="high"
      />
      <CarouselDots
        count={slides.length}
        active={active}
        onSelect={setActive}
        label="Selecionar destaque"
        buttonLabel="Destaque"
        className="hero-dots absolute bottom-7.75 left-[calc(50%-16px)] tablet:bottom-0 mobile:bottom-0 mobile:left-[calc(50%-36px)]"
      />
    </section>
  )
}
